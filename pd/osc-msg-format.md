# Format of Echorus OSC messages

Echorus produces sound by means of software synthesisers implemented in
Pure Data (Pd).
The notes to be played are sent to the synths via MIDI, but Echorus also
controls several aspects of the synths by sending OSC messages to Pd.
These messages can change a synth's timbre and change
effects on the sound, among other things.
This is a draft specification of the kinds of OSC messages which the Echorus Pd
patches will respond to.

**Important note**: The Pd patches can only receive OSC messages once you
have opened the patch `echorusctl.pd`.

There are several synth patches (e.g. granular26), each of which can have
multiple instances.
Each instance is assigned a numeric "patch ID".
Every OSC message must identify a patch by its ID.

| Patch ID | Instrument |
|----------|------------|
| 1  | granular26 (1) |
| 2  | granular26 (2) |
| 3  | granular26 (3) |
| 4  | granular26 (4) |
| 5  | AlmondOrgan (1) |
| 6  | AlmondOrgan (2) |
| 7  | _reserved_ |
| 8  | _reserved_ |
| 9  | polysine (1) |
| 10 | polysine (2) |
| 11 | polysine (3) |
| 12 | polysine (4) |

## `instr [patch_id] preset [preset_name]`

Changes the instrument preset on the patch.

The available presets vary by the patch.
Please see the main [README](README.md) for an up-to-date list.

Example: `instr 5 preset Brass2`

## `instr [patch_id] env [preset_name]`

Causes the patch to change its ADSR envelope.

Currently available presets: `Hammer`, `Soft`, `Pop`, `Chopper`, `Dial`, `Bottle`.

Example: `instr 10 env Dial`

## `reverb [patch_id] preset [preset_name]`

Changes the reverb effect on the patch to a preset.

Currently available presets: `Off`, `Light`, `Medium_Hall`, `Small_Cave`, `Big_Cave`, `Galaxy`.

Example message: `reverb 5 preset Medium_Hall`

## `pan [patch_id] [pan] [change_time]`

Set the stereo pan of the patch.
The pan value is a number between -1 and 1 interpreted as follows:
* -1 = left only;
* 0 = equal level in both left and right;
* 1 = right only.
So -0.5 is panned quite strongly to the left, but not fully;
0.1 is panned very slightly to the right; etc.

The change is completed over `[change_time]` milliseconds, if given.

Example: `pan 1 -0.25 5000` pans instrument 1 partially to the left over a
period of 5 seconds.
