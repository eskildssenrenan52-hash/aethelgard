// @ts-nocheck -- pure musical composition engine & multi-section orchestral scores for all 70 biomes (50 Surface + 20 Underworld)
import { AnyBiomeId, BiomeId, UnderworldBiomeId } from './types';

export type SynthTimbre =
  | 'piano'
  | 'flute'
  | 'oboe'
  | 'celesta'
  | 'harp'
  | 'lute'
  | 'koto'
  | 'marimba'
  | 'organ'
  | 'harpsichord'
  | 'clockwork'
  | 'musicbox'
  | 'horn'
  | 'trumpet'
  | 'violin'
  | 'cello'
  | 'pizzicato'
  | 'choir'
  | 'synthlead';

export type DrumStep =
  | 'K' // Punchy kick
  | 'S' // Snare
  | 'H' // Closed hi-hat
  | 'O' // Open hi-hat
  | 'T' // Anvil / bell / woodblock accent
  | 'M' // Orchestral tom / timpani
  | 'C' // Crash cymbal / swell
  | 'R' // Shaker / tambourine
  | null;

export type MusicGrooveStyle =
  | 'ballad'
  | 'adventure'
  | 'waltz'
  | 'heroic'
  | 'synthwave'
  | 'nocturne'
  | 'baroque'
  | 'eastern'
  | 'industrial'
  | 'boss';

export type SongSectionId = 'INTRO' | 'A' | 'B' | 'C' | 'D' | 'OUTRO';
export type ChordVoicingStyle = 'sustained' | 'rolled' | 'arpeggiated' | 'staccato';

export interface BiomeMusicScore {
  biome: AnyBiomeId;
  title: string;
  modeName: string;
  bpm: number;
  subdivision: 2 | 4; // 2 = 8th-note grid, 4 = 16th-note grid
  length: number; // 256 steps = 32 bars across 6 symphonic arcs (INTRO, A, B, C, D, OUTRO)
  groove: MusicGrooveStyle;
  leadTimbre: SynthTimbre;
  counterTimbre: SynthTimbre;
  arpTimbre: SynthTimbre;
  padTimbre: SynthTimbre;
  ostinatoTimbre: SynthTimbre;
  chordVoicingStyle: ChordVoicingStyle;
  reverbMix: number; // 0.15 - 0.65
  delayMix: number; // 0.05 - 0.35
  padWarmthHz: number;
  masterVolume: number; // balanced 0.095 - 0.13 pre-compressor
  chords: [number, number, number, number][]; // 32 rich 4-note chords (1 per bar of 8 steps)
  melody: (number | null)[]; // 256 MIDI notes
  melodyVelocity: number[]; // 256 dynamic expression curve (0.65 - 1.18)
  counterMelody: (number | null)[]; // 256 MIDI notes (strings/cello/choir/brass dialogue)
  counterArp: (number | null)[]; // 256 MIDI notes (piano/harp/koto/harpsichord accompaniment)
  ostinato: (number | null)[]; // 256 MIDI notes (pizzicato/spiccato/clockwork kinetic drive)
  bass: (number | null)[]; // 256 MIDI notes (bass & sub-bass anchor)
  drums: DrumStep[]; // 256 percussive steps
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const SONG_LENGTH = 256;

export function getSectionAtStep(step: number): SongSectionId {
  const s = ((step % SONG_LENGTH) + SONG_LENGTH) % SONG_LENGTH;
  if (s < 16) return 'INTRO'; // bars 0-1
  if (s < 64) return 'A'; // bars 2-7
  if (s < 128) return 'B'; // bars 8-15
  if (s < 192) return 'C'; // bars 16-23
  if (s < 240) return 'D'; // bars 24-29
  return 'OUTRO'; // bars 30-31
}

// ============================================================================
// SYMPHONIC 32-BAR COMPOSITION ENGINE (256 STEPS / 6 ARCS / KEY MODULATION)
// - INTRO (0-15):   Prelúdio cristalino com acorde dedilhado e motivo suspenso
// - A (16-63):      Exposição lírica do tema principal com base rítmica leve
// - B (64-127):     Desenvolvimento orquestral + ostinato rítmico + contraponto
// - C (128-191):    Ponte contrastante meio-tempo + modulação colorida + crescendo
// - D (192-239):    Clímax grandioso (tutti + elevação tonal de +2 semitons!)
// - OUTRO (240-255): Cadência resolutiva suave reconectando ao prelúdio
// ============================================================================

interface CompositionBlueprint {
  biome: AnyBiomeId;
  title: string;
  modeName: string;
  bpm: number;
  subdivision?: 2 | 4;
  groove: MusicGrooveStyle;
  leadTimbre: SynthTimbre;
  counterTimbre: SynthTimbre;
  arpTimbre: SynthTimbre;
  padTimbre: SynthTimbre;
  reverbMix?: number;
  delayMix?: number;
  padWarmthHz?: number;
  masterVolume?: number;
  root: number; // MIDI root e.g. 57 = A3
  scale: number[]; // 7+ semitone offsets from root
  // 4-bar chord degree progression per section (indices into scale: 0=I, 1=II, 2=III, 3=IV, 4=V, 5=VI, 6=VII)
  progA: [number, number, number, number];
  progB: [number, number, number, number];
  progC: [number, number, number, number];
  progD: [number, number, number, number];
  // Optional handcrafted 32-step Section A lead motif (scale degree offsets or null); falls back to expressive motif builder
  motifA?: (number | null)[];
  // Optional handcrafted 32-step Section B lead variation
  motifB?: (number | null)[];
  seed: number;
}

function degToMidi(root: number, scale: number[], degree: number, octaveShift = 0): number {
  const len = scale.length;
  const norm = ((degree % len) + len) % len;
  const oct = Math.floor(degree / len) + octaveShift;
  return Math.max(28, Math.min(104, root + scale[norm] + oct * 12));
}

function buildRichChord(root: number, scale: number[], degree: number, colorSeventh = true): [number, number, number, number] {
  const n1 = degToMidi(root, scale, degree, 0);
  const n3 = degToMidi(root, scale, degree + 2, 0);
  const n5 = degToMidi(root, scale, degree + 4, 0);
  const nExt = colorSeventh
    ? degToMidi(root, scale, degree + 6, 0) // 7th tension
    : degToMidi(root, scale, degree + 8, 0); // 9th color
  return [n1, n3, n5, nExt];
}

// Expressive rhythm templates (8 steps per bar)
const LEAD_RHYTHMS: Record<MusicGrooveStyle, number[][]> = {
  ballad: [
    [0, 2, 4, 6, 7],
    [0, 2, 4, 5],
    [0, 1, 3, 5, 6],
    [0, 2, 4],
  ],
  adventure: [
    [0, 2, 3, 5, 6],
    [0, 2, 4, 6, 7],
    [0, 1, 3, 4, 6],
    [0, 2, 4, 5],
  ],
  waltz: [
    [0, 2, 4, 6],
    [0, 3, 5, 7],
    [0, 2, 3, 6],
    [0, 2, 5],
  ],
  heroic: [
    [0, 2, 3, 4, 6],
    [0, 2, 4, 6, 7],
    [0, 1, 2, 4, 6],
    [0, 3, 4, 6],
  ],
  synthwave: [
    [0, 2, 4, 5, 7],
    [0, 1, 3, 5, 6],
    [0, 2, 4, 6, 7],
    [0, 2, 3, 5],
  ],
  nocturne: [
    [0, 3, 5, 7],
    [0, 2, 5],
    [1, 3, 5, 6],
    [0, 2, 4],
  ],
  baroque: [
    [0, 1, 2, 3, 4, 6, 7],
    [0, 2, 3, 4, 5, 6],
    [0, 1, 2, 4, 5, 7],
    [0, 2, 4, 6],
  ],
  eastern: [
    [0, 2, 4, 7],
    [0, 3, 4, 6],
    [0, 2, 3, 5, 7],
    [0, 2, 5],
  ],
  industrial: [
    [0, 1, 3, 4, 6],
    [0, 2, 3, 5, 7],
    [0, 1, 4, 5, 6],
    [0, 2, 4, 6],
  ],
  boss: [
    [0, 1, 2, 4, 5, 6, 7],
    [0, 2, 3, 4, 6, 7],
    [0, 1, 3, 4, 6, 7],
    [0, 2, 4, 5, 6],
  ],
};

function buildArpBar(
  chord: [number, number, number, number],
  groove: MusicGrooveStyle,
  section: SongSectionId,
  barIdx: number
): (number | null)[] {
  const [c0, c1, c2, c3] = chord;
  const high = c0 + 12;
  const mid = c2 + 12;
  const out: (number | null)[] = new Array(8).fill(null);

  if (groove === 'ballad' || groove === 'nocturne') {
    const pat = [c0, c1, c2, c3, high, c2, c1, section === 'A' ? null : c3];
    for (let i = 0; i < 8; i++) {
      if (section === 'C' && i % 2 === 1) continue;
      out[i] = pat[i] !== null ? (pat[i] as number) + (section === 'D' ? 12 : 0) : null;
    }
    return out;
  }

  if (groove === 'waltz') {
    const pat = [c0, c1 + 12, c2 + 12, c3 + 12, c2 + 12, c1 + 12, c0 + 12, c2 + 12];
    for (let i = 0; i < 8; i++) {
      out[i] = section === 'A' && i === 7 ? null : pat[i];
    }
    return out;
  }

  if (groove === 'baroque') {
    const pat = [c0 + 12, c2 + 12, c1 + 12, c3 + 12, high, c2 + 12, mid, c1 + 12];
    for (let i = 0; i < 8; i++) out[i] = pat[i];
    return out;
  }

  if (groove === 'synthwave' || groove === 'industrial') {
    const pat = [c0, c0 + 12, c2, c2 + 12, c1 + 12, c3, high, c2 + 12];
    for (let i = 0; i < 8; i++) {
      out[i] = section === 'C' && i % 2 === 1 ? null : pat[i];
    }
    return out;
  }

  if (groove === 'eastern') {
    const pat = [c0 + 12, null, c2 + 12, c3 + 12, high, c2 + 12, null, c1 + 12];
    for (let i = 0; i < 8; i++) out[i] = pat[i];
    return out;
  }

  // adventure / heroic / boss flowing 8th-note accompaniment
  const variant = barIdx % 2 === 0;
  const pat = variant
    ? [c0 + 12, c1 + 12, c2 + 12, high, c3 + 12, c2 + 12, c1 + 12, c2 + 12]
    : [c0 + 12, c2 + 12, c3 + 12, mid, high, c3 + 12, c2 + 12, c1 + 12];
  for (let i = 0; i < 8; i++) {
    if (section === 'A' && (i === 3 || i === 7)) continue;
    out[i] = pat[i];
  }
  return out;
}

function buildBassBar(
  chord: [number, number, number, number],
  groove: MusicGrooveStyle,
  section: SongSectionId
): (number | null)[] {
  const root = chord[0] - 12;
  const fifth = chord[2] - 12;
  const oct = chord[0];
  const out: (number | null)[] = new Array(8).fill(null);

  if (section === 'C' && (groove === 'ballad' || groove === 'nocturne')) {
    out[0] = root;
    out[4] = fifth;
    return out;
  }

  if (groove === 'synthwave' || groove === 'boss' || groove === 'industrial') {
    const pat =
      section === 'D' || groove === 'boss'
        ? [root, root, oct, root, fifth, root, oct, fifth]
        : [root, null, root, oct, fifth, null, root, fifth];
    return pat;
  }

  if (groove === 'heroic' || groove === 'adventure') {
    return section === 'A'
      ? [root, null, null, fifth, root, null, fifth, null]
      : [root, null, fifth, null, oct, null, fifth, root];
  }

  if (groove === 'baroque') {
    return [root, null, fifth, null, oct, null, chord[1] - 12, fifth];
  }

  // ballad / eastern / waltz / nocturne
  return section === 'D'
    ? [root, null, fifth, null, oct, null, fifth, null]
    : [root, null, null, null, fifth, null, null, null];
}

function buildOstinatoBar(
  chord: [number, number, number, number],
  groove: MusicGrooveStyle,
  section: SongSectionId,
  barIdx: number
): (number | null)[] {
  const [c0, c1, c2, c3] = chord;
  const out: (number | null)[] = new Array(8).fill(null);

  if (section === 'INTRO' || section === 'OUTRO') {
    out[0] = c0 + 12;
    out[4] = c2 + 12;
    return out;
  }

  if (section === 'A') {
    if (barIdx % 2 === 1) {
      out[2] = c2 + 12;
      out[6] = c1 + 12;
    }
    return out;
  }

  if (section === 'C') {
    // Flowing gentle shimmer across half-time bridge
    out[0] = c0 + 12;
    out[3] = c2 + 12;
    out[6] = c3 + 12;
    return out;
  }

  // B and D: Kinetic driving rhythmic ostinato!
  if (groove === 'boss' || groove === 'heroic' || groove === 'industrial' || groove === 'synthwave') {
    return [c0 + 12, c2 + 12, c0 + 12, c1 + 12, c2 + 12, c0 + 12, c3 + 12, c2 + 12];
  }
  if (groove === 'waltz') {
    return [c0 + 12, null, c1 + 12, c2 + 12, c1 + 12, null, c3 + 12, c2 + 12];
  }
  return [c0 + 12, c1 + 12, c2 + 12, null, c3 + 12, c2 + 12, c1 + 12, c2 + 12];
}

function buildDrumBar(
  groove: MusicGrooveStyle,
  section: SongSectionId,
  barInSection: number,
  totalInSection: number
): DrumStep[] {
  if (section === 'INTRO') {
    return barInSection === 0
      ? ['R', null, null, null, 'T', null, null, null]
      : ['R', null, 'R', null, 'M', null, 'T', 'R'];
  }
  if (section === 'OUTRO') {
    return barInSection === 0
      ? ['C', null, 'R', null, 'T', null, null, null]
      : ['T', null, null, null, 'R', null, null, null];
  }

  const isTransition = barInSection === totalInSection - 1;
  const isSectionStart = barInSection === 0 && (section === 'B' || section === 'D');

  if (groove === 'ballad' || groove === 'nocturne') {
    if (section === 'A') {
      return [
        barInSection === 0 ? 'K' : null, null, 'R', null,
        barInSection % 2 === 1 ? 'T' : null, null, 'R', isTransition ? 'M' : null,
      ];
    }
    if (section === 'C') {
      return isTransition
        ? ['T', null, 'R', 'M', 'M', 'S', 'M', 'C']
        : ['T', null, null, 'R', null, null, 'T', null];
    }
    return [
      isSectionStart ? 'C' : 'K', null, 'R', null,
      'S', null, 'R', isTransition ? 'M' : 'H',
    ];
  }

  if (groove === 'waltz') {
    if (section === 'C') {
      return isTransition ? ['T', null, 'R', 'M', 'M', 'M', 'T', 'C'] : ['T', null, 'R', null, 'R', null, 'T', null];
    }
    return [
      isSectionStart ? 'C' : 'K', null, 'H', null,
      'M', null, 'H', isTransition ? 'T' : null,
    ];
  }

  if (groove === 'eastern') {
    if (section === 'C') {
      return ['M', null, 'R', null, 'T', null, 'R', isTransition ? 'C' : null];
    }
    return [
      isSectionStart ? 'C' : 'K', null, 'M', 'R',
      'T', null, 'M', isTransition ? 'S' : 'R',
    ];
  }

  if (groove === 'industrial') {
    if (section === 'C') {
      return isTransition ? ['T', 'M', 'S', 'M', 'S', 'M', 'S', 'C'] : ['T', null, 'H', null, 'T', 'T', 'O', null];
    }
    return [
      isSectionStart ? 'C' : 'K', 'H', 'T', 'H',
      'S', 'H', 'K', isTransition ? 'M' : 'O',
    ];
  }

  if (groove === 'synthwave' || groove === 'boss') {
    if (section === 'C') {
      return isTransition ? ['K', 'M', 'S', 'M', 'S', 'S', 'M', 'C'] : ['K', null, 'H', 'R', 'M', null, 'O', 'M'];
    }
    if (isTransition && section === 'D') {
      return ['K', 'H', 'S', 'M', 'S', 'M', 'K', 'C'];
    }
    return [
      isSectionStart ? 'C' : 'K', 'H', 'S', 'H',
      'K', 'H', isTransition ? 'M' : 'S', 'O',
    ];
  }

  // adventure / heroic / baroque
  if (section === 'A') {
    return ['K', null, 'H', null, 'S', null, 'H', isTransition ? 'R' : null];
  }
  if (section === 'C') {
    return isTransition ? ['T', 'R', 'M', 'M', 'S', 'M', 'S', 'C'] : ['T', null, 'R', null, 'M', null, 'H', 'T'];
  }
  if (isTransition) {
    return ['K', 'H', 'S', 'H', 'M', 'M', 'S', 'O'];
  }
  return [
    isSectionStart ? 'C' : 'K', 'H', 'R', 'H',
    'S', 'H', 'K', 'O',
  ];
}

function pickOstinatoTimbre(bp: CompositionBlueprint): SynthTimbre {
  if (bp.groove === 'industrial' || bp.groove === 'baroque' || bp.groove === 'synthwave') {
    return bp.arpTimbre === 'clockwork' ? 'pizzicato' : 'clockwork';
  }
  if (bp.groove === 'eastern' || bp.leadTimbre === 'flute') {
    return bp.arpTimbre === 'marimba' ? 'pizzicato' : 'marimba';
  }
  if (bp.groove === 'ballad' || bp.groove === 'nocturne') {
    return 'celesta';
  }
  return 'pizzicato';
}

function pickVoicingStyle(bp: CompositionBlueprint): ChordVoicingStyle {
  if (bp.arpTimbre === 'harp' || bp.arpTimbre === 'lute' || bp.arpTimbre === 'koto' || bp.leadTimbre === 'piano') {
    return 'rolled';
  }
  if (bp.groove === 'baroque' || bp.groove === 'waltz') return 'arpeggiated';
  if (bp.groove === 'industrial' || bp.groove === 'boss') return 'staccato';
  return 'sustained';
}

function composeEpicScore(bp: CompositionBlueprint): BiomeMusicScore {
  // Build 32-bar symphonic progression:
  // INTRO (2): bars 0..1
  // A     (6): bars 2..7
  // B     (8): bars 8..15
  // C     (8): bars 16..23
  // D     (6): bars 24..29 (bars 26..29 modulate +2 semitones for transcendent Celeste climax!)
  // OUTRO (2): bars 30..31
  const barDegrees: number[] = [
    bp.progA[0], bp.progA[3], // INTRO (0-1)
    ...bp.progA, bp.progA[0], bp.progA[3], // A (2-7)
    ...bp.progB, bp.progB[0], bp.progB[2], bp.progB[3], (bp.progB[3] + 1) % bp.scale.length, // B (8-15)
    ...bp.progC, bp.progC[2], bp.progC[1], bp.progC[3], bp.progC[0], // C (16-23)
    ...bp.progD, bp.progD[0], bp.progD[2], // D (24-29)
    bp.progA[3], bp.progA[0], // OUTRO (30-31)
  ];

  const chords: [number, number, number, number][] = barDegrees.map((deg, barIdx) => {
    const base = buildRichChord(bp.root, bp.scale, deg, barIdx % 2 === 1 || barIdx >= 16);
    // Climax key lift (+2 semitones whole-step modulation) on final climax bars 26..29
    if (barIdx >= 26 && barIdx <= 29) {
      return [base[0] + 2, base[1] + 2, base[2] + 2, base[3] + 2];
    }
    return base;
  });

  const melody: (number | null)[] = new Array(SONG_LENGTH).fill(null);
  const melodyVelocity: number[] = new Array(SONG_LENGTH).fill(0.95);
  const counterMelody: (number | null)[] = new Array(SONG_LENGTH).fill(null);
  const counterArp: (number | null)[] = new Array(SONG_LENGTH).fill(null);
  const ostinato: (number | null)[] = new Array(SONG_LENGTH).fill(null);
  const bass: (number | null)[] = new Array(SONG_LENGTH).fill(null);
  const drums: DrumStep[] = new Array(SONG_LENGTH).fill(null);

  const rhythmSet = LEAD_RHYTHMS[bp.groove];

  for (let bar = 0; bar < 32; bar++) {
    const section: SongSectionId =
      bar < 2 ? 'INTRO' : bar < 8 ? 'A' : bar < 16 ? 'B' : bar < 24 ? 'C' : bar < 30 ? 'D' : 'OUTRO';
    const secStartBar =
      section === 'INTRO' ? 0 : section === 'A' ? 2 : section === 'B' ? 8 : section === 'C' ? 16 : section === 'D' ? 24 : 30;
    const secTotalBars =
      section === 'INTRO' || section === 'OUTRO' ? 2 : section === 'A' || section === 'D' ? 6 : 8;
    const barInSec = bar - secStartBar;
    const chord = chords[bar];
    const chordDeg = barDegrees[bar];
    const stepOffset = bar * 8;
    const modShift = bar >= 26 && bar <= 29 ? 2 : 0;

    // 1. Melody & Expressive Dynamic Curve
    const rPat = rhythmSet[(bar + bp.seed) % rhythmSet.length];
    if (section === 'INTRO') {
      // Sparse crystal motif teaser
      melody[stepOffset + 0] = degToMidi(bp.root, bp.scale, chordDeg + 4, 1);
      if (barInSec === 1) {
        melody[stepOffset + 4] = degToMidi(bp.root, bp.scale, chordDeg + 2, 1);
        melody[stepOffset + 6] = degToMidi(bp.root, bp.scale, chordDeg + 3, 1);
      }
      for (let s = 0; s < 8; s++) melodyVelocity[stepOffset + s] = 0.72 + s * 0.025;
    } else if (section === 'OUTRO') {
      // Graceful cadence resolving back to tonic
      melody[stepOffset + 0] = degToMidi(bp.root, bp.scale, chordDeg + 2, 1);
      if (barInSec === 0) melody[stepOffset + 4] = degToMidi(bp.root, bp.scale, chordDeg + 1, 1);
      else melody[stepOffset + 2] = degToMidi(bp.root, bp.scale, chordDeg, 1);
      for (let s = 0; s < 8; s++) melodyVelocity[stepOffset + s] = Math.max(0.62, 0.88 - (barInSec * 8 + s) * 0.016);
    } else if (section === 'A' && bp.motifA && barInSec < 4) {
      for (let s = 0; s < 8; s++) {
        const d = bp.motifA[barInSec * 8 + s];
        melody[stepOffset + s] = d === null || d === undefined ? null : degToMidi(bp.root, bp.scale, d, 1);
        melodyVelocity[stepOffset + s] = s === 0 ? 1.04 : 0.92;
      }
    } else if (section === 'B' && bp.motifB && barInSec < 4) {
      for (let s = 0; s < 8; s++) {
        const d = bp.motifB[barInSec * 8 + s];
        melody[stepOffset + s] = d === null || d === undefined ? null : degToMidi(bp.root, bp.scale, d, 1);
        melodyVelocity[stepOffset + s] = s === 0 || s === 4 ? 1.08 : 0.96;
      }
    } else {
      const octLift = section === 'D' ? 2 : 1;
      let prevDeg = chordDeg + (barInSec % 2 === 0 ? 4 : 2);
      for (let idx = 0; idx < rPat.length; idx++) {
        const s = rPat[idx];
        const h = (bp.seed * 29 + bar * 17 + idx * 11) % 31;
        let deg: number;
        if (idx === 0) {
          deg = chordDeg + (barInSec % 2 === 0 ? 4 : 2);
        } else if (section === 'C') {
          deg = chordDeg + (idx % 2 === 0 ? 6 : 3) + (h % 2);
        } else if (section === 'D' && barInSec === secTotalBars - 1 && idx === rPat.length - 1) {
          deg = chordDeg + 7;
        } else {
          const stepDelta = h % 5 === 0 ? 2 : h % 3 === 0 ? -1 : 1;
          deg = prevDeg + stepDelta;
        }
        prevDeg = deg;
        melody[stepOffset + s] = Math.min(104, degToMidi(bp.root, bp.scale, deg, octLift) + modShift);
        const crescendo = section === 'C' && barInSec >= 6 ? 0.14 : 0;
        melodyVelocity[stepOffset + s] =
          (section === 'D' ? 1.12 : section === 'B' ? 1.03 : section === 'C' ? 0.88 + crescendo : 0.95) -
          (s % 2 === 1 ? 0.06 : 0);
      }
    }

    // 2. Orchestral Counter-Melody
    if (section === 'A' && barInSec % 2 === 1) {
      counterMelody[stepOffset + 0] = degToMidi(bp.root, bp.scale, chordDeg + 2, 0);
      counterMelody[stepOffset + 4] = degToMidi(bp.root, bp.scale, chordDeg + 4, 0);
    } else if (section === 'B') {
      counterMelody[stepOffset + 0] = degToMidi(bp.root, bp.scale, chordDeg + 2, 0);
      counterMelody[stepOffset + 3] = degToMidi(bp.root, bp.scale, chordDeg + 1, 0);
      counterMelody[stepOffset + 6] = degToMidi(bp.root, bp.scale, chordDeg + 4, 0);
    } else if (section === 'C') {
      counterMelody[stepOffset + 0] = degToMidi(bp.root, bp.scale, chordDeg + 4, 0);
      counterMelody[stepOffset + 4] = degToMidi(bp.root, bp.scale, chordDeg + 6, 0);
      if (barInSec >= 4) counterMelody[stepOffset + 6] = degToMidi(bp.root, bp.scale, chordDeg + 5, 0);
    } else if (section === 'D') {
      for (let s = 0; s < 8; s += 2) {
        const mel = melody[stepOffset + s];
        if (mel !== null) {
          counterMelody[stepOffset + s] = Math.max(40, mel - 5);
        } else if (s === 4) {
          counterMelody[stepOffset + s] = Math.min(98, degToMidi(bp.root, bp.scale, chordDeg + 2, 1) + modShift);
        }
      }
    }

    // 3. Arpeggio / Harp / Piano Accompaniment
    const arpBar = buildArpBar(chord, bp.groove, section === 'INTRO' ? 'C' : section === 'OUTRO' ? 'A' : section, bar);
    for (let s = 0; s < 8; s++) counterArp[stepOffset + s] = arpBar[s];

    // 4. Kinetic 7th-Layer Ostinato
    const ostBar = buildOstinatoBar(chord, bp.groove, section, bar);
    for (let s = 0; s < 8; s++) ostinato[stepOffset + s] = ostBar[s];

    // 5. Dual Bassline (quiet in Intro, resolute in Outro)
    if (section !== 'INTRO' || barInSec === 1) {
      const bassBar = buildBassBar(chord, bp.groove, section === 'INTRO' || section === 'OUTRO' ? 'C' : section);
      for (let s = 0; s < 8; s++) bass[stepOffset + s] = bassBar[s];
    }

    // 6. Multi-Piece Percussion
    const drumBar = buildDrumBar(bp.groove, section, barInSec, secTotalBars);
    for (let s = 0; s < 8; s++) drums[stepOffset + s] = drumBar[s];
  }

  return {
    biome: bp.biome,
    title: bp.title,
    modeName: bp.modeName,
    bpm: bp.bpm,
    subdivision: bp.subdivision ?? 2,
    length: SONG_LENGTH,
    groove: bp.groove,
    leadTimbre: bp.leadTimbre,
    counterTimbre: bp.counterTimbre,
    arpTimbre: bp.arpTimbre,
    padTimbre: bp.padTimbre,
    ostinatoTimbre: pickOstinatoTimbre(bp),
    chordVoicingStyle: pickVoicingStyle(bp),
    reverbMix: bp.reverbMix ?? 0.38,
    delayMix: bp.delayMix ?? 0.16,
    padWarmthHz: bp.padWarmthHz ?? 4400,
    masterVolume: bp.masterVolume ?? 0.115,
    chords,
    melody,
    melodyVelocity,
    counterMelody,
    counterArp,
    ostinato,
    bass,
    drums,
  };
}

// ============================================================================
// ALL 70 BIOME SYMPHONIC BLUEPRINTS (50 SURFACE + 20 UNDERWORLD)
// ============================================================================

const ALL_BLUEPRINTS: CompositionBlueprint[] = [
  // ---- 1-10: SURFACE CHAPTERS 1-10 ----
  {
    biome: 'silver_ash',
    title: 'Ecos das Cinzas',
    modeName: 'Lá Eólio · Piano Alpino, Flauta & Violoncelo',
    bpm: 88,
    groove: 'ballad',
    leadTimbre: 'piano',
    counterTimbre: 'cello',
    arpTimbre: 'harp',
    padTimbre: 'violin',
    reverbMix: 0.44,
    delayMix: 0.18,
    padWarmthHz: 3900,
    root: 57, // A3
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6], // Am - F - C - G
    progB: [0, 3, 5, 4], // Am - Dm - F - Em
    progC: [3, 6, 2, 5], // Dm - G - C - F
    progD: [0, 5, 6, 4], // Am - F - G - Em
    motifA: [
      0, null, 2, null, 4, null, 3, 2,
      0, null, -2, null, 0, null, 2, null,
      6, null, 4, null, 3, 2, 3, null,
      1, null, 3, null, 2, 1, -1, null,
    ],
    motifB: [
      4, null, 7, null, 6, 5, 4, null,
      5, null, 4, 2, 3, null, 4, null,
      7, null, 9, null, 8, 7, 6, null,
      4, null, 3, 2, 4, null, null, null,
    ],
    seed: 11,
  },
  {
    biome: 'bioluminescent',
    title: 'Esporos Luminosos',
    modeName: 'Mi Dórico · Marimba, Celesta & Flauta Etérea',
    bpm: 104,
    groove: 'adventure',
    leadTimbre: 'marimba',
    counterTimbre: 'flute',
    arpTimbre: 'celesta',
    padTimbre: 'choir',
    reverbMix: 0.48,
    delayMix: 0.26,
    padWarmthHz: 4600,
    root: 52, // E3
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 5, 2, 6], // Em - C#m/C - G - D
    progB: [0, 3, 6, 4],
    progC: [2, 5, 3, 6],
    progD: [0, 2, 6, 4],
    motifA: [
      4, null, 6, 5, 4, null, 3, null,
      2, null, 3, 4, 6, null, null, null,
      7, null, 6, 5, 3, null, 4, null,
      5, null, 3, 2, 3, null, 1, null,
    ],
    seed: 17,
  },
  {
    biome: 'frostglass',
    title: 'Catedral de Safira',
    modeName: 'Ré Dórico · Celesta Glacial, Violino & Harpa',
    bpm: 96,
    groove: 'waltz',
    leadTimbre: 'celesta',
    counterTimbre: 'violin',
    arpTimbre: 'harp',
    padTimbre: 'choir',
    reverbMix: 0.56,
    delayMix: 0.24,
    padWarmthHz: 5200,
    root: 50, // D3
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 2, 6],
    progC: [5, 2, 3, 4],
    progD: [0, 3, 2, 6],
    motifA: [
      0, null, 4, null, 3, 2, 1, null,
      0, null, -1, null, 0, null, 2, null,
      7, null, 4, null, 2, 3, 4, null,
      5, null, 2, null, 0, null, -1, null,
    ],
    seed: 23,
  },
  {
    biome: 'obsidian_forge',
    title: 'Batida da Bigorna',
    modeName: 'Ré Frígio · Trompas Épicas, Órgão & Bigorna',
    bpm: 130,
    groove: 'heroic',
    leadTimbre: 'horn',
    counterTimbre: 'organ',
    arpTimbre: 'clockwork',
    padTimbre: 'cello',
    reverbMix: 0.34,
    delayMix: 0.12,
    padWarmthHz: 3400,
    root: 50, // D3
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4], // Dm - Eb - Cm - Am
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 5, 6],
    motifA: [
      0, null, 0, 2, 1, null, 0, null,
      1, null, 4, 3, 1, 0, -1, null,
      0, null, 4, null, 5, 4, 3, null,
      2, null, 1, 0, -1, null, 2, null,
    ],
    seed: 29,
  },
  {
    biome: 'astral_void',
    title: 'Horizonte Sideral',
    modeName: 'Dó# Menor · Coral Etéreo, Piano & Celesta',
    bpm: 82,
    groove: 'nocturne',
    leadTimbre: 'piano',
    counterTimbre: 'choir',
    arpTimbre: 'celesta',
    padTimbre: 'violin',
    reverbMix: 0.60,
    delayMix: 0.30,
    padWarmthHz: 4500,
    root: 49, // C#3
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 5, 6, 2],
    motifA: [
      0, null, 2, null, 4, null, 3, null,
      2, null, 0, null, -1, null, null, null,
      7, null, 4, null, 3, 2, 1, null,
      2, null, -1, null, 0, null, null, null,
    ],
    seed: 31,
  },
  {
    biome: 'crimson_sakura',
    title: 'Pétalas ao Vento',
    modeName: 'Mi Pentatônico · Flauta de Bambu, Koto & Cordas',
    bpm: 98,
    groove: 'eastern',
    leadTimbre: 'flute',
    counterTimbre: 'violin',
    arpTimbre: 'koto',
    padTimbre: 'cello',
    reverbMix: 0.45,
    delayMix: 0.22,
    padWarmthHz: 4400,
    root: 52,
    scale: [0, 2, 4, 7, 9, 12, 14],
    progA: [0, 3, 4, 2],
    progB: [0, 4, 3, 1],
    progC: [3, 1, 4, 2],
    progD: [0, 3, 4, 5],
    motifA: [
      0, null, 2, 3, 4, null, 2, null,
      3, null, 2, 1, 0, null, null, null,
      5, null, 4, 3, 4, null, 2, null,
      3, null, 1, 2, 0, null, null, null,
    ],
    seed: 37,
  },
  {
    biome: 'sunken_cathedral',
    title: 'Sinos Submersos',
    modeName: 'Fá# Dórico · Órgão de Catedral, Coral & Harpa',
    bpm: 86,
    groove: 'ballad',
    leadTimbre: 'organ',
    counterTimbre: 'choir',
    arpTimbre: 'harp',
    padTimbre: 'cello',
    reverbMix: 0.62,
    delayMix: 0.24,
    padWarmthHz: 3600,
    root: 54,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 3, 5, 4],
    progB: [0, 6, 3, 4],
    progC: [2, 5, 3, 6],
    progD: [0, 3, 6, 4],
    seed: 41,
  },
  {
    biome: 'clockwork_spire',
    title: 'Engrenagens do Tempo',
    modeName: 'Sol Menor Barroco · Cravo, Celesta & Violino',
    bpm: 124,
    groove: 'baroque',
    leadTimbre: 'harpsichord',
    counterTimbre: 'violin',
    arpTimbre: 'clockwork',
    padTimbre: 'cello',
    reverbMix: 0.34,
    delayMix: 0.18,
    padWarmthHz: 4800,
    root: 55,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 3, 4],
    progC: [2, 6, 3, 4],
    progD: [0, 5, 6, 4],
    seed: 43,
  },
  {
    biome: 'emerald_sky',
    title: 'Ventos de Esmeralda',
    modeName: 'Dó Lídio · Flauta, Piano & Violinos Alados',
    bpm: 112,
    groove: 'adventure',
    leadTimbre: 'flute',
    counterTimbre: 'violin',
    arpTimbre: 'piano',
    padTimbre: 'choir',
    reverbMix: 0.44,
    delayMix: 0.20,
    padWarmthHz: 5000,
    root: 60,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 3, 1, 4],
    progC: [5, 2, 3, 4],
    progD: [0, 1, 5, 4],
    seed: 47,
  },
  {
    biome: 'solar_mirage',
    title: 'Miragem Escarlate',
    modeName: 'Ré Duplo Harmônico · Alaúde, Oboé & Trompa',
    bpm: 116,
    groove: 'eastern',
    leadTimbre: 'oboe',
    counterTimbre: 'horn',
    arpTimbre: 'lute',
    padTimbre: 'cello',
    reverbMix: 0.42,
    delayMix: 0.22,
    padWarmthHz: 3900,
    root: 50,
    scale: [0, 1, 4, 5, 7, 8, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 3, 1, 4],
    progC: [5, 4, 1, 0],
    progD: [0, 1, 3, 4],
    seed: 53,
  },

  // ---- 11-20: SURFACE CHAPTERS 11-20 ----
  {
    biome: 'amethyst_crypt',
    title: 'Valso da Cripta',
    modeName: 'Sol# Menor · Caixinha de Música, Violoncelo & Órgão',
    bpm: 98,
    groove: 'waltz',
    leadTimbre: 'musicbox',
    counterTimbre: 'cello',
    arpTimbre: 'harpsichord',
    padTimbre: 'choir',
    reverbMix: 0.52,
    delayMix: 0.24,
    root: 56,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 2, 5, 4],
    progC: [3, 6, 2, 4],
    progD: [0, 5, 6, 4],
    seed: 59,
  },
  {
    biome: 'alchemical_labs',
    title: 'Elixir Cromático',
    modeName: 'Mi Lídio · Marimba, Pizzicato & Sintetizador',
    bpm: 118,
    groove: 'adventure',
    leadTimbre: 'marimba',
    counterTimbre: 'pizzicato',
    arpTimbre: 'celesta',
    padTimbre: 'violin',
    reverbMix: 0.36,
    delayMix: 0.24,
    root: 52,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 3, 4],
    progB: [0, 4, 5, 1],
    progC: [2, 5, 1, 4],
    progD: [0, 1, 4, 5],
    seed: 61,
  },
  {
    biome: 'aurora_zenith',
    title: 'Aurora Boreal',
    modeName: 'Si Bemol Lídio · Piano Cristalino, Coral & Violino',
    bpm: 92,
    groove: 'ballad',
    leadTimbre: 'piano',
    counterTimbre: 'violin',
    arpTimbre: 'celesta',
    padTimbre: 'choir',
    reverbMix: 0.58,
    delayMix: 0.28,
    root: 58,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 4, 5, 2],
    progB: [0, 1, 4, 5],
    progC: [3, 2, 5, 4],
    progD: [0, 4, 1, 5],
    seed: 67,
  },
  {
    biome: 'crimson_canyon',
    title: 'Coroa em Chamas',
    modeName: 'Mi Frígio · Trompete Heroico, Trompas & Cordas',
    bpm: 138,
    groove: 'boss',
    leadTimbre: 'trumpet',
    counterTimbre: 'horn',
    arpTimbre: 'violin',
    padTimbre: 'cello',
    reverbMix: 0.38,
    delayMix: 0.14,
    padWarmthHz: 4500,
    root: 52,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 5, 1, 4],
    progC: [3, 1, 5, 4],
    progD: [0, 1, 3, 6],
    motifA: [
      0, 0, 4, null, 3, 2, 1, null,
      0, null, 2, 4, 6, null, 5, null,
      7, null, 6, 5, 4, null, 3, null,
      2, null, 1, 0, -1, null, 4, null,
    ],
    seed: 71,
  },
  {
    biome: 'cyber_undercity',
    title: 'Pulso de Néon',
    modeName: 'Fá# Synthwave · Lead Analógico, Piano & Baixo',
    bpm: 132,
    groove: 'synthwave',
    leadTimbre: 'synthlead',
    counterTimbre: 'piano',
    arpTimbre: 'clockwork',
    padTimbre: 'choir',
    reverbMix: 0.38,
    delayMix: 0.24,
    padWarmthHz: 5200,
    root: 54,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 6],
    progC: [2, 6, 3, 4],
    progD: [0, 5, 6, 4],
    seed: 73,
  },
  {
    biome: 'celestial_marble',
    title: 'Sinfonia do Olimpo',
    modeName: 'Sol Maior Sinfônico · Violino Solo, Harpa & Trompas',
    bpm: 108,
    groove: 'heroic',
    leadTimbre: 'violin',
    counterTimbre: 'horn',
    arpTimbre: 'harp',
    padTimbre: 'choir',
    reverbMix: 0.50,
    delayMix: 0.18,
    root: 55,
    scale: [0, 2, 4, 5, 7, 9, 11],
    progA: [0, 4, 5, 3],
    progB: [0, 2, 3, 4],
    progC: [5, 3, 1, 4],
    progD: [0, 4, 5, 0],
    seed: 79,
  },
  {
    biome: 'ebony_fen',
    title: 'Brumas do Pântano',
    modeName: 'Dó# Lócrio · Oboé Sombrio, Violoncelo & Alaúde',
    bpm: 84,
    groove: 'nocturne',
    leadTimbre: 'oboe',
    counterTimbre: 'cello',
    arpTimbre: 'lute',
    padTimbre: 'organ',
    reverbMix: 0.52,
    delayMix: 0.20,
    padWarmthHz: 3100,
    root: 49,
    scale: [0, 1, 3, 5, 6, 8, 10],
    progA: [0, 5, 3, 1],
    progB: [0, 2, 5, 4],
    progC: [3, 1, 5, 6],
    progD: [0, 5, 1, 4],
    seed: 83,
  },
  {
    biome: 'orbital_nexus',
    title: 'Órbita Estelar',
    modeName: 'Lá Dórico · Synthlead, Celesta & Coral Espacial',
    bpm: 122,
    groove: 'synthwave',
    leadTimbre: 'synthlead',
    counterTimbre: 'choir',
    arpTimbre: 'celesta',
    padTimbre: 'violin',
    reverbMix: 0.48,
    delayMix: 0.28,
    root: 57,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 2, 6, 3],
    progB: [0, 5, 6, 4],
    progC: [3, 6, 2, 5],
    progD: [0, 2, 3, 6],
    seed: 89,
  },
  {
    biome: 'twilight_garden',
    title: 'Jardim do Crepúsculo',
    modeName: 'Fá Maior Pastoral · Flauta, Harpa & Violoncelo',
    bpm: 94,
    groove: 'ballad',
    leadTimbre: 'flute',
    counterTimbre: 'cello',
    arpTimbre: 'harp',
    padTimbre: 'piano',
    reverbMix: 0.46,
    delayMix: 0.20,
    root: 53,
    scale: [0, 2, 4, 5, 7, 9, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 2, 3, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 5, 3, 0],
    seed: 97,
  },
  {
    biome: 'stormcrown',
    title: 'Soberano do Pináculo',
    modeName: 'Lá Menor Épico · Orquestra Completa & Trompas',
    bpm: 144,
    groove: 'boss',
    leadTimbre: 'violin',
    counterTimbre: 'trumpet',
    arpTimbre: 'piano',
    padTimbre: 'choir',
    reverbMix: 0.46,
    delayMix: 0.18,
    padWarmthHz: 5200,
    masterVolume: 0.12,
    root: 57,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 6, 4],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 5, 6, 7],
    motifA: [
      0, null, 4, null, 3, 2, 1, null,
      0, null, 2, 3, 5, null, 4, null,
      7, null, 6, 5, 4, null, 2, null,
      3, null, 2, 0, -1, null, 4, null,
    ],
    seed: 101,
  },

  // ---- 21-50: SURFACE CHAPTERS 21-50 ----
  {
    biome: 'coral_abyss',
    title: 'Canto do Recife',
    modeName: 'Fá Lídio Submerso · Celesta, Harpa & Flauta',
    bpm: 96,
    groove: 'ballad',
    leadTimbre: 'celesta',
    counterTimbre: 'flute',
    arpTimbre: 'harp',
    padTimbre: 'choir',
    reverbMix: 0.56,
    delayMix: 0.28,
    root: 53,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 5],
    progB: [0, 2, 3, 4],
    progC: [5, 1, 2, 4],
    progD: [0, 1, 5, 4],
    seed: 103,
  },
  {
    biome: 'ember_steppe',
    title: 'Vento das Brasas',
    modeName: 'Ré Frígio · Trompas, Alaúde & Cordas Ardentes',
    bpm: 126,
    groove: 'heroic',
    leadTimbre: 'horn',
    counterTimbre: 'violin',
    arpTimbre: 'lute',
    padTimbre: 'cello',
    root: 50,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 6],
    progD: [0, 1, 5, 4],
    seed: 107,
  },
  {
    biome: 'jade_bamboo',
    title: 'Névoa de Bambu',
    modeName: 'Sol Pentatônico · Flauta, Koto & Violoncelo',
    bpm: 92,
    groove: 'eastern',
    leadTimbre: 'flute',
    counterTimbre: 'cello',
    arpTimbre: 'koto',
    padTimbre: 'violin',
    reverbMix: 0.48,
    root: 55,
    scale: [0, 2, 4, 7, 9, 12, 14],
    progA: [0, 3, 4, 2],
    progB: [0, 4, 3, 1],
    progC: [3, 1, 4, 2],
    progD: [0, 3, 4, 5],
    seed: 109,
  },
  {
    biome: 'glacial_fjord',
    title: 'Maré do Fiorde',
    modeName: 'Dó# Menor Ártico · Harpa, Trompa Nórdica & Coral',
    bpm: 106,
    groove: 'adventure',
    leadTimbre: 'horn',
    counterTimbre: 'choir',
    arpTimbre: 'harp',
    padTimbre: 'cello',
    reverbMix: 0.54,
    root: 49,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 3, 5],
    progD: [0, 5, 6, 4],
    seed: 113,
  },
  {
    biome: 'rust_foundry',
    title: 'Pistões de Ferro',
    modeName: 'Mi Lócrio Industrial · Relojoaria, Baixo & Metais',
    bpm: 134,
    groove: 'industrial',
    leadTimbre: 'clockwork',
    counterTimbre: 'horn',
    arpTimbre: 'synthlead',
    padTimbre: 'organ',
    reverbMix: 0.30,
    root: 52,
    scale: [0, 1, 3, 5, 6, 8, 10],
    progA: [0, 1, 5, 4],
    progB: [0, 3, 1, 6],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 4],
    seed: 127,
  },
  {
    biome: 'fungal_myriad',
    title: 'Pólen Dourado',
    modeName: 'Si Dórico · Caixinha de Música, Marimba & Harpa',
    bpm: 104,
    groove: 'waltz',
    leadTimbre: 'musicbox',
    counterTimbre: 'flute',
    arpTimbre: 'marimba',
    padTimbre: 'harp',
    reverbMix: 0.48,
    root: 59,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 2, 6],
    progC: [2, 5, 3, 4],
    progD: [0, 3, 2, 6],
    seed: 131,
  },
  {
    biome: 'storm_archipelago',
    title: 'Ilhas do Trovão',
    modeName: 'Lá Mixolídio · Trompete, Violino & Piano Tempestuoso',
    bpm: 132,
    groove: 'heroic',
    leadTimbre: 'trumpet',
    counterTimbre: 'violin',
    arpTimbre: 'piano',
    padTimbre: 'horn',
    reverbMix: 0.42,
    root: 57,
    scale: [0, 2, 4, 5, 7, 9, 10],
    progA: [0, 6, 3, 0],
    progB: [0, 4, 5, 6],
    progC: [3, 6, 1, 4],
    progD: [0, 6, 3, 4],
    seed: 137,
  },
  {
    biome: 'obsidian_temple',
    title: 'Altar de Obsidiana',
    modeName: 'Fá# Menor Harmônico · Oboé, Órgão & Coral',
    bpm: 114,
    groove: 'nocturne',
    leadTimbre: 'oboe',
    counterTimbre: 'choir',
    arpTimbre: 'organ',
    padTimbre: 'cello',
    reverbMix: 0.54,
    root: 54,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 6, 5, 4],
    progC: [3, 4, 5, 0],
    progD: [0, 5, 6, 4],
    seed: 139,
  },
  {
    biome: 'mercury_mire',
    title: 'Lago de Mercúrio',
    modeName: 'Mi Bemol Lídio · Celesta Líquida, Pizzicato & Piano',
    bpm: 110,
    groove: 'adventure',
    leadTimbre: 'celesta',
    counterTimbre: 'pizzicato',
    arpTimbre: 'piano',
    padTimbre: 'choir',
    reverbMix: 0.50,
    root: 51,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 5, 4],
    progB: [0, 2, 1, 4],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 4, 0],
    seed: 149,
  },
  {
    biome: 'crimson_foundry',
    title: 'Órgão Carmesim',
    modeName: 'Sol Menor Gótico · Órgão, Trompas & Violino',
    bpm: 124,
    groove: 'heroic',
    leadTimbre: 'organ',
    counterTimbre: 'horn',
    arpTimbre: 'violin',
    padTimbre: 'choir',
    reverbMix: 0.50,
    root: 55,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 6, 5, 4],
    progC: [2, 6, 3, 4],
    progD: [0, 5, 6, 4],
    seed: 151,
  },
  {
    biome: 'mirror_labyrinth',
    title: 'Reflexos Infinitos',
    modeName: 'Ré Dórico · Celesta em Cânone, Cravo & Violino',
    bpm: 114,
    groove: 'baroque',
    leadTimbre: 'celesta',
    counterTimbre: 'violin',
    arpTimbre: 'harpsichord',
    padTimbre: 'flute',
    reverbMix: 0.52,
    delayMix: 0.30,
    root: 50,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 3, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 3, 2, 4],
    seed: 157,
  },
  {
    biome: 'hourglass_desert',
    title: 'Dunas da Ampulheta',
    modeName: 'Mi Duplo Harmônico · Alaúde, Koto & Oboé',
    bpm: 120,
    groove: 'eastern',
    leadTimbre: 'lute',
    counterTimbre: 'oboe',
    arpTimbre: 'koto',
    padTimbre: 'cello',
    reverbMix: 0.44,
    root: 52,
    scale: [0, 1, 4, 5, 7, 8, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 4, 0],
    progD: [0, 1, 3, 4],
    seed: 163,
  },
  {
    biome: 'velvet_opera',
    title: 'Valsa Crepuscular',
    modeName: 'Dó Menor Barroco · Violino, Cravo & Soprano Coral',
    bpm: 106,
    groove: 'waltz',
    leadTimbre: 'violin',
    counterTimbre: 'choir',
    arpTimbre: 'harpsichord',
    padTimbre: 'cello',
    reverbMix: 0.54,
    root: 48,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 3, 4, 0],
    progB: [0, 5, 3, 4],
    progC: [2, 5, 6, 4],
    progD: [0, 5, 3, 4],
    seed: 167,
  },
  {
    biome: 'bone_catacombs',
    title: 'Cântico do Ossuário',
    modeName: 'Lá Frígio Espectral · Órgão, Violoncelo & Pizzicato',
    bpm: 100,
    groove: 'nocturne',
    leadTimbre: 'organ',
    counterTimbre: 'cello',
    arpTimbre: 'pizzicato',
    padTimbre: 'choir',
    reverbMix: 0.56,
    root: 57,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 0],
    seed: 173,
  },
  {
    biome: 'cloud_monastery',
    title: 'Sinos das Nuvens',
    modeName: 'Fá Pentatônico Celeste · Flauta, Piano & Celesta',
    bpm: 88,
    groove: 'ballad',
    leadTimbre: 'flute',
    counterTimbre: 'piano',
    arpTimbre: 'celesta',
    padTimbre: 'choir',
    reverbMix: 0.56,
    root: 53,
    scale: [0, 2, 4, 7, 9, 12, 14],
    progA: [0, 3, 4, 2],
    progB: [0, 4, 2, 3],
    progC: [3, 1, 4, 0],
    progD: [0, 3, 4, 5],
    seed: 179,
  },
  {
    biome: 'cyber_grid',
    title: 'Pulso Holográfico',
    modeName: 'Dó# Synthwave · Sintetizador, Baixo & Relojoaria',
    bpm: 138,
    groove: 'synthwave',
    leadTimbre: 'synthlead',
    counterTimbre: 'horn',
    arpTimbre: 'clockwork',
    padTimbre: 'choir',
    reverbMix: 0.38,
    delayMix: 0.24,
    root: 49,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 6, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 5, 6, 4],
    seed: 181,
  },
  {
    biome: 'amber_hive',
    title: 'Zumbido de Âmbar',
    modeName: 'Si Bemol Mixolídio · Marimba, Pizzicato & Oboé',
    bpm: 124,
    groove: 'adventure',
    leadTimbre: 'marimba',
    counterTimbre: 'oboe',
    arpTimbre: 'pizzicato',
    padTimbre: 'violin',
    root: 58,
    scale: [0, 2, 4, 5, 7, 9, 10],
    progA: [0, 6, 3, 0],
    progB: [0, 4, 5, 6],
    progC: [3, 6, 1, 4],
    progD: [0, 6, 3, 4],
    seed: 191,
  },
  {
    biome: 'astral_library',
    title: 'Arquivos Astrais',
    modeName: 'Ré Lídio Arcano · Piano, Celesta & Violoncelo',
    bpm: 94,
    groove: 'ballad',
    leadTimbre: 'piano',
    counterTimbre: 'cello',
    arpTimbre: 'musicbox',
    padTimbre: 'violin',
    reverbMix: 0.50,
    root: 50,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 5],
    progB: [0, 2, 1, 4],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 5, 4],
    seed: 193,
  },
  {
    biome: 'magnetic_rift',
    title: 'Fenda Polar',
    modeName: 'Fá# Dórico Elétrico · Synthlead, Violino & Celesta',
    bpm: 128,
    groove: 'synthwave',
    leadTimbre: 'synthlead',
    counterTimbre: 'violin',
    arpTimbre: 'celesta',
    padTimbre: 'horn',
    root: 54,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 2, 6],
    progC: [2, 6, 3, 4],
    progD: [0, 3, 2, 6],
    seed: 197,
  },
  {
    biome: 'prism_sanctum',
    title: 'Hino do Prisma',
    modeName: 'Lá Lídio Radiante · Harpa, Piano & Coral Celestial',
    bpm: 114,
    groove: 'heroic',
    leadTimbre: 'piano',
    counterTimbre: 'choir',
    arpTimbre: 'harp',
    padTimbre: 'violin',
    reverbMix: 0.52,
    root: 57,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 4, 5, 1],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 4, 5],
    seed: 199,
  },
  {
    biome: 'void_nebula',
    title: 'Poeira Cósmica',
    modeName: 'Dó# Eólio Espacial · Coral, Piano & Synth Pad',
    bpm: 98,
    groove: 'nocturne',
    leadTimbre: 'piano',
    counterTimbre: 'choir',
    arpTimbre: 'celesta',
    padTimbre: 'synthlead',
    reverbMix: 0.60,
    delayMix: 0.30,
    root: 49,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 3, 5],
    progD: [0, 5, 6, 4],
    seed: 211,
  },
  {
    biome: 'solar_corona',
    title: 'Fulgor da Supernova',
    modeName: 'Mi Lídio Solar · Trompete, Trompas & Cordas Triunfais',
    bpm: 136,
    groove: 'heroic',
    leadTimbre: 'trumpet',
    counterTimbre: 'horn',
    arpTimbre: 'synthlead',
    padTimbre: 'violin',
    reverbMix: 0.44,
    root: 52,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 4, 1, 5],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 5, 4],
    seed: 223,
  },
  {
    biome: 'lunar_bastion',
    title: 'Crateras Prateadas',
    modeName: 'Si Eólio Lunar · Celesta, Flauta & Violoncelo',
    bpm: 90,
    groove: 'ballad',
    leadTimbre: 'celesta',
    counterTimbre: 'cello',
    arpTimbre: 'flute',
    padTimbre: 'choir',
    reverbMix: 0.56,
    root: 59,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [3, 6, 2, 5],
    progD: [0, 5, 6, 4],
    seed: 227,
  },
  {
    biome: 'chrono_paradox',
    title: 'Paradoxo dos Ponteiros',
    modeName: 'Sol# Menor Cromático · Cravo, Relojoaria & Violinos',
    bpm: 130,
    groove: 'baroque',
    leadTimbre: 'harpsichord',
    counterTimbre: 'violin',
    arpTimbre: 'clockwork',
    padTimbre: 'cello',
    root: 56,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 3, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 5, 6, 4],
    seed: 229,
  },
  {
    biome: 'starlight_harbor',
    title: 'Velas de Luz Estelar',
    modeName: 'Dó Lídio Marítimo · Flauta, Alaúde & Cordas',
    bpm: 110,
    groove: 'adventure',
    leadTimbre: 'flute',
    counterTimbre: 'violin',
    arpTimbre: 'lute',
    padTimbre: 'cello',
    root: 48,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 4, 5, 1],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 5, 4],
    seed: 233,
  },
  {
    biome: 'blood_eclipse',
    title: 'Vigília do Eclipse',
    modeName: 'Fá Frígio Escarlate · Órgão, Trompas & Coral Sombrio',
    bpm: 134,
    groove: 'boss',
    leadTimbre: 'organ',
    counterTimbre: 'horn',
    arpTimbre: 'violin',
    padTimbre: 'choir',
    reverbMix: 0.48,
    root: 53,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 7],
    seed: 239,
  },
  {
    biome: 'crystal_singularity',
    title: 'Horizonte de Eventos',
    modeName: 'Mi Bemol Menor Cósmico · Synthlead, Piano & Coral',
    bpm: 126,
    groove: 'synthwave',
    leadTimbre: 'synthlead',
    counterTimbre: 'piano',
    arpTimbre: 'musicbox',
    padTimbre: 'choir',
    reverbMix: 0.50,
    root: 51,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 3, 4],
    progD: [0, 5, 6, 4],
    seed: 241,
  },
  {
    biome: 'seraph_citadel',
    title: 'Coro dos Serafins',
    modeName: 'Sol Lídio Celestial · Harpa, Trompete & Coral Sinfônico',
    bpm: 118,
    groove: 'heroic',
    leadTimbre: 'trumpet',
    counterTimbre: 'choir',
    arpTimbre: 'harp',
    padTimbre: 'violin',
    reverbMix: 0.54,
    root: 55,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 0],
    progB: [0, 4, 5, 1],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 5, 4],
    seed: 251,
  },
  {
    biome: 'abyss_throne',
    title: 'Trono do Abismo',
    modeName: 'Ré Menor Abissal · Órgão, Violino & Trompas de Batalha',
    bpm: 142,
    groove: 'boss',
    leadTimbre: 'organ',
    counterTimbre: 'horn',
    arpTimbre: 'violin',
    padTimbre: 'choir',
    reverbMix: 0.48,
    root: 50,
    scale: [0, 1, 3, 5, 7, 8, 11],
    progA: [0, 1, 6, 4],
    progB: [0, 5, 1, 4],
    progC: [3, 1, 5, 4],
    progD: [0, 1, 6, 7],
    seed: 257,
  },
  {
    biome: 'eternity_apex',
    title: 'Ápice da Eternidade',
    modeName: 'Dó Lídio Final · Grande Orquestra, Piano & Coral Épico',
    bpm: 146,
    groove: 'boss',
    leadTimbre: 'piano',
    counterTimbre: 'violin',
    arpTimbre: 'harp',
    padTimbre: 'choir',
    reverbMix: 0.50,
    delayMix: 0.22,
    padWarmthHz: 5400,
    masterVolume: 0.125,
    root: 60,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 4, 5, 1],
    progB: [0, 3, 4, 5],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 4, 7],
    motifA: [
      0, null, 2, 4, 6, null, 4, null,
      5, null, 4, 2, 4, null, 7, null,
      6, null, 4, 2, 1, null, 4, null,
      2, null, 1, 0, -1, null, 4, null,
    ],
    seed: 263,
  },

  // ---- 51-70: UNDERWORLD CIRCLES (20 BESPOKE COMPOSITIONS) ----
  {
    biome: 'styx_ferry',
    title: 'Travessia do Estige',
    modeName: 'Mi Menor Fúnebre · Violoncelo, Piano & Coral Baixo',
    bpm: 84,
    groove: 'ballad',
    leadTimbre: 'cello',
    counterTimbre: 'choir',
    arpTimbre: 'piano',
    padTimbre: 'organ',
    reverbMix: 0.56,
    root: 52,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 3, 4],
    progB: [0, 2, 5, 4],
    progC: [3, 6, 2, 4],
    progD: [0, 5, 6, 4],
    seed: 307,
  },
  {
    biome: 'asphodel_wastes',
    title: 'Campos de Asfódelos',
    modeName: 'Lá Dórico Sombrio · Flauta, Harpa & Violoncelo',
    bpm: 90,
    groove: 'nocturne',
    leadTimbre: 'flute',
    counterTimbre: 'cello',
    arpTimbre: 'harp',
    padTimbre: 'violin',
    reverbMix: 0.54,
    root: 57,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 2, 6],
    progC: [2, 5, 3, 4],
    progD: [0, 3, 2, 4],
    seed: 311,
  },
  {
    biome: 'brass_tartarus',
    title: 'Forjas do Tártaro',
    modeName: 'Ré Frígio Metálico · Trompas, Bigorna & Órgão',
    bpm: 132,
    groove: 'industrial',
    leadTimbre: 'horn',
    counterTimbre: 'organ',
    arpTimbre: 'clockwork',
    padTimbre: 'cello',
    root: 50,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 0],
    seed: 313,
  },
  {
    biome: 'brimstone_caldera',
    title: 'Caldeira de Enxofre',
    modeName: 'Fá Frígio Ardente · Trompete, Trompas & Cordas',
    bpm: 136,
    groove: 'boss',
    leadTimbre: 'trumpet',
    counterTimbre: 'horn',
    arpTimbre: 'violin',
    padTimbre: 'organ',
    root: 53,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 5, 1, 4],
    progC: [3, 1, 5, 4],
    progD: [0, 1, 6, 7],
    seed: 317,
  },
  {
    biome: 'blood_aqueduct',
    title: 'Aqueduto Rubro',
    modeName: 'Sol Menor Harmônico · Violino, Cravo & Violoncelo',
    bpm: 118,
    groove: 'baroque',
    leadTimbre: 'violin',
    counterTimbre: 'cello',
    arpTimbre: 'harpsichord',
    padTimbre: 'choir',
    root: 55,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 3, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 5, 6, 4],
    seed: 331,
  },
  {
    biome: 'bone_ossuary',
    title: 'Ossuário Eterno',
    modeName: 'Si Menor Macabro · Marimba, Pizzicato & Órgão',
    bpm: 108,
    groove: 'waltz',
    leadTimbre: 'marimba',
    counterTimbre: 'organ',
    arpTimbre: 'pizzicato',
    padTimbre: 'cello',
    root: 59,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 2, 5, 4],
    progC: [3, 6, 2, 4],
    progD: [0, 5, 6, 4],
    seed: 337,
  },
  {
    biome: 'cocytus_trench',
    title: 'Fossa de Cocito',
    modeName: 'Dó# Menor Glacial · Celesta, Coral & Piano',
    bpm: 88,
    groove: 'ballad',
    leadTimbre: 'celesta',
    counterTimbre: 'choir',
    arpTimbre: 'piano',
    padTimbre: 'violin',
    reverbMix: 0.60,
    root: 49,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 3, 5],
    progD: [0, 5, 6, 4],
    seed: 347,
  },
  {
    biome: 'phlegethon_rapids',
    title: 'Corredeiras de Fogo',
    modeName: 'Mi Frígio Veloz · Synthlead, Trompa & Baixo',
    bpm: 140,
    groove: 'heroic',
    leadTimbre: 'horn',
    counterTimbre: 'synthlead',
    arpTimbre: 'violin',
    padTimbre: 'organ',
    root: 52,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 4],
    seed: 349,
  },
  {
    biome: 'acheron_gorge',
    title: 'Desfiladeiro de Aqueronte',
    modeName: 'Dó Menor Dramático · Oboé, Violoncelo & Harpa',
    bpm: 100,
    groove: 'adventure',
    leadTimbre: 'oboe',
    counterTimbre: 'cello',
    arpTimbre: 'harp',
    padTimbre: 'choir',
    root: 48,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 3, 5],
    progD: [0, 5, 6, 4],
    seed: 353,
  },
  {
    biome: 'lethe_depths',
    title: 'Águas do Esquecimento',
    modeName: 'Fá# Lídio Onírico · Caixinha de Música, Flauta & Harpa',
    bpm: 82,
    groove: 'nocturne',
    leadTimbre: 'musicbox',
    counterTimbre: 'flute',
    arpTimbre: 'harp',
    padTimbre: 'choir',
    reverbMix: 0.60,
    root: 54,
    scale: [0, 2, 4, 6, 7, 9, 11],
    progA: [0, 1, 4, 5],
    progB: [0, 2, 1, 4],
    progC: [5, 2, 1, 4],
    progD: [0, 1, 5, 4],
    seed: 359,
  },
  {
    biome: 'wailing_spires',
    title: 'Torres do Lamento',
    modeName: 'Sol# Menor · Violino, Órgão & Coral Lamentoso',
    bpm: 112,
    groove: 'waltz',
    leadTimbre: 'violin',
    counterTimbre: 'choir',
    arpTimbre: 'organ',
    padTimbre: 'cello',
    root: 56,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 2, 5, 4],
    progC: [3, 6, 2, 4],
    progD: [0, 5, 6, 4],
    seed: 367,
  },
  {
    biome: 'iron_dungeon',
    title: 'Masmorra de Ferro',
    modeName: 'Ré Lócrio · Relojoaria, Trompa & Baixo Pesado',
    bpm: 128,
    groove: 'industrial',
    leadTimbre: 'clockwork',
    counterTimbre: 'horn',
    arpTimbre: 'pizzicato',
    padTimbre: 'organ',
    root: 50,
    scale: [0, 1, 3, 5, 6, 8, 10],
    progA: [0, 1, 5, 4],
    progB: [0, 3, 1, 6],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 4],
    seed: 373,
  },
  {
    biome: 'pestilence_marsh',
    title: 'Pântano Pestilento',
    modeName: 'Fá# Lócrio · Oboé, Marimba & Violoncelo',
    bpm: 96,
    groove: 'nocturne',
    leadTimbre: 'oboe',
    counterTimbre: 'cello',
    arpTimbre: 'marimba',
    padTimbre: 'organ',
    root: 54,
    scale: [0, 1, 3, 5, 6, 8, 10],
    progA: [0, 5, 3, 1],
    progB: [0, 2, 5, 4],
    progC: [3, 1, 5, 6],
    progD: [0, 5, 1, 4],
    seed: 379,
  },
  {
    biome: 'ash_necropolis',
    title: 'Necrópole Cinzenta',
    modeName: 'Lá Menor Harmônico · Órgão, Piano & Coral',
    bpm: 104,
    groove: 'ballad',
    leadTimbre: 'piano',
    counterTimbre: 'choir',
    arpTimbre: 'organ',
    padTimbre: 'cello',
    root: 57,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 2, 5, 4],
    progC: [3, 6, 2, 4],
    progD: [0, 5, 6, 4],
    seed: 383,
  },
  {
    biome: 'obsidian_labyrinth',
    title: 'Labirinto de Obsidiana',
    modeName: 'Dó# Menor Barroco · Cravo, Violino & Relojoaria',
    bpm: 126,
    groove: 'baroque',
    leadTimbre: 'harpsichord',
    counterTimbre: 'violin',
    arpTimbre: 'clockwork',
    padTimbre: 'cello',
    root: 49,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 3, 6, 4],
    progB: [0, 5, 3, 4],
    progC: [2, 6, 5, 4],
    progD: [0, 5, 6, 4],
    seed: 389,
  },
  {
    biome: 'hellglass_cathedral',
    title: 'Catedral de Vidro Infernal',
    modeName: 'Mi Menor Gótico · Órgão, Celesta & Trompas',
    bpm: 120,
    groove: 'heroic',
    leadTimbre: 'organ',
    counterTimbre: 'horn',
    arpTimbre: 'celesta',
    padTimbre: 'choir',
    reverbMix: 0.56,
    root: 52,
    scale: [0, 2, 3, 5, 7, 8, 11],
    progA: [0, 5, 3, 4],
    progB: [0, 6, 5, 4],
    progC: [2, 6, 3, 4],
    progD: [0, 5, 6, 4],
    seed: 397,
  },
  {
    biome: 'shadow_sanctum',
    title: 'Santuário das Sombras',
    modeName: 'Si Frígio · Alaúde, Flauta & Coral Noturno',
    bpm: 102,
    groove: 'eastern',
    leadTimbre: 'flute',
    counterTimbre: 'choir',
    arpTimbre: 'lute',
    padTimbre: 'cello',
    root: 59,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 3, 1, 4],
    progC: [5, 1, 3, 4],
    progD: [0, 1, 6, 4],
    seed: 401,
  },
  {
    biome: 'magma_core',
    title: 'Núcleo de Magma',
    modeName: 'Ré Frígio Vulcânico · Trompas, Synthlead & Bigorna',
    bpm: 138,
    groove: 'boss',
    leadTimbre: 'horn',
    counterTimbre: 'synthlead',
    arpTimbre: 'clockwork',
    padTimbre: 'organ',
    root: 50,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progA: [0, 1, 6, 4],
    progB: [0, 5, 1, 4],
    progC: [3, 1, 5, 4],
    progD: [0, 1, 6, 7],
    seed: 409,
  },
  {
    biome: 'void_gate',
    title: 'Portal do Vazio',
    modeName: 'Eb Menor Espacial · Synthlead, Piano & Coral',
    bpm: 130,
    groove: 'synthwave',
    leadTimbre: 'synthlead',
    counterTimbre: 'choir',
    arpTimbre: 'piano',
    padTimbre: 'violin',
    root: 51,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progA: [0, 5, 2, 6],
    progB: [0, 3, 5, 4],
    progC: [2, 6, 3, 4],
    progD: [0, 5, 6, 4],
    seed: 419,
  },
  {
    biome: 'pandemonium_citadel',
    title: 'Cidadela do Pandemônio',
    modeName: 'Mi Menor Sinfônico · Grande Orquestra do Submundo',
    bpm: 146,
    groove: 'boss',
    leadTimbre: 'trumpet',
    counterTimbre: 'violin',
    arpTimbre: 'organ',
    padTimbre: 'choir',
    reverbMix: 0.50,
    delayMix: 0.18,
    padWarmthHz: 5400,
    masterVolume: 0.125,
    root: 52,
    scale: [0, 1, 3, 5, 7, 8, 11],
    progA: [0, 1, 6, 4],
    progB: [0, 5, 1, 4],
    progC: [3, 1, 5, 4],
    progD: [0, 1, 6, 7],
    motifA: [
      0, 1, 4, null, 3, 2, 1, null,
      0, null, 3, 4, 6, null, 4, null,
      7, null, 6, 5, 4, null, 2, null,
      3, null, 1, 0, -1, null, 4, null,
    ],
    seed: 421,
  },
];

export const BIOME_MUSIC_SCORES: Record<AnyBiomeId, BiomeMusicScore> = (() => {
  const map: Record<string, BiomeMusicScore> = {};
  for (const bp of ALL_BLUEPRINTS) {
    map[bp.biome] = composeEpicScore(bp);
  }
  return map as Record<AnyBiomeId, BiomeMusicScore>;
})();

export function getBiomeMusicScore(biome: AnyBiomeId | string): BiomeMusicScore {
  return (BIOME_MUSIC_SCORES as Record<string, BiomeMusicScore>)[biome] ?? BIOME_MUSIC_SCORES.silver_ash;
}

export const JUKEBOX_TO_BIOME: Record<string, BiomeId> = {
  cinzas_tema: 'silver_ash',
  micelio_danca: 'bioluminescent',
  forja_furia: 'obsidian_forge',
  sakura_vento: 'crimson_sakura',
  crono_engrenagem: 'clockwork_spire',
  vazio_astral: 'astral_void',
  boss_duelo: 'crimson_canyon',
  pinaculo_final: 'stormcrown',
};

/** Computes how many steps a melody/bass note holds before the next note in the 256-step score */
export function computeNoteSteps(pattern: (number | null)[], stepIdx: number, maxHold = 8): number {
  let steps = 1;
  for (let i = 1; i < maxHold; i++) {
    const next = pattern[(stepIdx + i) % pattern.length];
    if (next !== null) break;
    steps++;
  }
  return steps;
}
