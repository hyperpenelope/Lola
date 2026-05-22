#!/usr/bin/env python3
from __future__ import annotations

import queue
import threading
import time
import wave
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import sounddevice as sd
from pythonosc.udp_client import SimpleUDPClient

from comms import Comms, TOPIC_NOTE_EVENT, TOPIC_SAMPLE_EVENT
from config import ConfigStore
from models import NoteEvent, SampleEvent


DEFAULTS: Dict[str, Any] = {
    "playback": {
        "sample_rate": 16000,
        "device_out": None,
        "block_size": 1024,
        "master_gain": 0.35,
        "fade_ms": 10,
        "queue_size": 256,
        "midi_out_only": True,
        "osc_midi_enabled": True,
        "osc_midi_host": "127.0.0.1",
        "osc_midi_port": 5001,
        "osc_midi_address": "/midi",
    }
}


class PlaybackEngine:
    def __init__(self, config: ConfigStore, comms: Comms):
        self.config = config
        self.comms = comms

        self.stop_event = threading.Event()
        self.thread: Optional[threading.Thread] = None
        self.note_queue: Optional[queue.Queue] = None
        self.sample_queue: Optional[queue.Queue] = None

        self._voices_lock = threading.RLock()
        self._voices: List[Dict[str, Any]] = []

        self._osc_client: Optional[SimpleUDPClient] = None
        self._osc_host: Optional[str] = None
        self._osc_port: Optional[int] = None

        self._sample_cache: Dict[str, Tuple[int, np.ndarray]] = {}

    def _cfg(self) -> Dict[str, Any]:
        merged = dict(DEFAULTS["playback"])
        current = self.config.get("playback", {}) or {}
        merged.update(current)
        return merged

    def start(self) -> None:
        if self.thread is not None and self.thread.is_alive():
            return

        cfg = self._cfg()
        self.note_queue = self.comms.open_queue(TOPIC_NOTE_EVENT, maxsize=int(cfg["queue_size"]))
        self.sample_queue = self.comms.open_queue(TOPIC_SAMPLE_EVENT, maxsize=int(cfg["queue_size"]))

        self.stop_event.clear()
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()

    def close(self) -> None:
        if self.note_queue is not None:
            self.comms.close_queue(TOPIC_NOTE_EVENT, self.note_queue)
            self.note_queue = None

        if self.sample_queue is not None:
            self.comms.close_queue(TOPIC_SAMPLE_EVENT, self.sample_queue)
            self.sample_queue = None

    def _ensure_osc_client(self) -> Optional[SimpleUDPClient]:
        cfg = self._cfg()

        if not bool(cfg["osc_midi_enabled"]):
            self._osc_client = None
            self._osc_host = None
            self._osc_port = None
            return None

        host = str(cfg["osc_midi_host"])
        port = int(cfg["osc_midi_port"])

        if self._osc_client is None or host != self._osc_host or port != self._osc_port:
            self._osc_client = SimpleUDPClient(host, port)
            self._osc_host = host
            self._osc_port = port

        return self._osc_client

    @staticmethod
    def midi_to_hz(note: int) -> float:
        return 440.0 * (2.0 ** ((int(note) - 69) / 12.0))

    def synth_note(self, note: int, velocity: int, duration: float) -> np.ndarray:
        cfg = self._cfg()
        sample_rate = int(cfg["sample_rate"])
        master_gain = float(cfg["master_gain"])
        fade_ms = int(cfg["fade_ms"])

        duration = max(0.02, float(duration))
        velocity = int(np.clip(int(velocity), 1, 127))
        freq_hz = self.midi_to_hz(note)

        length = max(1, int(duration * sample_rate))
        t = np.arange(length, dtype=np.float32) / sample_rate

        amp = master_gain * (velocity / 127.0)
        wave_audio = amp * np.sin(2.0 * np.pi * freq_hz * t)

        fade_samples = min(int(sample_rate * fade_ms / 1000), length // 2)
        if fade_samples > 0:
            env = np.ones(length, dtype=np.float32)
            env[:fade_samples] *= np.linspace(0.0, 1.0, fade_samples)
            env[-fade_samples:] *= np.linspace(1.0, 0.0, fade_samples)
            wave_audio *= env

        return wave_audio.astype(np.float32)

    def add_voice(self, audio: np.ndarray) -> None:
        if len(audio) == 0:
            return

        with self._voices_lock:
            self._voices.append(
                {
                    "audio": audio.astype(np.float32, copy=False),
                    "index": 0,
                }
            )

    def audio_callback(self, outdata, frames, time_info, status) -> None:
        if status:
            print(f"[PLAYBACK STATUS] {status}")

        out = np.zeros(frames, dtype=np.float32)

        with self._voices_lock:
            remaining_voices: List[Dict[str, Any]] = []

            for voice in self._voices:
                audio = voice["audio"]
                index = int(voice["index"])

                if index >= len(audio):
                    continue

                n = min(frames, len(audio) - index)
                out[:n] += audio[index:index + n]
                voice["index"] = index + n

                if voice["index"] < len(audio):
                    remaining_voices.append(voice)

            self._voices = remaining_voices

        peak = float(np.max(np.abs(out))) if len(out) else 0.0
        if peak > 1.0:
            out /= peak

        outdata[:, 0] = out

    def send_osc_midi(self, event: NoteEvent) -> None:
        client = self._ensure_osc_client()
        if client is None:
            return

        cfg = self._cfg()
        address = str(cfg["osc_midi_address"])

        channel = int(event.channel if event.channel is not None else (event.voice or 1))
        note = int(event.note)
        velocity = int(np.clip(event.velocity, 1, 127))
        duration = float(max(0.01, event.duration))

        payload = [channel, note, velocity, duration]

        try:
            client.send_message(address, payload)
            print(
                f"[MIDI OSC] ch={channel} note={note} velocity={velocity} "
                f"duration={duration:.3f}s word={event.word.text}"
            )
        except Exception as e:
            print(f"[MIDI OSC ERROR] {e}")

    def handle_note_event(self, event: NoteEvent) -> None:
        cfg = self._cfg()

        if bool(cfg["osc_midi_enabled"]):
            self.send_osc_midi(event)

        if bool(cfg["midi_out_only"]):
            return

        audio = self.synth_note(
            note=event.note,
            velocity=event.velocity,
            duration=event.duration,
        )
        self.add_voice(audio)

        print(
            f"[PLAYBACK] note={event.note} velocity={event.velocity} "
            f"duration={event.duration:.3f}s word={event.word.text}"
        )

    def _load_wav(self, path: str) -> Tuple[int, np.ndarray]:
        resolved = str(Path(path).expanduser().resolve())

        if resolved in self._sample_cache:
            return self._sample_cache[resolved]

        with wave.open(resolved, "rb") as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            sample_rate = wf.getframerate()
            frames = wf.getnframes()
            raw = wf.readframes(frames)

        if sample_width == 1:
            data = np.frombuffer(raw, dtype=np.uint8).astype(np.float32)
            data = (data - 128.0) / 128.0
        elif sample_width == 2:
            data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        elif sample_width == 3:
            raw_u8 = np.frombuffer(raw, dtype=np.uint8)
            triples = raw_u8.reshape(-1, 3)

            signed = (
                    triples[:, 0].astype(np.int32)
                    | (triples[:, 1].astype(np.int32) << 8)
                    | (triples[:, 2].astype(np.int32) << 16)
            )

            sign_bit = 1 << 23
            signed = (signed ^ sign_bit) - sign_bit
            data = signed.astype(np.float32) / 8388608.0
        elif sample_width == 4:
            data = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
        else:
            raise ValueError(f"Unsupported WAV sample width: {sample_width}")

        if channels > 1:
            data = data.reshape(-1, channels).mean(axis=1)

        data = data.astype(np.float32, copy=False)
        self._sample_cache[resolved] = (sample_rate, data)
        return sample_rate, data

    def _resample_audio(self, audio: np.ndarray, src_rate: int, dst_rate: int) -> np.ndarray:
        if src_rate == dst_rate or len(audio) == 0:
            return audio.astype(np.float32, copy=False)

        duration = len(audio) / float(src_rate)
        dst_len = max(1, int(round(duration * dst_rate)))

        src_positions = np.linspace(0, len(audio) - 1, num=len(audio), dtype=np.float32)
        dst_positions = np.linspace(0, len(audio) - 1, num=dst_len, dtype=np.float32)
        out = np.interp(dst_positions, src_positions, audio).astype(np.float32)
        return out

    def _apply_rate(self, audio: np.ndarray, rate: float) -> np.ndarray:
        if len(audio) == 0:
            return audio

        rate = max(0.05, float(rate))
        positions = np.arange(0, len(audio), rate, dtype=np.float32)
        positions = positions[positions <= (len(audio) - 1)]
        if len(positions) == 0:
            return np.array([], dtype=np.float32)

        src_positions = np.arange(len(audio), dtype=np.float32)
        out = np.interp(positions, src_positions, audio).astype(np.float32)
        return out

    def _one_pole_lowpass(self, audio: np.ndarray, cutoff_hz: Optional[float], sample_rate: int) -> np.ndarray:
        if cutoff_hz is None or cutoff_hz <= 0.0 or len(audio) == 0:
            return audio

        dt = 1.0 / sample_rate
        rc = 1.0 / (2.0 * np.pi * cutoff_hz)
        alpha = dt / (rc + dt)

        out = np.empty_like(audio)
        out[0] = audio[0]
        for i in range(1, len(audio)):
            out[i] = out[i - 1] + alpha * (audio[i] - out[i - 1])
        return out

    def _one_pole_highpass(self, audio: np.ndarray, cutoff_hz: Optional[float], sample_rate: int) -> np.ndarray:
        if cutoff_hz is None or cutoff_hz <= 0.0 or len(audio) == 0:
            return audio

        dt = 1.0 / sample_rate
        rc = 1.0 / (2.0 * np.pi * cutoff_hz)
        alpha = rc / (rc + dt)

        out = np.empty_like(audio)
        out[0] = audio[0]
        for i in range(1, len(audio)):
            out[i] = alpha * (out[i - 1] + audio[i] - audio[i - 1])
        return out

    def _apply_delay(
        self,
        audio: np.ndarray,
        delay_mix: float,
        delay_time_sec: float,
        delay_feedback: float,
        sample_rate: int,
    ) -> np.ndarray:
        if len(audio) == 0 or delay_mix <= 0.0 or delay_time_sec <= 0.0:
            return audio

        delay_mix = float(np.clip(delay_mix, 0.0, 1.0))
        delay_feedback = float(np.clip(delay_feedback, 0.0, 0.95))

        delay_samples = max(1, int(delay_time_sec * sample_rate))
        tail_repeats = 4
        out = np.zeros(len(audio) + delay_samples * tail_repeats, dtype=np.float32)
        out[:len(audio)] += audio * (1.0 - delay_mix)

        gain = delay_mix
        offset = delay_samples
        for _ in range(tail_repeats):
            out[offset:offset + len(audio)] += audio * gain
            gain *= delay_feedback
            offset += delay_samples

        return out

    def _apply_reverb(self, audio: np.ndarray, reverb_mix: float, sample_rate: int) -> np.ndarray:
        if len(audio) == 0 or reverb_mix <= 0.0:
            return audio

        reverb_mix = float(np.clip(reverb_mix, 0.0, 1.0))

        taps = [
            (0.031, 0.32),
            (0.047, 0.24),
            (0.071, 0.18),
            (0.103, 0.12),
        ]

        max_delay = max(int(t * sample_rate) for t, _ in taps)
        wet = np.zeros(len(audio) + max_delay, dtype=np.float32)

        for delay_sec, gain in taps:
            d = max(1, int(delay_sec * sample_rate))
            wet[d:d + len(audio)] += audio * (gain * reverb_mix)

        dry = np.zeros_like(wet)
        dry[:len(audio)] = audio * (1.0 - 0.5 * reverb_mix)

        return dry + wet

    def _apply_distortion(self, audio: np.ndarray, drive: float) -> np.ndarray:
        if len(audio) == 0 or drive <= 0.0:
            return audio

        drive = float(max(0.0, drive))
        shaped = np.tanh(audio * (1.0 + drive * 6.0))
        norm = np.tanh(1.0 + drive * 6.0)
        if norm > 1e-6:
            shaped = shaped / norm
        return shaped.astype(np.float32)

    def _apply_fade(self, audio: np.ndarray, fade_ms: int, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio

        fade_samples = min(int(sample_rate * fade_ms / 1000), len(audio) // 2)
        if fade_samples <= 0:
            return audio

        env = np.ones(len(audio), dtype=np.float32)
        env[:fade_samples] *= np.linspace(0.0, 1.0, fade_samples)
        env[-fade_samples:] *= np.linspace(1.0, 0.0, fade_samples)
        return audio * env

    def build_sample_audio(self, event: SampleEvent) -> np.ndarray:
        cfg = self._cfg()
        sample_rate = int(cfg["sample_rate"])
        master_gain = float(cfg["master_gain"])
        fade_ms = int(cfg["fade_ms"])

        src_rate, audio = self._load_wav(event.sample_path)
        audio = self._resample_audio(audio, src_rate, sample_rate)
        audio = self._apply_rate(audio, event.rate)

        if event.highpass_hz is not None:
            audio = self._one_pole_highpass(audio, event.highpass_hz, sample_rate)

        if event.lowpass_hz is not None:
            audio = self._one_pole_lowpass(audio, event.lowpass_hz, sample_rate)

        audio = self._apply_delay(
            audio,
            delay_mix=event.delay_mix,
            delay_time_sec=event.delay_time_sec,
            delay_feedback=event.delay_feedback,
            sample_rate=sample_rate,
        )

        audio = self._apply_reverb(audio, event.reverb_mix, sample_rate)
        audio = self._apply_distortion(audio, event.distortion_drive)
        audio = self._apply_fade(audio, fade_ms, sample_rate)

        audio = audio * float(event.gain) * master_gain
        audio = np.clip(audio, -1.0, 1.0).astype(np.float32)
        return audio

    def handle_sample_event(self, event: SampleEvent) -> None:
        try:
            audio = self.build_sample_audio(event)
        except Exception as e:
            print(f"[SAMPLE ERROR] line={event.line_name} sample={event.sample_path} error={e}")
            return

        self.add_voice(audio)
        print(
            f"[SAMPLE] line={event.line_name} sample={event.sample_path} "
            f"gain={event.gain:.2f} rate={event.rate:.2f}"
        )

    def run(self) -> None:
        cfg = self._cfg()

        with sd.OutputStream(
            samplerate=int(cfg["sample_rate"]),
            blocksize=int(cfg["block_size"]),
            device=cfg["device_out"],
            channels=1,
            dtype="float32",
            callback=self.audio_callback,
        ):
            print("[PLAYBACK] Running...")

            try:
                while not self.stop_event.is_set():
                    did_work = False

                    if self.note_queue is not None:
                        while True:
                            try:
                                event = self.note_queue.get_nowait()
                            except queue.Empty:
                                break

                            if isinstance(event, NoteEvent):
                                self.handle_note_event(event)
                                did_work = True

                    if self.sample_queue is not None:
                        while True:
                            try:
                                event = self.sample_queue.get_nowait()
                            except queue.Empty:
                                break

                            if isinstance(event, SampleEvent):
                                self.handle_sample_event(event)
                                did_work = True

                    if not did_work:
                        time.sleep(0.01)
            finally:
                self.close()
                sd.stop()
                with self._voices_lock:
                    self._voices.clear()
                print("[PLAYBACK] Stopped.")