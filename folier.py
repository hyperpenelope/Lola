#!/usr/bin/env python3
from __future__ import annotations

import queue
import random
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from comms import Comms, TOPIC_SAMPLE_EVENT, TOPIC_UTTERANCE
from config import ConfigStore
from models import SampleEvent, Utterance


DEFAULTS: Dict[str, Any] = {
    "folier": {
        "enabled": False,
        "tick_sec": 0.25,
        "activity_per_word": 1.0,
        "activity_decay_per_sec": 0.08,
        "activity_max": 100.0,
        "samples_root": "samples",
        "lines": [],
    }
}


@dataclass
class FolierLineRuntime:
    name: str
    next_at: float = 0.0
    active_untils: List[float] = field(default_factory=list)
    cluster_remaining: int = 0


class Folier:
    def __init__(self, config: ConfigStore, comms: Comms):
        self.config = config
        self.comms = comms

        self.stop_event = threading.Event()
        self.thread: Optional[threading.Thread] = None

        self.utterance_queue: Optional[queue.Queue] = None

        self.activity: float = 0.0
        self.line_runtime: Dict[str, FolierLineRuntime] = {}

    def _cfg(self) -> Dict[str, Any]:
        merged = dict(DEFAULTS["folier"])
        current = self.config.get("folier", {}) or {}
        merged.update(current)
        return merged

    def start(self) -> None:
        if self.thread is not None and self.thread.is_alive():
            return

        self.stop_event.clear()
        self.utterance_queue = self.comms.open_queue(TOPIC_UTTERANCE, maxsize=128)
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()

    def close(self) -> None:
        if self.utterance_queue is not None:
            self.comms.close_queue(TOPIC_UTTERANCE, self.utterance_queue)
            self.utterance_queue = None

    def run(self) -> None:
        print("[FOLIER] Running...")

        try:
            last_time = time.perf_counter()

            while not self.stop_event.is_set():
                cfg = self._cfg()
                now = time.perf_counter()
                dt = max(0.0, now - last_time)
                last_time = now

                if not bool(cfg["enabled"]):
                    self._drain_utterances()
                    time.sleep(float(cfg["tick_sec"]))
                    continue

                self._drain_utterances()
                self._decay_activity(dt)
                self._sync_line_runtime()

                for line in self._enabled_lines():
                    self._tick_line(line, now)

                time.sleep(float(cfg["tick_sec"]))
        finally:
            self.close()
            print("[FOLIER] Stopped.")

    def _drain_utterances(self) -> None:
        if self.utterance_queue is None:
            return

        cfg = self._cfg()
        activity_per_word = float(cfg["activity_per_word"])
        activity_max = float(cfg["activity_max"])

        while True:
            try:
                utterance = self.utterance_queue.get_nowait()
            except queue.Empty:
                break

            if not isinstance(utterance, Utterance):
                continue

            word_count = len(utterance.words)
            self.activity = float(np.clip(
                self.activity + word_count * activity_per_word,
                0.0,
                activity_max,
            ))

    def _decay_activity(self, dt: float) -> None:
        cfg = self._cfg()
        decay = float(cfg["activity_decay_per_sec"])
        self.activity = max(0.0, self.activity - decay * dt)

    def _enabled_lines(self) -> List[Dict[str, Any]]:
        lines = self._cfg().get("lines", []) or []
        return [line for line in lines if bool(line.get("enabled", True))]

    def _sync_line_runtime(self) -> None:
        active_names = {str(line.get("name", "")).strip() for line in self._enabled_lines()}
        active_names = {name for name in active_names if name}

        for name in list(self.line_runtime.keys()):
            if name not in active_names:
                del self.line_runtime[name]

        now = time.perf_counter()
        for name in active_names:
            if name not in self.line_runtime:
                self.line_runtime[name] = FolierLineRuntime(name=name, next_at=now)

    def _line_runtime(self, line: Dict[str, Any]) -> FolierLineRuntime:
        name = str(line.get("name", "")).strip()
        if name not in self.line_runtime:
            self.line_runtime[name] = FolierLineRuntime(name=name, next_at=time.perf_counter())
        return self.line_runtime[name]

    def _line_value(self, line: Dict[str, Any], key: str, default: float) -> float:
        try:
            return float(line.get(key, default))
        except (TypeError, ValueError):
            return float(default)

    def _clamp(self, value: float, lo: float, hi: float) -> float:
        return float(np.clip(value, lo, hi))

    def _modulated(self, line: Dict[str, Any], base_key: str, per_activity_key: str, default: float) -> float:
        base = self._line_value(line, base_key, default)
        per_activity = self._line_value(line, per_activity_key, 0.0)
        return base + per_activity * self.activity

    def _active_count(self, runtime: FolierLineRuntime, now: float) -> int:
        runtime.active_untils = [t for t in runtime.active_untils if t > now]
        return len(runtime.active_untils)

    def _choose_next_gap(self, line: Dict[str, Any], runtime: FolierLineRuntime) -> float:
        epm = max(0.001, self._modulated(line, "base_epm", "epm_per_activity", 1.0))
        mean_gap = 60.0 / epm

        mode = str(line.get("mode", "sporadic")).lower()

        if mode == "bed":
            return random.uniform(mean_gap * 0.45, mean_gap * 1.10)

        if mode == "clustered":
            if runtime.cluster_remaining > 0:
                runtime.cluster_remaining -= 1
                return random.uniform(mean_gap * 0.12, mean_gap * 0.35)

            if random.random() < 0.28:
                runtime.cluster_remaining = random.randint(1, 3)
                return random.uniform(mean_gap * 0.7, mean_gap * 1.3)

            return random.uniform(mean_gap * 1.2, mean_gap * 2.2)

        return random.uniform(mean_gap * 0.8, mean_gap * 1.8)

    def _pick_sample_path(self, line: Dict[str, Any]) -> Optional[str]:
        cfg = self._cfg()

        line_name = str(line.get("name", "")).strip()
        if not line_name:
            return None

        samples_root = Path(str(cfg.get("samples_root", "samples/folier"))).expanduser()
        line_dir = samples_root / line_name

        if not line_dir.is_dir():
            return None

        paths = []
        for path in sorted(line_dir.iterdir()):
            if not path.is_file():
                continue
            if path.suffix.lower() not in {".wav"}:
                continue
            paths.append(str(path))

        if not paths:
            return None

        return random.choice(paths)

    def _choose_gain(self, line: Dict[str, Any]) -> float:
        gain_min = self._modulated(line, "gain_min", "gain_per_activity", 0.2)
        gain_max = self._modulated(line, "gain_max", "gain_per_activity", 0.5)
        if gain_max < gain_min:
            gain_max = gain_min
        return random.uniform(gain_min, gain_max)

    def _choose_rate(self, line: Dict[str, Any]) -> float:
        rate_min = self._modulated(line, "rate_min", "rate_per_activity", 0.95)
        rate_max = self._modulated(line, "rate_max", "rate_per_activity", 1.05)
        if rate_max < rate_min:
            rate_max = rate_min
        return random.uniform(rate_min, rate_max)

    def _choose_lowpass(self, line: Dict[str, Any]) -> Optional[float]:
        value = self._modulated(line, "lowpass_hz", "lowpass_per_activity", 0.0)
        return None if value <= 0.0 else value

    def _choose_highpass(self, line: Dict[str, Any]) -> Optional[float]:
        value = self._modulated(line, "highpass_hz", "highpass_per_activity", 0.0)
        return None if value <= 0.0 else value

    def _choose_delay_mix(self, line: Dict[str, Any]) -> float:
        return self._clamp(
            self._modulated(line, "delay_mix", "delay_mix_per_activity", 0.0),
            0.0,
            1.0,
        )

    def _choose_delay_time(self, line: Dict[str, Any]) -> float:
        lo = self._line_value(line, "delay_time_min", 0.15)
        hi = self._line_value(line, "delay_time_max", 0.4)
        if hi < lo:
            hi = lo
        return random.uniform(lo, hi)

    def _choose_delay_feedback(self, line: Dict[str, Any]) -> float:
        lo = self._line_value(line, "delay_feedback_min", 0.15)
        hi = self._line_value(line, "delay_feedback_max", 0.45)
        if hi < lo:
            hi = lo
        return random.uniform(lo, hi)

    def _choose_reverb_mix(self, line: Dict[str, Any]) -> float:
        return self._clamp(
            self._modulated(line, "reverb_mix", "reverb_mix_per_activity", 0.0),
            0.0,
            1.0,
        )

    def _choose_distortion(self, line: Dict[str, Any]) -> float:
        return max(0.0, self._modulated(line, "distortion_drive", "distortion_per_activity", 0.0))

    def _estimate_duration(self, line: Dict[str, Any], rate: float) -> float:
        min_sec = self._line_value(line, "min_duration_sec", 1.0)
        max_sec = self._line_value(line, "max_duration_sec", 6.0)
        if max_sec < min_sec:
            max_sec = min_sec
        base = random.uniform(min_sec, max_sec)
        return max(0.05, base / max(0.01, rate))

    def _tick_line(self, line: Dict[str, Any], now: float) -> None:
        runtime = self._line_runtime(line)
        active_count = self._active_count(runtime, now)
        max_polyphony = int(line.get("max_polyphony", 1))

        if now < runtime.next_at:
            return

        if active_count >= max_polyphony:
            runtime.next_at = now + self._choose_next_gap(line, runtime)
            return

        sample_path = self._pick_sample_path(line)
        if not sample_path:
            runtime.next_at = now + self._choose_next_gap(line, runtime)
            return

        rate = self._choose_rate(line)
        duration = self._estimate_duration(line, rate)

        event = SampleEvent(
            sample_path=sample_path,
            gain=self._choose_gain(line),
            rate=rate,
            lowpass_hz=self._choose_lowpass(line),
            highpass_hz=self._choose_highpass(line),
            delay_mix=self._choose_delay_mix(line),
            delay_time_sec=self._choose_delay_time(line),
            delay_feedback=self._choose_delay_feedback(line),
            reverb_mix=self._choose_reverb_mix(line),
            distortion_drive=self._choose_distortion(line),
            line_name=str(line.get("name", "")),
            meta={
                "source": "folier",
                "line_name": line.get("name"),
                "activity": self.activity,
                "mode": line.get("mode", "sporadic"),
            },
        )

        self.comms.send(TOPIC_SAMPLE_EVENT, event)
        runtime.active_untils.append(now + duration)
        runtime.next_at = now + self._choose_next_gap(line, runtime)

        print(
            f"[FOLIER] line={event.line_name} sample={sample_path} "
            f"gain={event.gain:.2f} rate={event.rate:.2f} dur≈{duration:.2f}s"
        )