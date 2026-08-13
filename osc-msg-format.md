# Format of Echorus OSC messages

Echorus produces sound by means of Pure Data (Pd) patches, with which it
interacts by sending OSC messages.
These messages can tell the patch to play a note, change its timbre, change
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
| 7  | AlmondOrgan (3) |
| 8  | AlmondOrgan (4) |
| 9  | polysine (1) |
| 10 | polysine (2) |
| 11 | polysine (3) |
| 12 | polysine (4) |

## `preset [patch_id] [preset_name]`

Changes the instrument preset on the patch.

The available presets vary by the patch.
Here is an incomplete list:
* granular26: `angelicchoir`, `celticdarkness`
* AlmondOrgan: `vibra1`, `vibra2`
* polysine: `satellite`

## `midi [patch_id] [note] [velocity] [duration]`

Instructs a patch to play a note.

**Overlapping notes**: The patches react differently if they are sent
overlapping notes, i.e. at least two notes where the second note starts
before the first ends.
This includes chords where several notes are triggered simultaneously!

* granular26 is monophonic, so it switches to the second note immediately.
* polysine is monophonic with portamento, so it ramps its frequency up or down
from the pitch of the first note to the pitch of the second note.
How fast this occurs depends on a parameter called "portamento time" which can
be set within the patch.
* AlmondOrgan is polyphonic with 12 voices, so the second note plays on top of
the first note.

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
