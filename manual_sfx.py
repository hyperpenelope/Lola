from __future__ import annotations

import random
import threading
import time
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np

from comms import Comms, TOPIC_SAMPLE_EVENT
from config import ConfigStore
from models import SampleEvent


DEFAULTS: Dict[str, Any] = {
    "manual_sfx": {
        "enabled": True,
        "tick_sec": 0.2,
        "samples_root": "samples",
        "items": {
            "thunder": {
                "loopable": False,
                "gain_min": 0.75,
                "gain_max": 1.0,
                "rate_min": 0.92,
                "rate_max": 1.04,
                "lowpass_hz": 0.0,
                "highpass_hz": 20.0,
                "delay_mix": 0.10,
                "delay_time_min": 0.22,
                "delay_time_max": 0.40,
                "delay_feedback_min": 0.18,
                "delay_feedback_max": 0.32,
                "reverb_mix": 0.28,
                "distortion_drive": 0.04,
                "loop_gap_min_sec": 8.0,
                "loop_gap_max_sec": 14.0,
            },
            "rain": {
                "loopable": True,
                "gain_min": 0.78,
                "gain_max": 0.82,
                "rate_min": 0.96,
                "rate_max": 1.04,
                "lowpass_hz": 12000.0,
                "highpass_hz": 60.0,
                "delay_mix": 0.03,
                "delay_time_min": 0.16,
                "delay_time_max": 0.28,
                "delay_feedback_min": 0.12,
                "delay_feedback_max": 0.22,
                "reverb_mix": 0.14,
                "distortion_drive": 0.0,
                "loop_gap_min_sec": 4.0,
                "loop_gap_max_sec": 0.0,
            },
            "wind": {
                "loopable": True,
                "gain_min": 0.14,
                "gain_max": 0.28,
                "rate_min": 0.88,
                "rate_max": 1.02,
                "lowpass_hz": 8000.0,
                "highpass_hz": 40.0,
                "delay_mix": 0.08,
                "delay_time_min": 0.26,
                "delay_time_max": 0.46,
                "delay_feedback_min": 0.18,
                "delay_feedback_max": 0.34,
                "reverb_mix": 0.22,
                "distortion_drive": 0.01,
                "loop_gap_min_sec": 7.0,
                "loop_gap_max_sec": 16.0,
            },
        },
    }
}


class ManualSfx:
    VALID_NAMES = {"thunder", "rain", "wind"}
    VALID_ACTIONS = {"trigger_once", "loop_on", "loop_off"}

    def __init__(self, config: ConfigStore, comms: Comms):
        self.config = config
        self.comms = comms

        self.stop_event = threading.Event()
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.RLock()

        self.looping: Dict[str, bool] = {
            "thunder": False,
            "rain": False,
            "wind": False,
        }
        self.next_at: Dict[str, float] = {
            "thunder": 0.0,
            "rain": 0.0,
            "wind": 0.0,
        }

    def _cfg(self) -> Dict[str, Any]:
        merged = dict(DEFAULTS["manual_sfx"])
        current = self.config.get("manual_sfx", {}) or {}
        merged.update(current)
        return merged

    def _item_cfg(self, name: str) -> Dict[str, Any]:
        cfg = self._cfg()
        items = cfg.get("items", {}) or {}
        merged = dict(DEFAULTS["manual_sfx"]["items"][name])
        merged.update(items.get(name, {}) or {})
        return merged

    def _samples_root(self) -> Path:
        cfg = self._cfg()
        manual_root = str(cfg.get("samples_root", "")).strip()
        if manual_root:
            return Path(manual_root).expanduser()

        folier_root = str((self.config.get("folier.samples_root", "") or "")).strip()
        if folier_root:
            return Path(folier_root).expanduser()

        return Path("samples/folier")

    def _pick_sample_path(self, name: str) -> Optional[str]:
        folder = self._samples_root() / name
        if not folder.is_dir():
            return None

        candidates = []
        for path in sorted(folder.iterdir()):
            if path.is_file() and path.suffix.lower() == ".wav":
                candidates.append(str(path))

        if not candidates:
            return None

        return random.choice(candidates)

    def _choose_gap_sec(self, name: str) -> float:
        item = self._item_cfg(name)
        lo = float(item.get("loop_gap_min_sec", 5.0))
        hi = float(item.get("loop_gap_max_sec", lo))
        if hi < lo:
            hi = lo
        return random.uniform(lo, hi)

    def _build_event(self, name: str) -> Optional[SampleEvent]:
        item = self._item_cfg(name)
        sample_path = self._pick_sample_path(name)
        if not sample_path:
            return None

        gain_min = float(item.get("gain_min", 0.2))
        gain_max = float(item.get("gain_max", gain_min))
        if gain_max < gain_min:
            gain_max = gain_min

        rate_min = float(item.get("rate_min", 1.0))
        rate_max = float(item.get("rate_max", rate_min))
        if rate_max < rate_min:
            rate_max = rate_min

        delay_time_min = float(item.get("delay_time_min", 0.2))
        delay_time_max = float(item.get("delay_time_max", delay_time_min))
        if delay_time_max < delay_time_min:
            delay_time_max = delay_time_min

        delay_feedback_min = float(item.get("delay_feedback_min", 0.15))
        delay_feedback_max = float(item.get("delay_feedback_max", delay_feedback_min))
        if delay_feedback_max < delay_feedback_min:
            delay_feedback_max = delay_feedback_min

        return SampleEvent(
            sample_path=sample_path,
            gain=random.uniform(gain_min, gain_max),
            rate=random.uniform(rate_min, rate_max),
            lowpass_hz=(None if float(item.get("lowpass_hz", 0.0)) <= 0 else float(item.get("lowpass_hz"))),
            highpass_hz=(None if float(item.get("highpass_hz", 0.0)) <= 0 else float(item.get("highpass_hz"))),
            delay_mix=float(np.clip(float(item.get("delay_mix", 0.0)), 0.0, 1.0)),
            delay_time_sec=random.uniform(delay_time_min, delay_time_max),
            delay_feedback=float(np.clip(random.uniform(delay_feedback_min, delay_feedback_max), 0.0, 0.95)),
            reverb_mix=float(np.clip(float(item.get("reverb_mix", 0.0)), 0.0, 1.0)),
            distortion_drive=max(0.0, float(item.get("distortion_drive", 0.0))),
            line_name=f"manual:{name}",
            meta={
                "source": "manual_sfx",
                "name": name,
            },
        )

    def _trigger(self, name: str) -> bool:
        event = self._build_event(name)
        if event is None:
            return False

        self.comms.send(TOPIC_SAMPLE_EVENT, event)
        print(f"[MANUAL SFX] trigger {name} -> {event.sample_path}")
        return True

    def status(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "enabled": bool(self._cfg().get("enabled", True)),
                "looping": dict(self.looping),
            }

    def control(self, name: str, action: str) -> Dict[str, Any]:
        name = str(name or "").strip().lower()
        action = str(action or "").strip().lower()

        if name not in self.VALID_NAMES:
            return {"ok": False, "error": f"Unknown manual sfx name: {name}"}

        if action not in self.VALID_ACTIONS:
            return {"ok": False, "error": f"Unknown manual sfx action: {action}"}

        if not bool(self._cfg().get("enabled", True)):
            return {"ok": False, "error": "manual_sfx is disabled"}

        item = self._item_cfg(name)

        with self.lock:
            if action == "trigger_once":
                ok = self._trigger(name)
                if not ok:
                    return {"ok": False, "error": f"No .wav files found for {name}"}
                return {"ok": True, "name": name, "action": action, "status": self.status()}

            if action == "loop_on":
                if not bool(item.get("loopable", False)):
                    return {"ok": False, "error": f"{name} is not loopable"}

                ok = self._trigger(name)
                if not ok:
                    return {"ok": False, "error": f"No .wav files found for {name}"}

                self.looping[name] = True
                self.next_at[name] = time.perf_counter() + self._choose_gap_sec(name)
                return {"ok": True, "name": name, "action": action, "status": self.status()}

            if action == "loop_off":
                self.looping[name] = False
                self.next_at[name] = 0.0
                return {"ok": True, "name": name, "action": action, "status": self.status()}

        return {"ok": False, "error": "Unhandled manual sfx action"}

    def start(self) -> None:
        if self.thread is not None and self.thread.is_alive():
            return

        self.stop_event.clear()
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()

    def run(self) -> None:
        print("[MANUAL SFX] Running...")

        try:
            while not self.stop_event.is_set():
                cfg = self._cfg()
                if not bool(cfg.get("enabled", True)):
                    time.sleep(float(cfg.get("tick_sec", 0.2)))
                    continue

                now = time.perf_counter()

                with self.lock:
                    for name, is_looping in self.looping.items():
                        if not is_looping:
                            continue

                        if now < self.next_at[name]:
                            continue

                        ok = self._trigger(name)
                        self.next_at[name] = now + self._choose_gap_sec(name)

                        if not ok:
                            self.looping[name] = False

                time.sleep(float(cfg.get("tick_sec", 0.2)))
        finally:
            print("[MANUAL SFX] Stopped.")