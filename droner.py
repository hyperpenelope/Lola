#!/usr/bin/env python3
from __future__ import annotations

import queue
import random
import threading
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from comms import Comms, TOPIC_NOTE_EVENT, TOPIC_STATE_UPDATE
from config import ConfigStore
from models import NoteEvent, StateUpdate, Word


MODE_INTERVALS = {
    "ionian":     [0, 2, 4, 5, 7, 9, 11, 12],
    "dorian":     [0, 2, 3, 5, 7, 9, 10, 12],
    "phrygian":   [0, 1, 3, 5, 7, 8, 10, 12],
    "lydian":     [0, 2, 4, 6, 7, 9, 11, 12],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10, 12],
    "aeolian":    [0, 2, 3, 5, 7, 8, 10, 12],
    "locrian":    [0, 1, 3, 5, 6, 8, 10, 12],
}


DEFAULTS: Dict[str, Any] = {
    "droner": {
        "enabled": False,
        "tick_sec": 0.25,
        "tonic_midi": 45,
        "base_channel": 40,
        "min_active_voices": 1,
        "max_active_voices": 4,
        "register_min_midi": 36,
        "register_max_midi": 72,
        "min_note_duration_sec": 3.0,
        "max_note_duration_sec": 10.0,
        "min_gap_sec": 1.0,
        "max_gap_sec": 6.0,
        "velocity_min": 30,
        "velocity_max": 72,
    }
}


@dataclass
class ActiveDroneNote:
    slot: int
    note: int
    ends_at: float


class Droner:
    def __init__(self, config: ConfigStore, comms: Comms):
        self.config = config
        self.comms = comms

        self.stop_event = threading.Event()
        self.thread: Optional[threading.Thread] = None
        self.state_queue: Optional[queue.Queue] = None

        self.state_values: Dict[str, float] = {
            "global_arousal": 0.5,
            "global_valence": 0.5,
            "global_dominance": 0.5,
        }

        self.active_notes: List[ActiveDroneNote] = []
        self.next_spawn_at: float = 0.0

    def _cfg(self) -> Dict[str, Any]:
        merged = dict(DEFAULTS["droner"])
        current = self.config.get("droner", {}) or {}
        merged.update(current)
        return merged

    def start(self) -> None:
        if self.thread is not None and self.thread.is_alive():
            return

        self.stop_event.clear()
        self.state_queue = self.comms.open_queue(TOPIC_STATE_UPDATE, maxsize=128)
        self.next_spawn_at = time.perf_counter()
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()

    def close(self) -> None:
        if self.state_queue is not None:
            self.comms.close_queue(TOPIC_STATE_UPDATE, self.state_queue)
            self.state_queue = None

    def run(self) -> None:
        print("[DRONER] Running...")

        try:
            while not self.stop_event.is_set():
                cfg = self._cfg()
                self._drain_state_updates()

                if not bool(cfg["enabled"]):
                    time.sleep(float(cfg["tick_sec"]))
                    continue

                now = time.perf_counter()
                self.active_notes = [note for note in self.active_notes if note.ends_at > now]

                min_active = int(cfg["min_active_voices"])
                target_active = self.target_active_voices()

                if len(self.active_notes) < min_active:
                    self.spawn_note(now)
                    continue

                if now >= self.next_spawn_at and len(self.active_notes) < target_active:
                    self.spawn_note(now)
                elif now >= self.next_spawn_at:
                    self.next_spawn_at = now + self.choose_gap_sec(active_full=True)

                time.sleep(float(cfg["tick_sec"]))
        finally:
            self.close()
            print("[DRONER] Stopped.")

    def _drain_state_updates(self) -> None:
        if self.state_queue is None:
            return

        while True:
            try:
                update = self.state_queue.get_nowait()
            except queue.Empty:
                break

            if not isinstance(update, StateUpdate):
                continue

            for key, value in update.values.items():
                try:
                    self.state_values[key] = float(value)
                except (TypeError, ValueError):
                    continue

    def get_state_value(self, name: str, default: float = 0.5) -> float:
        try:
            return float(self.state_values.get(name, default))
        except (TypeError, ValueError):
            return float(default)

    def mode_name_from_valence(self, valence: float) -> str:
        valence = float(np.clip(valence, 0.0, 1.0))

        if valence < 0.15:
            return "locrian"
        if valence < 0.30:
            return "phrygian"
        if valence < 0.43:
            return "aeolian"
        if valence < 0.57:
            return "dorian"
        if valence < 0.70:
            return "mixolydian"
        if valence < 0.85:
            return "ionian"
        return "lydian"

    def target_active_voices(self) -> int:
        cfg = self._cfg()
        minimum = int(cfg["min_active_voices"])
        maximum = int(cfg["max_active_voices"])

        dominance = self.get_state_value("global_dominance", 0.5)
        arousal = self.get_state_value("global_arousal", 0.5)

        density = 0.75 * dominance + 0.25 * arousal
        target = minimum + int(round(density * max(0, maximum - minimum)))
        return int(np.clip(target, minimum, maximum))

    def choose_gap_sec(self, active_full: bool = False) -> float:
        cfg = self._cfg()
        arousal = self.get_state_value("global_arousal", 0.5)

        min_gap = float(cfg["min_gap_sec"])
        max_gap = float(cfg["max_gap_sec"])

        lo = min_gap * (1.0 - 0.45 * arousal)
        hi = max_gap * (1.0 - 0.45 * arousal)

        if active_full:
            lo *= 1.25
            hi *= 1.35

        lo = max(0.05, lo)
        hi = max(lo, hi)

        return random.uniform(lo, hi)

    def choose_duration_sec(self) -> float:
        cfg = self._cfg()
        arousal = self.get_state_value("global_arousal", 0.5)
        dominance = self.get_state_value("global_dominance", 0.5)

        min_dur = float(cfg["min_note_duration_sec"])
        max_dur = float(cfg["max_note_duration_sec"])

        mean = max_dur - (max_dur - min_dur) * arousal
        mean *= 1.0 + 0.12 * (0.5 - dominance)

        spread = max(0.4, mean * 0.28)
        low = max(min_dur, mean - spread)
        high = min(max_dur, mean + spread)

        return random.uniform(low, high)

    def choose_velocity(self) -> int:
        cfg = self._cfg()
        arousal = self.get_state_value("global_arousal", 0.5)

        low = int(cfg["velocity_min"])
        high = int(cfg["velocity_max"])

        base = low + (high - low) * (0.25 + 0.55 * arousal)
        jitter = random.uniform(-6.0, 6.0)
        return int(np.clip(round(base + jitter), low, high))

    def choose_free_slot(self) -> int:
        cfg = self._cfg()
        maximum = int(cfg["max_active_voices"])
        used = {note.slot for note in self.active_notes}

        for slot in range(maximum):
            if slot not in used:
                return slot

        return 0

    def build_mode_candidates(self, mode_name: str) -> List[Tuple[int, int]]:
        cfg = self._cfg()

        tonic = int(cfg["tonic_midi"])
        register_min = int(cfg["register_min_midi"])
        register_max = int(cfg["register_max_midi"])

        intervals = MODE_INTERVALS[mode_name]
        candidates: List[Tuple[int, int]] = []

        for octave in range(-4, 5):
            for degree_index, interval in enumerate(intervals):
                note = tonic + interval + 12 * octave
                if register_min <= note <= register_max:
                    candidates.append((note, degree_index))

        return candidates

    def degree_weight(self, degree_index: int) -> float:
        if degree_index == 0:
            return 5.0
        if degree_index == 4:
            return 3.6
        if degree_index == 2:
            return 2.2
        if degree_index == 7:
            return 1.9
        if degree_index == 1:
            return 0.9
        if degree_index == 5:
            return 0.8
        if degree_index == 3:
            return 0.7
        return 0.25

    def choose_note(self, mode_name: str) -> int:
        cfg = self._cfg()
        dominance = self.get_state_value("global_dominance", 0.5)

        candidates = self.build_mode_candidates(mode_name)
        if not candidates:
            return int(cfg["tonic_midi"])

        register_min = int(cfg["register_min_midi"])
        register_max = int(cfg["register_max_midi"])

        center = np.interp(dominance, [0.0, 1.0], [register_min + 6, register_max - 10])
        focus = np.interp(dominance, [0.0, 1.0], [4.0, 11.0])

        active_pitches = {note.note for note in self.active_notes}

        weighted_notes = []
        weights = []

        for note, degree_index in candidates:
            degree_w = self.degree_weight(degree_index)
            distance_w = float(np.exp(-abs(note - center) / max(1.0, focus)))
            repeat_penalty = 0.22 if note in active_pitches else 1.0
            weight = degree_w * distance_w * repeat_penalty

            weighted_notes.append(note)
            weights.append(max(0.0001, weight))

        return int(random.choices(weighted_notes, weights=weights, k=1)[0])

    def spawn_note(self, now: float) -> None:
        cfg = self._cfg()

        valence = self.get_state_value("global_valence", 0.5)
        mode_name = self.mode_name_from_valence(valence)

        slot = self.choose_free_slot()
        channel = int(cfg["base_channel"]) + slot
        note = self.choose_note(mode_name)
        duration = self.choose_duration_sec()
        velocity = self.choose_velocity()

        word = Word(
            text="[drone]",
            features={},
            meta={
                "source": "droner",
                "mode_name": mode_name,
                "slot": slot,
            },
        )

        event = NoteEvent(
            word=word,
            note=note,
            velocity=velocity,
            duration=duration,
            voice=slot + 1,
            channel=channel,
            meta={
                "source": "droner",
                "mode_name": mode_name,
                "slot": slot,
            },
        )

        self.comms.send(TOPIC_NOTE_EVENT, event)

        self.active_notes.append(
            ActiveDroneNote(
                slot=slot,
                note=note,
                ends_at=now + duration,
            )
        )

        self.next_spawn_at = now + self.choose_gap_sec(active_full=False)

        print(
            f"[DRONER] ch={channel} slot={slot + 1} note={note} "
            f"dur={duration:.2f}s vel={velocity} mode={mode_name}"
        )