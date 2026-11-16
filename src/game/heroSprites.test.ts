import assert from 'node:assert/strict';
import test from 'node:test';
import { HEROES, getHeroDef, getHeroSkinDef } from './heroes';
import { HERO_PIXEL_H, HERO_PIXEL_W, HERO_VISUAL_PROFILES } from './heroArtRenderer';
import { HERO_ANIM_FRAME_COUNTS, buildHeroPalette, type HeroAnimKey } from './sprites';

const EXPECTED_ANIMS: HeroAnimKey[] = [
  'idle',
  'run',
  'jump',
  'fall',
  'dash',
  'climb',
  'wall_slide',
  'crouch',
  'swim',
  'glide',
  'skill',
  'victory',
];

test('studio pixel-art canvas resolution is upgraded to 56x64 high-craft Celeste-Plus grid', () => {
  assert.equal(HERO_PIXEL_W, 56);
  assert.equal(HERO_PIXEL_H, 64);
});

test('all 48 heroes exist with unique IDs, signatures, and 3 skins each (144 variants)', () => {
  assert.equal(HEROES.length, 48);
  const ids = new Set<string>();
  const signatures = new Set<string>();
  let totalSkins = 0;
  for (const h of HEROES) {
    assert.ok(!ids.has(h.id), `Duplicate hero id: ${h.id}`);
    ids.add(h.id);
    assert.equal(h.skins.length, 3, `Hero ${h.id} must have 3 skins`);
    totalSkins += h.skins.length;
    const prof = HERO_VISUAL_PROFILES[h.id];
    assert.ok(prof, `Missing HERO_VISUAL_PROFILES for ${h.id}`);
    assert.ok(prof.signature && !signatures.has(prof.signature), `Hero ${h.id} needs unique signature (${prof.signature})`);
    signatures.add(prof.signature);
  }
  assert.equal(totalSkins, 144);
  assert.equal(signatures.size, 48);
});

test('all 12 Celeste hero animation states are registered with multi-frame counts', () => {
  for (const anim of EXPECTED_ANIMS) {
    const count = HERO_ANIM_FRAME_COUNTS[anim];
    assert.ok(typeof count === 'number' && count >= 2, `Expected >=2 frames for ${anim}, got ${count}`);
  }
  assert.equal(Object.keys(HERO_ANIM_FRAME_COUNTS).length, 12);
});

test('buildHeroPalette resolves valid hex colors for every hero, skin, and dash state', () => {
  for (const h of HEROES) {
    const def = getHeroDef(h.id);
    for (const sk of def.skins) {
      const resolvedSkin = getHeroSkinDef(h.id, sk.id);
      assert.equal(resolvedSkin.id, sk.id);
      for (const dashes of [0, 1, 2]) {
        const pal = buildHeroPalette(h.id, dashes, false, false, sk.id);
        assert.match(pal.o, /^#[0-9a-fA-F]{6}$/);
        assert.match(pal.h, /^#[0-9a-fA-F]{6}$/);
        assert.match(pal.C, /^#[0-9a-fA-F]{6}$/);
        assert.match(pal.e, /^#[0-9a-fA-F]{6}$/);
      }
      const featherPal = buildHeroPalette(h.id, 1, true, false, sk.id);
      assert.match(featherPal.h, /^#[0-9a-fA-F]{6}$/);
      if (h.id === 'lyra' && sk.id === 'default') {
        assert.equal(featherPal.h, '#ffd24d');
      }
    }
  }
});
