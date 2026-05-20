# Echorus

Echorus is an audio-visual interactive installation that listens to English speech, transcribes it in real time, and turns detected utterances into musical events and reactive visuals.

The system combines ideas from psycholinguistics, affective word features, rhythm generation, modal pitch selection, and live visual rendering. Spoken language is used as the core material for both sound and image.

## Current System

Echorus is now split into modular components:

- **Speech**: listens to microphone input and transcribes speech
- **Composer**: turns utterances into rhythmic note and visual events
- **Playback**: plays notes locally and/or sends MIDI-style OSC to an external synth
- **Visual**: renders the active visual generator in a shared window
- **HTTP / Panel**: exposes a local control API and browser control panel
- **Config / Presets**: loads JSON configs and named presets

## Features

- Realtime English speech transcription
- Rhythmic composition from utterances
- MIDI-note based modal pitch system
- Visual event generation from word features
- Two visual generators:
  - `dust`
  - `waver`
- Shared background video support
- Subtitle / transcript overlay in the visual scene
- Browser-based live control panel
- Preset loading and saving
- Optional OSC MIDI output to an external synth
- Optional `--no-visual` mode

## Installation

Preferably using **Python 3.13**, create and activate a virtual environment:

    python -m venv .venv
    source .venv/bin/activate

Install dependencies:

    pip install -r requirements.txt

## Run

Start the application with:

    python app.py

Or load a preset/config file:

    python app.py --config presets/fireflight.json

Useful flags:

    python app.py --config presets/fireflight.json --no-visual
    python app.py --host 127.0.0.1 --port 8000

## What Happens by Default

By default Echorus:

- listens to the microphone
- transcribes English speech
- turns utterances into rhythmic note events
- plays them with the built-in local synth
- sends visual events to the active visual generator
- opens the HTTP control server and panel

## Visual System

The visual system runs in a shared window and can switch generators at runtime.

Current generators:

- `fireflight`
- `waver`

The visual layer also supports:

- shared background video
- live transcript/subtitle overlay
- configurable subtitle font, size, depth, and motion
- color animation driven by musical / word events

You can disable the visual system entirely from the command line:

    python app.py --no-visual

## Playback and External Synth Output

Playback receives internal note events from the composer.

It can:

- play notes locally with the built-in simple synth
- send MIDI-style OSC messages to an external synth
- do both at the same time
- run in MIDI-out-only mode

The external OSC MIDI payload format is:

    /midi channel note velocity duration

Example:

    /midi 1 69 100 0.225

Where:

- `channel` = output channel / voice number
- `note` = MIDI note number, `0-127`
- `velocity` = MIDI-style velocity, `1-127`
- `duration` = note duration in seconds

These are controlled through config / panel under `playback.*`, including:

- `playback.osc_midi_enabled`
- `playback.osc_midi_host`
- `playback.osc_midi_port`
- `playback.osc_midi_address`
- `playback.midi_out_only`

## Control Panel

`app.py` starts a local HTTP server, by default on:

    http://127.0.0.1:8000/

## Presets

Configs and presets are JSON files.

Example:

    python app.py --config presets/fireflight.json

If the config is loaded from the presets directory, the current preset name is exposed to the frontend and control panel.
