# Format of Echorus OSC messages

Echorus produces sound by means of software synthesisers implemented in
Pure Data (Pd).
The notes to be played are sent to the synths via MIDI, but Echorus also
controls several aspects of the synths by sending OSC messages.
These messages can tell the patch to change its timbre and change
effects on the sound, among other things.
This is a draft specification of the kinds of OSC messages which the Echorus Pd
patches will respond to.

There are several patches (e.g. granular26), each of which can have multiple
instances.
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

## `preset [patch_id] [preset_name]`

Changes the instrument preset on the patch.

The available presets vary by the patch.
Please see the main [README](README.md) for an up-to-date list.

## `env [patch_id] [preset_name]`

Causes the patch to change its ADSR envelope.

Currently available presets: `hammer`, `soft`, `pop`, `chopper`, `dial`, `blow`.

## `pan [patch_id] [percentage]`

Set the stereo pan of the patch.
0% = left only;
50% = equal level in both left and right;
100% = right only.

## `reverb [patch_id] [preset_name]`

Changes the reverb effect on the patch to a preset.

Currently available presets: ?

## `fadein [patch_id] [duration]`

Fades in the audio coming from the patch from zero to an appropriate level
(which is determined by the patch) over a given duration.

## `fadeout [patch_id] [duration]`

Fades out the audio from the patch from its current level to zero over a given
duration.
