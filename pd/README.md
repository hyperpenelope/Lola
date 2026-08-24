# Echorus: Pure Data component

This document briefly describes the software synthesisers which are used to
make the musical part of the Echorus installation.
Each synth is implemented in Pure Data.

See also: [OSC message format for communication between Echorus main process
and the Pd synths](osc-msg-format.md)

## granular26

granular26 is a granular synthesiser based on jaffasplaffa's [granular21](https://github.com/jaffasplaffa/Pure-data-patches/tree/master) patch.

granular26 must be provided with samples (stored under `granular26/samples`) in
order to make sound.
**Crucially**, the samples must have the same sample rate as what Pd runs on
(see Pd's audio settings), or else there will be audible pitching errors.

granular26 has presets which are designed to work with particular samples
chosen for Echorus performances (not provided in this repository).
These samples have the following pitches:

| Preset | Note/Octave |
|--------|-------------|
| angelic-choir | D4 |
| celtic-darkness | F3 |
| mid-sax-v1 | E3 |
| mid-sax-v2 | E3 |
| candlelit-bath | C4 |
| purring-cello | C#2 |
| ready-for-jesus | B3 |
| maidens-warble | F5 |
| evolving-darkness | F3 |
| evolving-jesus | B3 |
| moments | G3 |

**Tip**: If you play a note with granular26 which is quite far from the sample's
original pitch, the result often sounds horrible.
A cautious rule of thumb is that you should only play notes within 6 semitones
of the original pitch - i.e. your available range of notes is the octave
from 6 semitones below to 6 semitones above the sample's original pitch.

granular26 is monophonic, i.e. it can only play one note at a time.

## AlmondOrgan

AlmondOrgan is an organ synth released by Pierre Guillot as part of his
[Camomile](https://github.com/pierreguillot/Camomile) project.

AlmondOrgan is polyphonic with 12 voices.

| Preset |
|--------|
| Deep |
| Steel_Pan |
| Hollow |
| Vibra |
| Booker |
| Brass1 |
| Brass2 |

## polysine

polysine is an additive synth based on sine waves.
It has a built-in Leslie effect to make the tones more interesting.

polysine is monophonic with portamento, meaning that it plays only note at a
time, but it can "slide" between pitches if it is sent a second note before
the current note has ended.

| Preset |
|--------|
| Fundamental |
| Satellite |
| Twenty5 |
| Thirty6 |
| Frying_Pan |
| Crystal |
| Qin |
| Even |

## Sending MIDI to the synths

Each instance of each synth receives MIDI messages on a particular MIDI channel
which matches the instance's "patch ID".
This is shown in the following table.

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
| 11 | _reserved_ |
| 12 | _reserved_ |

So, for example, the second polysine instance listens for MIDI on channel 10
using the Pd object `[notein 10]`.

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
