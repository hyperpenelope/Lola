# Echorus: Pure Data component

## granular26

granular26 is a granular synthesiser based on jaffasplaffa's [granular21](https://github.com/jaffasplaffa/Pure-data-patches/tree/master) patch.

granular26 must be provided with samples (stored under `granular26/samples`) in
order to make sound.
**Crucially**, the samples must have the same sample rate as what Pd runs on
(see Pd's audio settings), or else there will be audible pitching errors.

The patch has presets which are designed to work with particular samples
chosen for Echorus performances (not provided in this repository).
These samples have the following pitches:

| Preset | Note/Octave |
| Angelic Choir | D4 |
| Celtic Darkness | F3 |
| Mid Sax v1 | E3 |
| Mid Sax v2 | E3 |
| Candlelit Bath | C4 |
| Purring Cello | C#2 |
| Ready for Jesus | B3 |
| Maiden's Warble | F5 |
| Evolving Darkness | F3 |
| Evolving Jesus | B3 |
| Moments | G3 |

**Tip**: If you play a note with granular26 which is quite far from the sample's
original pitch, the result often sounds horrible.
A cautious rule of thumb is that you should only play notes within 6 semitones
of the original pitch - i.e. your available range of notes is the octave
from 6 semitones below to 6 semitones above the sample's original pitch.

## AlmondOrgan

AlmondOrgan is an organ synth released by Pierre Guillot as part of his
[Camomile](https://github.com/pierreguillot/Camomile) project.

## polysine

polysine is an additive synth based on sine waves.
It has a built-in Leslie effect to make the tones more interesting.
