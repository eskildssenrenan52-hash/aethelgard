import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BIOME_MUSIC_SCORES,
  JUKEBOX_TO_BIOME,
  SONG_LENGTH,
  computeNoteSteps,
  getBiomeMusicScore,
  getSectionAtStep,
  midiToFreq,
} from './biomeMusic';
import { AnyBiomeId, BiomeId, UNDERWORLD_BIOMES } from './types';

const SURFACE_BIOMES: BiomeId[] = [
  'silver_ash', 'bioluminescent', 'frostglass', 'obsidian_forge', 'astral_void',
  'crimson_sakura', 'sunken_cathedral', 'clockwork_spire', 'emerald_sky', 'solar_mirage',
  'amethyst_crypt', 'alchemical_labs', 'aurora_zenith', 'crimson_canyon', 'cyber_undercity',
  'celestial_marble', 'ebony_fen', 'orbital_nexus', 'twilight_garden', 'stormcrown',
  'coral_abyss', 'ember_steppe', 'jade_bamboo', 'glacial_fjord', 'rust_foundry',
  'fungal_myriad', 'storm_archipelago', 'obsidian_temple', 'mercury_mire', 'crimson_foundry',
  'mirror_labyrinth', 'hourglass_desert', 'velvet_opera', 'bone_catacombs', 'cloud_monastery',
  'cyber_grid', 'amber_hive', 'astral_library', 'magnetic_rift', 'prism_sanctum',
  'void_nebula', 'solar_corona', 'lunar_bastion', 'chrono_paradox', 'starlight_harbor',
  'blood_eclipse', 'crystal_singularity', 'seraph_citadel', 'abyss_throne', 'eternity_apex',
];

test('all 50 Surface and 20 Underworld biomes (70 total) have full 256-step (32-bar) symphonic scores', () => {
  assert.equal(SONG_LENGTH, 256);
  const allBiomes: AnyBiomeId[] = [...SURFACE_BIOMES, ...UNDERWORLD_BIOMES];
  assert.equal(new Set(allBiomes).size, 70);

  for (const biome of allBiomes) {
    const score = BIOME_MUSIC_SCORES[biome];
    assert.ok(score, `Missing score for biome: ${biome}`);
    assert.equal(score.length, 256);
    assert.equal(score.chords.length, 32, `${biome} should have 32 bars of chords`);
    assert.equal(score.melody.length, 256, `${biome} melody should have 256 steps`);
    assert.equal(score.melodyVelocity.length, 256, `${biome} melodyVelocity should have 256 steps`);
    assert.equal(score.counterMelody.length, 256, `${biome} counterMelody should have 256 steps`);
    assert.equal(score.counterArp.length, 256, `${biome} counterArp should have 256 steps`);
    assert.equal(score.ostinato.length, 256, `${biome} ostinato should have 256 steps`);
    assert.equal(score.bass.length, 256, `${biome} bass should have 256 steps`);
    assert.equal(score.drums.length, 256, `${biome} drums should have 256 steps`);
    assert.ok(score.bpm >= 75 && score.bpm <= 165, `${biome} BPM out of range: ${score.bpm}`);
    assert.ok(score.chordVoicingStyle, `${biome} must define chordVoicingStyle`);
  }
});

test('every biome arrangement uses multiple distinct instruments, ostinato, and 4-note extended chords', () => {
  for (const [biome, score] of Object.entries(BIOME_MUSIC_SCORES)) {
    const instruments = new Set([
      score.leadTimbre,
      score.counterTimbre,
      score.arpTimbre,
      score.padTimbre,
      score.ostinatoTimbre,
    ]);
    assert.ok(
      instruments.size >= 3,
      `${biome} should orchestrate at least 3 distinct timbres (got ${instruments.size})`
    );

    for (const chord of score.chords) {
      assert.equal(chord.length, 4, `${biome} chords must be 4-note voicings`);
      for (const midi of chord) {
        assert.ok(midi >= 24 && midi <= 108, `${biome} chord note out of MIDI range: ${midi}`);
      }
    }

    for (const n of score.melody) {
      if (n !== null) {
        assert.ok(n >= 36 && n <= 104, `${biome} melody note out of range: ${n}`);
      }
    }
    for (const v of score.melodyVelocity) {
      assert.ok(v >= 0.5 && v <= 1.3, `${biome} velocity out of bounds: ${v}`);
    }
  }
});

test('multi-section evolution: 6 arcs (INTRO, A, B, C, D, OUTRO) are melodically and orchestrally distinct', () => {
  for (const [biome, score] of Object.entries(BIOME_MUSIC_SCORES)) {
    const intro = score.melody.slice(0, 16);
    const secA = score.melody.slice(16, 64);
    const secB = score.melody.slice(64, 128);
    const secC = score.melody.slice(128, 192);
    const secD = score.melody.slice(192, 240);
    const outro = score.melody.slice(240, 256);

    assert.notDeepEqual(intro, outro, `${biome} intro & outro cadence should differ`);
    assert.notDeepEqual(secA, secC, `${biome} section C bridge must differ from section A`);
    assert.notDeepEqual(secA.slice(0, 48), secD, `${biome} section D climax must differ from section A`);
    assert.notDeepEqual(secB, secC, `${biome} section B and C must differ`);

    const counterNotes = score.counterMelody.filter((n) => n !== null);
    assert.ok(counterNotes.length >= 32, `${biome} counter-melody should be active`);

    const ostNotes = score.ostinato.filter((n) => n !== null);
    assert.ok(ostNotes.length >= 48, `${biome} ostinato should propel rhythms`);

    const drumKinds = new Set(score.drums.filter(Boolean));
    assert.ok(drumKinds.size >= 4, `${biome} should use at least 4 percussion voices`);
  }
});

test('Jukebox mappings and 6-section utilities resolve cleanly', () => {
  for (const [trackId, biome] of Object.entries(JUKEBOX_TO_BIOME)) {
    const score = getBiomeMusicScore(biome);
    assert.equal(score.biome, biome, `Jukebox track ${trackId} did not map cleanly`);
  }

  assert.equal(getSectionAtStep(0), 'INTRO');
  assert.equal(getSectionAtStep(16), 'A');
  assert.equal(getSectionAtStep(64), 'B');
  assert.equal(getSectionAtStep(128), 'C');
  assert.equal(getSectionAtStep(192), 'D');
  assert.equal(getSectionAtStep(240), 'OUTRO');
  assert.equal(getSectionAtStep(256), 'INTRO');

  assert.ok(Math.abs(midiToFreq(69) - 440) < 0.001);
  assert.equal(computeNoteSteps([60, null, null, 64], 0, 8), 3);
});
