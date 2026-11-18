// @ts-nocheck -- Celeste-True 40x40 Studio Pixel-Art Hero & Portrait Engine
// Renders all 48 heroes x 3 skins (144 variants) across 12 multi-frame actions
// on a crisp 40x40 pixel-art grid calibrated 1:1 with the 8x11 gameplay hitbox:
// - HSL hue-shifted shadows & highlights (never flat grey/black multiplication)
// - Selective chromatic dark-ink outlining & stepped rim speculars
// - Compact Celeste proportions: 12-world-px core silhouette on 8x11 hitbox + crouch compression
// - Sculpted 16 archetypes, 48 unique signatures, 15 headgears, 16 weapons, luminous Celeste eyes
import { getHeroDef, getHeroSkinDef, type HeroId } from './heroes';
import { buildHeroPalette, HERO_ANIM_FRAME_COUNTS, type HeroAnimKey } from './sprites';
import { colorWithAlpha } from './visualFx';

export type SilhouetteArchetype =
  | 'ranger'
  | 'knight'
  | 'mage'
  | 'assassin'
  | 'seraph'
  | 'samurai'
  | 'valkyrie'
  | 'draconic'
  | 'kitsune'
  | 'mecha'
  | 'witch'
  | 'monk'
  | 'alchemist'
  | 'royal'
  | 'reaper'
  | 'druid';

export type HairStyleKind =
  | 'flowing'
  | 'ponytail'
  | 'twintails'
  | 'spiky'
  | 'bob'
  | 'long_noble'
  | 'braid'
  | 'hooded'
  | 'wild_mane';

export type HeadgearKind =
  | 'none'
  | 'crown'
  | 'halo'
  | 'horns'
  | 'kitsune_ears'
  | 'visor'
  | 'witch_hat'
  | 'valkyrie_wings'
  | 'kabuto'
  | 'plague_mask'
  | 'flower_crown'
  | 'antlers'
  | 'goggles'
  | 'jester_cap'
  | 'tiara';

export type WeaponKind =
  | 'blade'
  | 'katana'
  | 'staff'
  | 'greatsword'
  | 'bow'
  | 'scythe'
  | 'spear'
  | 'twin_daggers'
  | 'hammer'
  | 'astrolabe'
  | 'grimoire'
  | 'jetpack'
  | 'halberd'
  | 'scepter'
  | 'shield'
  | 'orb';

export type CloakKind =
  | 'flowing_cape'
  | 'scarf'
  | 'ribbons'
  | 'seraph_wings'
  | 'dragon_wings'
  | 'butterfly_wings'
  | 'mecha_thrusters'
  | 'tattered_cloak'
  | 'fur_mantle'
  | 'star_mantle';

export type HeroSignatureTrait =
  | 'alpine_pin'
  | 'wind_whirl'
  | 'shadow_wisps'
  | 'forge_embers'
  | 'seraph_feathers'
  | 'arc_sparks'
  | 'lunar_crescent'
  | 'bastion_crest'
  | 'fox_tails'
  | 'chrono_gear'
  | 'water_droplets'
  | 'sun_rays'
  | 'frost_braids'
  | 'sakura_petals'
  | 'dragon_tail'
  | 'orbit_planet'
  | 'forest_leaves'
  | 'stone_runes'
  | 'jester_bells'
  | 'music_notes'
  | 'soul_lantern'
  | 'paladin_aura'
  | 'potion_flasks'
  | 'domino_mask'
  | 'scarab_collar'
  | 'ice_shards'
  | 'prayer_beads'
  | 'silk_ribbons'
  | 'plasma_exhaust'
  | 'blood_sigil'
  | 'quiver'
  | 'void_rift'
  | 'sun_ankh'
  | 'plague_censer'
  | 'prism_shards'
  | 'storm_halo'
  | 'star_crown'
  | 'bushido_banner'
  | 'faerie_dust'
  | 'raven_feathers'
  | 'glacier_horns'
  | 'valkyrie_plume'
  | 'radar_dish'
  | 'spirit_bells'
  | 'floral_vines'
  | 'fae_wings'
  | 'anvil_apron'
  | 'aether_halo';

export interface HeroVisualProfile {
  archetype: SilhouetteArchetype;
  hair: HairStyleKind;
  headgear: HeadgearKind;
  weapon: WeaponKind;
  cloak: CloakKind;
  emblem: 'star' | 'crest' | 'gem' | 'moon' | 'flame' | 'bolt' | 'leaf';
  signature: HeroSignatureTrait;
}

export const HERO_VISUAL_PROFILES: Record<HeroId, HeroVisualProfile> = {
  lyra: { archetype: 'ranger', hair: 'flowing', headgear: 'none', weapon: 'blade', cloak: 'scarf', emblem: 'star', signature: 'alpine_pin' },
  zephyr: { archetype: 'assassin', hair: 'spiky', headgear: 'goggles', weapon: 'twin_daggers', cloak: 'scarf', emblem: 'bolt', signature: 'wind_whirl' },
  nyx: { archetype: 'assassin', hair: 'hooded', headgear: 'none', weapon: 'twin_daggers', cloak: 'tattered_cloak', emblem: 'moon', signature: 'shadow_wisps' },
  ignis: { archetype: 'knight', hair: 'spiky', headgear: 'horns', weapon: 'greatsword', cloak: 'tattered_cloak', emblem: 'flame', signature: 'forge_embers' },
  seraphina: { archetype: 'seraph', hair: 'long_noble', headgear: 'halo', weapon: 'spear', cloak: 'seraph_wings', emblem: 'star', signature: 'seraph_feathers' },
  volt: { archetype: 'mecha', hair: 'spiky', headgear: 'visor', weapon: 'blade', cloak: 'scarf', emblem: 'bolt', signature: 'arc_sparks' },
  umbra: { archetype: 'witch', hair: 'long_noble', headgear: 'tiara', weapon: 'orb', cloak: 'star_mantle', emblem: 'moon', signature: 'lunar_crescent' },
  aegis: { archetype: 'knight', hair: 'bob', headgear: 'valkyrie_wings', weapon: 'shield', cloak: 'flowing_cape', emblem: 'crest', signature: 'bastion_crest' },
  kitsune: { archetype: 'kitsune', hair: 'ponytail', headgear: 'kitsune_ears', weapon: 'staff', cloak: 'ribbons', emblem: 'flame', signature: 'fox_tails' },
  chronos_mage: { archetype: 'mage', hair: 'flowing', headgear: 'tiara', weapon: 'astrolabe', cloak: 'star_mantle', emblem: 'gem', signature: 'chrono_gear' },
  tidal: { archetype: 'druid', hair: 'flowing', headgear: 'tiara', weapon: 'spear', cloak: 'ribbons', emblem: 'gem', signature: 'water_droplets' },
  solaris: { archetype: 'royal', hair: 'long_noble', headgear: 'crown', weapon: 'scepter', cloak: 'flowing_cape', emblem: 'star', signature: 'sun_rays' },
  valkyrie: { archetype: 'valkyrie', hair: 'ponytail', headgear: 'valkyrie_wings', weapon: 'spear', cloak: 'seraph_wings', emblem: 'crest', signature: 'frost_braids' },
  ronin: { archetype: 'samurai', hair: 'ponytail', headgear: 'kabuto', weapon: 'katana', cloak: 'scarf', emblem: 'flame', signature: 'sakura_petals' },
  draco: { archetype: 'draconic', hair: 'wild_mane', headgear: 'horns', weapon: 'greatsword', cloak: 'dragon_wings', emblem: 'flame', signature: 'dragon_tail' },
  nebula: { archetype: 'mage', hair: 'twintails', headgear: 'halo', weapon: 'astrolabe', cloak: 'star_mantle', emblem: 'star', signature: 'orbit_planet' },
  druid: { archetype: 'druid', hair: 'braid', headgear: 'antlers', weapon: 'staff', cloak: 'fur_mantle', emblem: 'leaf', signature: 'forest_leaves' },
  golem_knight: { archetype: 'knight', hair: 'bob', headgear: 'visor', weapon: 'hammer', cloak: 'fur_mantle', emblem: 'crest', signature: 'stone_runes' },
  jester: { archetype: 'assassin', hair: 'twintails', headgear: 'jester_cap', weapon: 'twin_daggers', cloak: 'ribbons', emblem: 'gem', signature: 'jester_bells' },
  siren: { archetype: 'seraph', hair: 'long_noble', headgear: 'tiara', weapon: 'scepter', cloak: 'ribbons', emblem: 'moon', signature: 'music_notes' },
  reaper: { archetype: 'reaper', hair: 'hooded', headgear: 'none', weapon: 'scythe', cloak: 'tattered_cloak', emblem: 'moon', signature: 'soul_lantern' },
  paladin: { archetype: 'knight', hair: 'flowing', headgear: 'halo', weapon: 'shield', cloak: 'flowing_cape', emblem: 'crest', signature: 'paladin_aura' },
  alchemist_hero: { archetype: 'alchemist', hair: 'bob', headgear: 'goggles', weapon: 'orb', cloak: 'scarf', emblem: 'gem', signature: 'potion_flasks' },
  phantom_thief: { archetype: 'assassin', hair: 'spiky', headgear: 'visor', weapon: 'blade', cloak: 'flowing_cape', emblem: 'moon', signature: 'domino_mask' },
  sphinx_guard: { archetype: 'royal', hair: 'braid', headgear: 'crown', weapon: 'halberd', cloak: 'ribbons', emblem: 'star', signature: 'scarab_collar' },
  cryo_queen: { archetype: 'royal', hair: 'long_noble', headgear: 'crown', weapon: 'scepter', cloak: 'star_mantle', emblem: 'gem', signature: 'ice_shards' },
  thunder_monk: { archetype: 'monk', hair: 'spiky', headgear: 'none', weapon: 'orb', cloak: 'ribbons', emblem: 'bolt', signature: 'prayer_beads' },
  star_dancer: { archetype: 'seraph', hair: 'twintails', headgear: 'tiara', weapon: 'scepter', cloak: 'ribbons', emblem: 'star', signature: 'silk_ribbons' },
  mech_pilot: { archetype: 'mecha', hair: 'ponytail', headgear: 'visor', weapon: 'jetpack', cloak: 'mecha_thrusters', emblem: 'bolt', signature: 'plasma_exhaust' },
  blood_hunter: { archetype: 'reaper', hair: 'wild_mane', headgear: 'none', weapon: 'scythe', cloak: 'tattered_cloak', emblem: 'flame', signature: 'blood_sigil' },
  wind_archer: { archetype: 'ranger', hair: 'ponytail', headgear: 'none', weapon: 'bow', cloak: 'scarf', emblem: 'leaf', signature: 'quiver' },
  void_walker: { archetype: 'reaper', hair: 'wild_mane', headgear: 'horns', weapon: 'blade', cloak: 'star_mantle', emblem: 'moon', signature: 'void_rift' },
  sun_priest: { archetype: 'mage', hair: 'long_noble', headgear: 'halo', weapon: 'staff', cloak: 'flowing_cape', emblem: 'star', signature: 'sun_ankh' },
  plague_doc: { archetype: 'alchemist', hair: 'hooded', headgear: 'plague_mask', weapon: 'staff', cloak: 'tattered_cloak', emblem: 'gem', signature: 'plague_censer' },
  crystal_mage: { archetype: 'mage', hair: 'long_noble', headgear: 'tiara', weapon: 'staff', cloak: 'star_mantle', emblem: 'gem', signature: 'prism_shards' },
  storm_king: { archetype: 'royal', hair: 'wild_mane', headgear: 'crown', weapon: 'halberd', cloak: 'seraph_wings', emblem: 'bolt', signature: 'storm_halo' },
  celestia: { archetype: 'mage', hair: 'long_noble', headgear: 'tiara', weapon: 'astrolabe', cloak: 'star_mantle', emblem: 'star', signature: 'star_crown' },
  kurogane: { archetype: 'samurai', hair: 'ponytail', headgear: 'kabuto', weapon: 'katana', cloak: 'scarf', emblem: 'flame', signature: 'bushido_banner' },
  sylph: { archetype: 'seraph', hair: 'flowing', headgear: 'flower_crown', weapon: 'bow', cloak: 'butterfly_wings', emblem: 'leaf', signature: 'faerie_dust' },
  morrigan: { archetype: 'witch', hair: 'flowing', headgear: 'witch_hat', weapon: 'grimoire', cloak: 'tattered_cloak', emblem: 'moon', signature: 'raven_feathers' },
  boreas: { archetype: 'knight', hair: 'wild_mane', headgear: 'horns', weapon: 'halberd', cloak: 'fur_mantle', emblem: 'gem', signature: 'glacier_horns' },
  aurelia: { archetype: 'valkyrie', hair: 'flowing', headgear: 'valkyrie_wings', weapon: 'spear', cloak: 'seraph_wings', emblem: 'star', signature: 'valkyrie_plume' },
  kestrel: { archetype: 'mecha', hair: 'spiky', headgear: 'goggles', weapon: 'jetpack', cloak: 'mecha_thrusters', emblem: 'bolt', signature: 'radar_dish' },
  vesperis: { archetype: 'kitsune', hair: 'ponytail', headgear: 'kitsune_ears', weapon: 'scythe', cloak: 'ribbons', emblem: 'moon', signature: 'spirit_bells' },
  flora: { archetype: 'druid', hair: 'braid', headgear: 'flower_crown', weapon: 'staff', cloak: 'ribbons', emblem: 'leaf', signature: 'floral_vines' },
  oberon: { archetype: 'royal', hair: 'flowing', headgear: 'antlers', weapon: 'scepter', cloak: 'butterfly_wings', emblem: 'leaf', signature: 'fae_wings' },
  emberlyn: { archetype: 'alchemist', hair: 'ponytail', headgear: 'goggles', weapon: 'hammer', cloak: 'fur_mantle', emblem: 'flame', signature: 'anvil_apron' },
  aetherion: { archetype: 'seraph', hair: 'wild_mane', headgear: 'crown', weapon: 'greatsword', cloak: 'seraph_wings', emblem: 'star', signature: 'aether_halo' },
};

// 40x40 Studio Celeste Grid -> Drawn at 20 world px (= 40 native canvas pixels 1:1!)
export const HERO_PIXEL_W = 40;
export const HERO_PIXEL_H = 40;
const BAKE_W = HERO_PIXEL_W;
const BAKE_H = HERO_PIXEL_H;
const STUDIO_BAKE_CACHE = new Map<string, HTMLCanvasElement>();

function resolveHeadgear(heroId: HeroId, skinHeadgear?: string): HeadgearKind {
  const base = HERO_VISUAL_PROFILES[heroId]?.headgear ?? 'none';
  if (skinHeadgear && skinHeadgear !== 'none') {
    if (skinHeadgear === 'crown') return 'crown';
    if (skinHeadgear === 'horns') return 'horns';
    if (skinHeadgear === 'halo') return 'halo';
    if (skinHeadgear === 'ears') return 'kitsune_ears';
    if (skinHeadgear === 'visor') return 'visor';
    if (skinHeadgear === 'crest') return 'valkyrie_wings';
  }
  return base;
}

function parseHexRgb(hex: string): [number, number, number] {
  if (!hex || !hex.startsWith('#')) return [128, 128, 160];
  if (hex.length === 4) {
    return [
      parseInt(hex[1] + hex[1], 16) || 0,
      parseInt(hex[2] + hex[2], 16) || 0,
      parseInt(hex[3] + hex[3], 16) || 0,
    ];
  }
  return [
    parseInt(hex.slice(1, 3), 16) || 0,
    parseInt(hex.slice(3, 5), 16) || 0,
    parseInt(hex.slice(5, 7), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const h = (v: number) => cl(v).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Hue-shifted pixel-art shading (MiniBoss / Celeste principle):
 * - Darkening shifts hue toward violet/indigo (#180d32) while preserving richness.
 * - Brightening shifts hue slightly warmer/brighter without chalky whitewash.
 */
function hueShiftHex(hex: string, lumShift: number, coolMix = 0): string {
  const [r, g, b] = parseHexRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  let l = (max + min) * 0.5;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }

  // Shift shadows toward cool violet/blue (hue ~0.72), highlights toward warm gold/cream (~0.14)
  if (lumShift < 0) {
    const targetHue = 0.72;
    const diff = ((targetHue - h + 1.5) % 1) - 0.5;
    h = (h + diff * Math.min(0.45, Math.abs(lumShift) * 0.9 + coolMix) + 1) % 1;
    s = Math.min(1, s * 1.12 + 0.05);
  } else if (lumShift > 0) {
    const targetHue = h > 0.45 && h < 0.78 ? 0.52 : 0.13;
    const diff = ((targetHue - h + 1.5) % 1) - 0.5;
    h = (h + diff * Math.min(0.35, lumShift * 0.7) + 1) % 1;
    s = Math.max(0.08, s * 0.94);
  }
  l = Math.max(0.05, Math.min(0.95, l + lumShift));

  if (s === 0) {
    const v = l * 255;
    return rgbToHex(v, v, v);
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return rgbToHex(
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255
  );
}

// ============================================================================
// INTEGER PIXEL BUFFER WITH CHROMATIC OUTLINE & BRUSH PRIMITIVES
// ============================================================================
class PixelBuf {
  public readonly w: number;
  public readonly h: number;
  public readonly pixels: (string | null)[];
  public readonly outlineMask: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.pixels = new Array(w * h).fill(null);
    this.outlineMask = new Uint8Array(w * h);
  }

  public set(x: number, y: number, color: string | null, outline = true): void {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.w || iy < 0 || iy >= this.h) return;
    const idx = iy * this.w + ix;
    this.pixels[idx] = color;
    this.outlineMask[idx] = color && outline ? 1 : 0;
  }

  public rect(x: number, y: number, w: number, h: number, color: string, outline = true): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = x0 + Math.round(w);
    const y1 = y0 + Math.round(h);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.set(px, py, color, outline);
      }
    }
  }

  public ditherRect(
    x: number,
    y: number,
    w: number,
    h: number,
    colA: string,
    colB: string,
    outline = true
  ): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = x0 + Math.round(w);
    const y1 = y0 + Math.round(h);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.set(px, py, (px + py) % 2 === 0 ? colA : colB, outline);
      }
    }
  }

  public line(x0: number, y0: number, x1: number, y1: number, color: string, outline = true): void {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;
    for (let guard = 0; guard < 120; guard++) {
      this.set(ix0, iy0, color, outline);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        ix0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  public thickLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    hiColor?: string,
    outline = true
  ): void {
    this.line(x0, y0, x1, y1, color, outline);
    this.line(x0, y0 + 1, x1, y1 + 1, color, outline);
    if (hiColor) {
      this.line(x0, y0, x1, y1, hiColor, outline);
    }
  }

  public disc(cx: number, cy: number, r: number, color: string, outline = true): void {
    const r2 = r * r + 0.25;
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy <= r2) {
          this.set(cx + dx, cy + dy, color, outline);
        }
      }
    }
  }
}

function flushCompositeWithOutline(
  ctx: CanvasRenderingContext2D,
  backBuf: PixelBuf,
  mainBuf: PixelBuf,
  fxBuf: PixelBuf,
  outlineColor: string
): void {
  const w = mainBuf.w;
  const h = mainBuf.h;
  // Combine back + main silhouette into a unified 1px chromatic outer border (no muddy double borders!)
  const merged = new Array<string | null>(w * h).fill(null);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (backBuf.pixels[i]) {
      merged[i] = backBuf.pixels[i];
      if (backBuf.outlineMask[i]) mask[i] = 1;
    }
    if (mainBuf.pixels[i]) {
      merged[i] = mainBuf.pixels[i];
      if (mainBuf.outlineMask[i]) mask[i] = 1;
    }
  }

  ctx.fillStyle = outlineColor;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (merged[idx] !== null) continue;
      const adj =
        (x > 0 && mask[idx - 1] === 1) ||
        (x < w - 1 && mask[idx + 1] === 1) ||
        (y > 0 && mask[idx - w] === 1) ||
        (y < h - 1 && mask[idx + w] === 1);
      if (adj) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = merged[y * w + x];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Luminous FX layer (sparkles, slashes, droplets, bubbles) drawn crisply on top
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = fxBuf.pixels[y * w + x];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

interface PoseKinematics {
  bodyX: number;
  bodyY: number;
  headX: number;
  headY: number;
  leanX: number;
  leftFootX: number;
  leftFootY: number;
  rightFootX: number;
  rightFootY: number;
  backArmAngle: number;
  frontArmAngle: number;
  capeSweepX: number;
  capeLiftY: number;
  wingFlapY: number;
  blink: boolean;
  happyEyes: boolean;
  determinedEyes: boolean;
  eyeOffsetX: number;
  eyeOffsetY: number;
  weaponSwingAngle: number;
  slashPhase: number;
  dashStreak: boolean;
  swimBubbles: boolean;
  floatPhase: number;
  mouthMood: 'neutral' | 'smile' | 'fierce';
  crouchSquash: boolean;
}

function computePose(anim: HeroAnimKey, rawFrame: number): PoseKinematics {
  const count = HERO_ANIM_FRAME_COUNTS[anim] ?? 4;
  const f = ((Math.floor(rawFrame) % count) + count) % count;

  // Compact Celeste anchor inside 40x40:
  // feet at y=38, waist at y=33, shoulder at y=25, head center at y=19 -> total core y=15..38 (23px = 11.5 world px!)
  const base: PoseKinematics = {
    bodyX: 20,
    bodyY: 26,
    headX: 20,
    headY: 19,
    leanX: 0,
    leftFootX: -2,
    leftFootY: 0,
    rightFootX: 2,
    rightFootY: 0,
    backArmAngle: 0.25,
    frontArmAngle: -0.22,
    capeSweepX: -3,
    capeLiftY: 0,
    wingFlapY: 0,
    blink: false,
    happyEyes: false,
    determinedEyes: false,
    eyeOffsetX: 1,
    eyeOffsetY: 0,
    weaponSwingAngle: -0.5,
    slashPhase: -1,
    dashStreak: false,
    swimBubbles: false,
    floatPhase: f,
    mouthMood: 'neutral',
    crouchSquash: false,
  };

  if (anim === 'idle') {
    const breath = f === 1 || f === 2 || f === 3 ? 1 : 0;
    base.bodyY = 26 + breath;
    base.headY = 19 + breath;
    base.capeSweepX = f === 0 || f === 5 ? -4 : f === 2 || f === 3 ? -2 : -3;
    base.capeLiftY = f === 2 || f === 3 ? -1 : 0;
    base.wingFlapY = f === 1 || f === 2 ? 1 : f === 4 ? -1 : 0;
    base.blink = f === 4;
    return base;
  }

  if (anim === 'run') {
    const bob = f === 1 || f === 4 ? -1 : f === 2 || f === 5 ? 0 : 1;
    const strides: [number, number, number, number][] = [
      [-4, -1, 4, -2],
      [-2, 0, 3, -3],
      [3, -2, -3, -1],
      [4, -1, -4, -2],
      [2, -3, -2, 0],
      [-3, -1, 3, -1],
    ];
    const [lfx, lfy, rfx, rfy] = strides[f];
    base.bodyX = 20;
    base.bodyY = 26 + bob;
    base.headX = 21;
    base.headY = 19 + bob;
    base.leanX = 1;
    base.leftFootX = lfx;
    base.leftFootY = lfy;
    base.rightFootX = rfx;
    base.rightFootY = rfy;
    base.backArmAngle = f < 3 ? 0.85 : -0.75;
    base.frontArmAngle = f < 3 ? -0.85 : 0.78;
    base.capeSweepX = -7 - (f % 2) * 2;
    base.capeLiftY = -2 + (f % 2);
    base.wingFlapY = f % 2 === 0 ? -1 : 1;
    base.determinedEyes = true;
    base.weaponSwingAngle = -0.85;
    return base;
  }

  if (anim === 'jump') {
    const tuck = f >= 1 ? -1 : 0;
    base.bodyY = 24 + tuck;
    base.headY = 17 + tuck;
    base.leanX = 1;
    base.leftFootX = -2;
    base.leftFootY = -2;
    base.rightFootX = 3;
    base.rightFootY = f >= 1 ? -4 : -2;
    base.backArmAngle = -0.95;
    base.frontArmAngle = -1.1;
    base.capeSweepX = -6;
    base.capeLiftY = 3;
    base.wingFlapY = f % 2 === 0 ? -3 : -1;
    base.eyeOffsetY = -1;
    base.weaponSwingAngle = -0.7;
    return base;
  }

  if (anim === 'fall') {
    const flutter = f % 2;
    base.bodyY = 25;
    base.headY = 18;
    base.leanX = -1;
    base.leftFootX = -3;
    base.leftFootY = -1 + flutter;
    base.rightFootX = 3;
    base.rightFootY = -2 + (1 - flutter);
    base.backArmAngle = -0.85 - flutter * 0.14;
    base.frontArmAngle = -0.85 + flutter * 0.14;
    base.capeSweepX = -5 - flutter;
    base.capeLiftY = -5 - flutter;
    base.wingFlapY = -3 - flutter;
    base.eyeOffsetY = 1;
    base.weaponSwingAngle = -0.3;
    return base;
  }

  if (anim === 'dash') {
    base.bodyX = 22;
    base.bodyY = 27;
    base.headX = 24;
    base.headY = 20 + (f % 2);
    base.leanX = 2;
    base.leftFootX = -6;
    base.leftFootY = -2;
    base.rightFootX = -1;
    base.rightFootY = -3;
    base.backArmAngle = 1.15;
    base.frontArmAngle = 0.95;
    base.capeSweepX = -10 - (f % 2) * 2;
    base.capeLiftY = -3;
    base.wingFlapY = -1;
    base.determinedEyes = true;
    base.weaponSwingAngle = -1.15;
    base.dashStreak = true;
    return base;
  }

  if (anim === 'climb') {
    const reach = f < 2 ? -1 : 1;
    base.bodyX = 20;
    base.bodyY = 26 + (f % 2 === 0 ? -1 : 0);
    base.headX = 20;
    base.headY = 19 + (f % 2 === 0 ? -1 : 0);
    base.leftFootX = -2;
    base.leftFootY = reach > 0 ? -3 : 0;
    base.rightFootX = 3;
    base.rightFootY = reach > 0 ? 0 : -3;
    base.backArmAngle = reach > 0 ? -1.45 : -0.35;
    base.frontArmAngle = reach > 0 ? -0.35 : -1.45;
    base.capeSweepX = -4;
    base.capeLiftY = 1;
    base.eyeOffsetY = -1;
    return base;
  }

  if (anim === 'wall_slide') {
    const jitter = f % 2;
    base.bodyX = 20;
    base.bodyY = 26 + jitter;
    base.headX = 20;
    base.headY = 19 + jitter;
    base.leanX = -1;
    base.leftFootX = -2;
    base.leftFootY = -1;
    base.rightFootX = 3;
    base.rightFootY = -3;
    base.frontArmAngle = -1.35;
    base.backArmAngle = 0.45;
    base.capeSweepX = -5;
    base.capeLiftY = -2;
    base.determinedEyes = true;
    base.eyeOffsetY = 1;
    return base;
  }

  if (anim === 'crouch') {
    // Compresses height tightly so crouched hero matches the h=7 world hitbox!
    const settle = f === 0 ? 5 : 6;
    base.bodyY = 27 + settle;
    base.headX = 21;
    base.headY = 22 + settle;
    base.leanX = 2;
    base.leftFootX = -3;
    base.leftFootY = 0;
    base.rightFootX = 3;
    base.rightFootY = 0;
    base.capeSweepX = -5;
    base.capeLiftY = 2;
    base.determinedEyes = true;
    base.crouchSquash = true;
    return base;
  }

  if (anim === 'swim') {
    const kick = f % 2 === 0 ? -2 : 2;
    base.bodyX = 20;
    base.bodyY = 27 + (f === 1 || f === 2 ? -1 : 0);
    base.headX = 22;
    base.headY = 20 + (f === 1 || f === 2 ? -1 : 0);
    base.leanX = 2;
    base.leftFootX = -5;
    base.leftFootY = -2 + kick;
    base.rightFootX = -2;
    base.rightFootY = -2 - kick;
    base.backArmAngle = f < 2 ? -0.65 : 0.75;
    base.frontArmAngle = f < 2 ? 0.75 : -0.65;
    base.capeSweepX = -7;
    base.capeLiftY = -2;
    base.swimBubbles = true;
    return base;
  }

  if (anim === 'glide') {
    const soar = f === 1 ? -1 : 0;
    base.bodyY = 25 + soar;
    base.headY = 18 + soar;
    base.leanX = 1;
    base.leftFootX = -3;
    base.leftFootY = -1;
    base.rightFootX = 3;
    base.rightFootY = -2;
    base.backArmAngle = -1.15;
    base.frontArmAngle = -1.15;
    base.capeSweepX = -9;
    base.capeLiftY = -4 + soar;
    base.wingFlapY = -2 + soar;
    return base;
  }

  if (anim === 'skill') {
    const lunge = f === 0 ? -1 : f === 1 ? 3 : f === 2 ? 2 : 1;
    base.bodyX = 20 + lunge;
    base.bodyY = 26 + (f === 1 ? 1 : 0);
    base.headX = 21 + lunge;
    base.headY = 19 + (f === 1 ? 1 : 0);
    base.leanX = f === 0 ? -1 : 2;
    base.leftFootX = -4;
    base.leftFootY = 0;
    base.rightFootX = f >= 1 ? 5 : 2;
    base.rightFootY = f === 1 ? -1 : 0;
    base.frontArmAngle = f === 0 ? -1.4 : f === 1 ? 0.35 : f === 2 ? 0.85 : 0.15;
    base.backArmAngle = 0.75;
    base.capeSweepX = -7 - lunge;
    base.capeLiftY = -2;
    base.determinedEyes = true;
    base.weaponSwingAngle = f === 0 ? -1.4 : f === 1 ? 0.45 : f === 2 ? 0.95 : 0.12;
    base.slashPhase = f;
    base.mouthMood = 'fierce';
    return base;
  }

  // 'victory'
  const joy = f === 1 || f === 2 ? -2 : 0;
  base.bodyY = 25 + joy;
  base.headY = 18 + joy;
  base.leftFootX = -3;
  base.leftFootY = 0;
  base.rightFootX = 3;
  base.rightFootY = 0;
  base.frontArmAngle = -1.5;
  base.backArmAngle = 0.35;
  base.capeSweepX = f % 2 === 0 ? -5 : -7;
  base.capeLiftY = -2 + joy;
  base.wingFlapY = -2 + joy;
  base.happyEyes = f === 1 || f === 2;
  base.eyeOffsetY = -1;
  base.weaponSwingAngle = -0.25;
  base.mouthMood = 'smile';
  return base;
}

function renderHeroPixelArtToCanvas(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  skinId: string,
  anim: HeroAnimKey,
  frameIdx: number,
  dashes: number,
  featherActive: boolean,
  lowStaminaFlash: boolean
): void {
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);
  const prof = HERO_VISUAL_PROFILES[heroId] ?? HERO_VISUAL_PROFILES.lyra;
  const pal = buildHeroPalette(heroId, dashes, featherActive, lowStaminaFlash, skinId);
  const headgear = resolveHeadgear(heroId, skin.palette.headgear);

  const hairMain = pal.h || '#c84b6b';
  const outline = hueShiftHex(pal.D || pal.o || '#140c24', -0.22, 0.28);
  const chromaticInk = outline === '#000000' ? '#0e081a' : outline;
  const skinCol = pal.s || '#f5d7c4';
  const skinSh = pal.S || hueShiftHex(skinCol, -0.14, 0.15);
  const skinHi = hueShiftHex(skinCol, 0.08);
  const hairDark = pal.d || hueShiftHex(hairMain, -0.16, 0.2);
  const hairHi = pal.H || hueShiftHex(hairMain, 0.15);
  const cloakMid = pal.C || '#2d4b8a';
  const cloakDark = pal.D || hueShiftHex(cloakMid, -0.16, 0.2);
  const cloakDeep = hueShiftHex(cloakDark, -0.12, 0.2);
  const cloakHi = pal.c || hueShiftHex(cloakMid, 0.14);
  const metal = pal.g || '#d99e30';
  const metalDark = hueShiftHex(metal, -0.16, 0.15);
  const metalHi = pal.G || hueShiftHex(metal, 0.18);
  const acc = pal.a || hero.accentColor;
  const accHi = pal.A || hueShiftHex(acc, 0.18);
  const accDark = hueShiftHex(acc, -0.16, 0.2);
  const eyeCol = pal.e || hero.accentColor;
  const bootDark = pal.b || '#221a30';
  const bootLight = pal.L || hueShiftHex(bootDark, 0.14);

  const pose = computePose(anim, frameIdx);
  const backBuf = new PixelBuf(BAKE_W, BAKE_H);
  const mainBuf = new PixelBuf(BAKE_W, BAKE_H);
  const fxBuf = new PixelBuf(BAKE_W, BAKE_H);

  const footBaseY = 38;
  const shoulderY = pose.bodyY - 1;
  const waistY = pose.crouchSquash ? pose.bodyY + 4 : pose.bodyY + 7;
  const bx = pose.bodyX;
  const hx = pose.headX;
  const hy = pose.headY;

  // ==========================================================================
  // 1. BACK LAYER: WINGS, CAPES, THRUSTERS, TAILS, BACK HAIR, SHEATHED WEAPON
  // ==========================================================================
  const wy = shoulderY + pose.wingFlapY;
  if (prof.cloak === 'seraph_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 4;
      backBuf.thickLine(wx, wy, wx + side * 9, wy - 6, accHi, '#ffffff');
      backBuf.thickLine(wx, wy + 2, wx + side * 10, wy - 2, '#ffffff', '#ffffff');
      backBuf.line(wx, wy + 4, wx + side * 8, wy + 2, acc);
      backBuf.set(wx + side * 9, wy - 6, '#ffffff');
      backBuf.set(wx + side * 10, wy - 2, accHi);
    }
  } else if (prof.cloak === 'dragon_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 4;
      backBuf.line(wx, wy + 1, wx + side * 9, wy - 6, metalHi);
      backBuf.line(wx + side * 9, wy - 6, wx + side * 10, wy + 1, metal);
      backBuf.line(wx + side * 2, wy + 3, wx + side * 8, wy - 2, cloakDark);
      backBuf.line(wx + side * 3, wy + 4, wx + side * 8, wy + 1, acc);
      backBuf.set(wx + side * 9, wy - 6, accHi);
    }
  } else if (prof.cloak === 'butterfly_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 4;
      const sx0 = side < 0 ? wx - 9 : wx;
      backBuf.rect(sx0, wy - 5, 9, 5, acc);
      backBuf.ditherRect(sx0 + 1, wy - 4, 7, 3, acc, accHi);
      backBuf.rect(side < 0 ? wx - 7 : wx + 1, wy, 6, 4, acc);
      backBuf.set(wx + side * 6, wy - 3, '#ffffff');
      backBuf.set(wx + side * 4, wy + 2, metalHi);
    }
  } else if (prof.cloak === 'mecha_thrusters') {
    backBuf.rect(bx - 7, shoulderY - 1, 5, 7, metalDark);
    backBuf.rect(bx - 6, shoulderY, 3, 5, metal);
    backBuf.rect(bx - 6, shoulderY, 2, 2, metalHi);
    backBuf.rect(bx - 6, shoulderY + 6, 3, 2, acc);
    if (anim === 'dash' || anim === 'jump' || anim === 'glide' || anim === 'skill') {
      fxBuf.line(bx - 5, shoulderY + 8, bx - 9 + pose.capeSweepX * 0.25, shoulderY + 11, accHi, false);
      fxBuf.set(bx - 6, shoulderY + 9, '#ffffff', false);
    }
  }

  // Hero Signature Back Layer (fox tails, dragon tail, bushido banner, fae wings, radar)
  if (prof.signature === 'fox_tails') {
    const wave = Math.sin(pose.floatPhase * 1.3) * 1.5;
    for (const angOff of [-4, -1, 2, 4]) {
      const tx = bx - 6 + pose.capeSweepX * 0.35;
      const ty = waistY - 1 + angOff + Math.round(wave);
      backBuf.thickLine(bx - 1, waistY, tx, ty, hairMain, hairHi);
      backBuf.set(tx - 1, ty, '#ffffff');
    }
  } else if (prof.signature === 'dragon_tail') {
    const tTipX = bx - 10 + pose.capeSweepX * 0.3;
    const tTipY = waistY + 3 + (pose.floatPhase % 2 === 0 ? -1 : 1);
    backBuf.thickLine(bx - 1, waistY + 2, tTipX, tTipY, cloakDark, acc);
    backBuf.rect(tTipX - 1, tTipY - 1, 2, 2, metalHi);
  } else if (prof.signature === 'bushido_banner') {
    const sway = Math.round(pose.capeSweepX * 0.2);
    backBuf.line(bx - 4, waistY + 2, bx - 5 + sway, hy - 10, metalDark);
    backBuf.rect(bx - 9 + sway, hy - 10, 4, 9, acc);
    backBuf.rect(bx - 8 + sway, hy - 9, 2, 2, metalHi);
    backBuf.set(bx - 8 + sway, hy - 5, '#ffffff');
  } else if (prof.signature === 'fae_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 4;
      backBuf.thickLine(wx, wy, wx + side * 8, wy - 4, accHi, '#ffffff');
      backBuf.line(wx, wy + 2, wx + side * 6, wy + 3, acc);
    }
  } else if (prof.signature === 'radar_dish') {
    backBuf.rect(bx - 7, shoulderY - 4, 4, 4, metal);
    backBuf.set(bx - 6, shoulderY - 3, accHi);
    backBuf.set(bx - 7, shoulderY - 5, '#ffffff');
  }

  // Flowing cloak / Celeste billowing scarf / ribbons / fur mantle
  const cEndX = bx + pose.capeSweepX - 4;
  const cEndY = waistY + 5 + pose.capeLiftY;
  if (prof.cloak === 'scarf') {
    const midX = Math.round((bx - 2 + cEndX) * 0.5);
    const midY = shoulderY + 2 + Math.round(pose.capeLiftY * 0.5) + (pose.floatPhase % 2);
    backBuf.thickLine(bx - 2, shoulderY + 1, midX, midY, accDark, acc);
    backBuf.thickLine(midX, midY, cEndX, shoulderY + 3 + pose.capeLiftY, acc, accHi);
    backBuf.rect(cEndX - 1, shoulderY + 3 + pose.capeLiftY, 2, 2, accHi);
  } else if (prof.cloak === 'ribbons') {
    backBuf.thickLine(bx - 2, shoulderY + 2, cEndX, cEndY - 3, acc, accHi);
    backBuf.line(bx - 2, shoulderY + 4, cEndX + 2, cEndY, accHi);
  } else if (prof.cloak !== 'mecha_thrusters') {
    const capeTopX = bx - 3;
    const capeTopY = shoulderY;
    for (let t = 0; t <= 10; t++) {
      const ratio = t / 10;
      const wave = Math.round(Math.sin(ratio * Math.PI + pose.floatPhase) * 1.1);
      const rx = Math.round(capeTopX + (cEndX - capeTopX) * ratio) + wave;
      const ry = Math.round(capeTopY + (cEndY - capeTopY) * ratio);
      const wSpan = Math.round(4 + ratio * 4);
      for (let dx = 0; dx < wSpan; dx++) {
        const px = rx + dx;
        const isStar = prof.cloak === 'star_mantle' && (px * 3 + ry * 5) % 8 === 0;
        const col = isStar
          ? '#ffffff'
          : dx === 0
            ? cloakHi
            : dx === wSpan - 1
              ? cloakDeep
              : t >= 9 && prof.cloak !== 'tattered_cloak'
                ? metal
                : (px + ry) % 2 === 0
                  ? cloakMid
                  : cloakDark;
        if (prof.cloak === 'tattered_cloak' && t >= 8 && (dx + t) % 3 === 0) continue;
        backBuf.set(px, ry, col);
      }
    }
    if (prof.cloak === 'fur_mantle') {
      backBuf.rect(bx - 6, shoulderY - 1, 12, 3, accHi);
      backBuf.ditherRect(bx - 5, shoulderY, 10, 2, accHi, metal);
    }
  }

  // Layered Back Hair (natural sway reacting to velocity/pose)
  if (prof.hair === 'flowing' || prof.hair === 'long_noble') {
    const len = prof.hair === 'long_noble' ? 12 : 9;
    for (let dy = 0; dy < len; dy++) {
      const sway = Math.round((pose.capeSweepX * 0.45 * dy) / len);
      const wSpan = prof.hair === 'long_noble' ? 8 - Math.floor(dy * 0.25) : 7 - Math.floor(dy * 0.2);
      for (let dx = 0; dx < wSpan; dx++) {
        const c =
          dx === 0
            ? hairHi
            : dy > len - 3 || dx === wSpan - 1
              ? hairDark
              : hairMain;
        backBuf.set(hx - 4 + dx + sway, hy + dy, c);
      }
    }
  } else if (prof.hair === 'twintails') {
    for (const side of [-1, 1] as const) {
      const tx = hx + side * 6;
      for (let dy = 0; dy < 10; dy++) {
        const sway = Math.round(pose.capeSweepX * 0.3 * (dy / 10));
        const col = dy < 3 ? hairHi : dy > 7 ? hairDark : hairMain;
        backBuf.rect(tx + sway, hy - 1 + dy, 2, 1, col);
      }
    }
  } else if (prof.hair === 'ponytail') {
    for (let i = 0; i < 10; i++) {
      const px = hx - 4 - Math.round(i * 0.55) + Math.round(pose.capeSweepX * 0.28);
      const py = hy - 2 + Math.round(i * 0.8) + Math.round(pose.capeLiftY * 0.25);
      backBuf.rect(px, py, 2, 2, i < 3 ? hairHi : i > 7 ? hairDark : hairMain);
    }
  } else if (prof.hair === 'braid') {
    for (let i = 0; i < 10; i++) {
      const sway = Math.round(pose.capeSweepX * 0.25 * (i / 10));
      const zig = i % 3 === 0 ? 1 : 0;
      backBuf.rect(hx - 4 + sway + zig, hy + 1 + i, 2, 1, i % 2 === 0 ? hairMain : hairHi);
    }
  }

  // Sheathed / Back Weapon (when idle/run/jump)
  const weaponInHandFront = anim === 'skill' || anim === 'victory';
  if (!weaponInHandFront && prof.weapon !== 'jetpack' && prof.weapon !== 'shield' && prof.weapon !== 'orb') {
    const wAnchorX = bx - 4;
    const wAnchorY = shoulderY + 1;
    if (prof.weapon === 'greatsword' || prof.weapon === 'blade' || prof.weapon === 'katana') {
      const len = prof.weapon === 'greatsword' ? 14 : 11;
      const tipX = wAnchorX - Math.round(len * 0.55);
      const tipY = wAnchorY - Math.round(len * 0.72);
      backBuf.thickLine(wAnchorX + 2, wAnchorY + 2, tipX, tipY, '#cbd5e1', '#f8fafc');
      if (prof.weapon === 'greatsword') {
        backBuf.line(wAnchorX + 3, wAnchorY + 2, tipX + 1, tipY + 1, acc);
      }
      backBuf.set(tipX, tipY, '#ffffff');
      backBuf.rect(wAnchorX, wAnchorY + 1, 3, 2, metal);
    } else if (
      prof.weapon === 'staff' ||
      prof.weapon === 'scepter' ||
      prof.weapon === 'spear' ||
      prof.weapon === 'halberd' ||
      prof.weapon === 'scythe'
    ) {
      backBuf.thickLine(wAnchorX + 4, waistY + 3, wAnchorX - 6, hy - 8, metalDark, metal);
      if (prof.weapon === 'scythe') {
        backBuf.thickLine(wAnchorX - 6, hy - 8, wAnchorX + 3, hy - 10, acc, accHi);
        backBuf.line(wAnchorX + 3, hy - 10, wAnchorX + 5, hy - 6, acc);
      } else if (prof.weapon === 'spear' || prof.weapon === 'halberd') {
        backBuf.rect(wAnchorX - 7, hy - 11, 3, 4, metalHi);
        backBuf.set(wAnchorX - 6, hy - 12, '#ffffff');
        if (prof.weapon === 'halberd') {
          backBuf.rect(wAnchorX - 4, hy - 9, 3, 3, metal);
        }
      } else {
        backBuf.disc(wAnchorX - 6, hy - 9, 2, acc);
        backBuf.set(wAnchorX - 6, hy - 10, '#ffffff');
      }
    } else if (prof.weapon === 'bow') {
      backBuf.thickLine(wAnchorX - 3, hy - 4, wAnchorX - 6, shoulderY + 1, metal, metalHi);
      backBuf.thickLine(wAnchorX - 6, shoulderY + 1, wAnchorX - 3, waistY + 2, metal, metalHi);
      backBuf.line(wAnchorX - 3, hy - 3, wAnchorX - 3, waistY + 1, '#e2e8f0');
    } else if (prof.weapon === 'hammer') {
      backBuf.thickLine(wAnchorX + 3, waistY + 2, wAnchorX - 5, hy - 5, metalDark, metal);
      backBuf.rect(wAnchorX - 9, hy - 8, 7, 4, cloakMid);
      backBuf.rect(wAnchorX - 8, hy - 7, 5, 1, accHi);
      backBuf.rect(wAnchorX - 9, hy - 8, 2, 4, metalHi);
    }
  }

  if (prof.signature === 'quiver') {
    backBuf.rect(bx - 6, shoulderY - 2, 3, 6, metalDark);
    backBuf.set(bx - 6, shoulderY - 3, accHi);
    backBuf.set(bx - 4, shoulderY - 3, '#ffffff');
  }

  // ==========================================================================
  // 2. FOREGROUND BODY: TIGHT LEGS, BOOTS, SCULPTED ARCHETYPE TORSO, ARMS
  // ==========================================================================
  const bFootX = bx + pose.leftFootX;
  const bFootY = footBaseY + pose.leftFootY;
  const isHakama = prof.archetype === 'samurai' || prof.archetype === 'kitsune' || prof.archetype === 'monk';
  const legW = isHakama ? 3 : 2;

  // Back Leg & Boot
  mainBuf.thickLine(bx - 2, waistY, bFootX, bFootY - 3, cloakDeep, cloakDark);
  if (legW > 2) {
    mainBuf.line(bx - 3, waistY + 1, bFootX - 1, bFootY - 3, cloakDark);
  }
  mainBuf.rect(bFootX - 1, bFootY - 3, 4, 3, bootDark);
  mainBuf.rect(bFootX - 1, bFootY - 3, 3, 1, metal);

  // Front Leg & Boot
  const fFootX = bx + pose.rightFootX;
  const fFootY = footBaseY + pose.rightFootY;
  mainBuf.thickLine(bx + 1, waistY, fFootX, fFootY - 3, cloakMid, cloakHi);
  if (legW > 2) {
    mainBuf.line(bx + 2, waistY + 1, fFootX + 1, fFootY - 3, cloakMid);
  }
  mainBuf.rect(fFootX - 1, fFootY - 3, 4, 3, bootLight);
  mainBuf.rect(fFootX, fFootY - 1, 3, 1, bootDark);
  mainBuf.rect(fFootX - 1, fFootY - 3, 3, 1, metalHi);

  // Back Arm
  const bArmEndX = bx - 4 + Math.round(Math.sin(pose.backArmAngle) * 5);
  const bArmEndY = shoulderY + 1 + Math.round(Math.cos(pose.backArmAngle) * 5);
  mainBuf.thickLine(bx - 3, shoulderY + 1, bArmEndX, bArmEndY, cloakDark, cloakMid);
  mainBuf.rect(bArmEndX - 1, bArmEndY - 1, 2, 2, skinSh);

  // Sculpted Torso tailored to match 8px width tightly
  const isRobed =
    prof.archetype === 'mage' ||
    prof.archetype === 'witch' ||
    prof.archetype === 'seraph' ||
    prof.archetype === 'druid' ||
    prof.archetype === 'royal';
  const isArmored =
    prof.archetype === 'knight' ||
    prof.archetype === 'valkyrie' ||
    prof.archetype === 'draconic' ||
    prof.archetype === 'mecha' ||
    prof.archetype === 'samurai';

  const torsoW = isArmored ? 9 : 8;
  const torsoH = pose.crouchSquash ? 5 : 8;
  const tLeft = bx - Math.floor(torsoW / 2) + (pose.leanX > 0 ? 1 : 0);

  for (let ty = 0; ty < torsoH; ty++) {
    const flare = isRobed && ty >= torsoH - 3 ? 1 : 0;
    const taper = !isRobed && ty >= torsoH - 2 ? -1 : 0;
    for (let tx = -flare - taper; tx < torsoW + flare + taper; tx++) {
      const px = tLeft + tx;
      const py = shoulderY + ty;
      let col = cloakMid;
      if (tx <= -flare) {
        col = cloakHi;
      } else if (tx >= torsoW + flare - 1) {
        col = cloakDark;
      } else if (ty <= 1) {
        col = cloakHi;
      } else if (ty >= torsoH - 2) {
        col = cloakDark;
      }

      if (isArmored && ty >= 1 && ty <= 4 && tx >= 2 && tx <= torsoW - 3) {
        col = ty <= 2 ? metalHi : ty === 3 ? metal : metalDark;
      } else if (isRobed && Math.abs(px - bx) <= 1 && ty >= 1) {
        col = ty % 2 === 0 ? metalHi : acc;
      }
      mainBuf.set(px, py, col);
    }
  }

  // Collar / Scarf Wrap / Armor Pauldrons
  mainBuf.rect(tLeft - 1, shoulderY, torsoW + 2, 2, isArmored ? metalHi : acc);
  mainBuf.rect(tLeft, shoulderY + 1, torsoW, 1, isArmored ? metal : accHi);

  if (isArmored) {
    mainBuf.rect(tLeft - 2, shoulderY - 1, 3, 3, metalHi);
    mainBuf.set(tLeft - 1, shoulderY + 1, metal);
    mainBuf.rect(tLeft + torsoW - 1, shoulderY - 1, 3, 3, metal);
    mainBuf.set(tLeft + torsoW, shoulderY + 1, metalDark);
  }
  if (prof.archetype === 'mecha') {
    mainBuf.rect(bx - 1, shoulderY + 3, 2, 2, accHi);
    mainBuf.set(bx, shoulderY + 3, '#ffffff');
  } else if (prof.signature === 'potion_flasks') {
    mainBuf.rect(bx - 3, waistY - 2, 2, 3, '#4df0c0');
    mainBuf.rect(bx + 2, waistY - 2, 2, 3, '#ff66dd');
  } else if (prof.signature === 'prayer_beads') {
    for (let bi = -3; bi <= 3; bi += 2) {
      mainBuf.set(bx + bi, shoulderY + 2 + (3 - Math.abs(bi)), metalHi);
    }
  } else if (prof.signature === 'anvil_apron') {
    mainBuf.rect(bx - 3, shoulderY + 3, 6, 5, bootDark);
    mainBuf.rect(bx - 2, shoulderY + 3, 4, 1, metal);
  } else if (prof.signature === 'scarab_collar') {
    mainBuf.rect(bx - 3, shoulderY + 1, 7, 1, metalHi);
    mainBuf.set(bx, shoulderY + 1, accHi);
  } else if (prof.signature === 'alpine_pin') {
    mainBuf.rect(bx - 1, shoulderY + 1, 3, 2, '#ff4d6d');
    mainBuf.set(bx, shoulderY + 1, '#ffffff');
  } else {
    const emY = shoulderY + 3;
    mainBuf.rect(bx - 1, emY, 2, 2, prof.emblem === 'crest' || prof.emblem === 'moon' ? metalHi : accHi);
    mainBuf.set(bx, emY, '#ffffff');
  }

  // Waist Belt + Buckle
  mainBuf.rect(tLeft, waistY - 1, torsoW, 2, cloakDeep);
  mainBuf.rect(bx - 1, waistY - 1, 2, 2, metalHi);

  // ==========================================================================
  // 3. EXPRESSIVE CELESTE HEAD (9x8), LUMINOUS EYES, LAYERED HAIR & HEADGEAR
  // ==========================================================================
  // Rounded face silhouette (narrow chin, expressive cheek volume)
  mainBuf.rect(hx - 4, hy - 4, 9, 7, skinCol);
  mainBuf.rect(hx - 5, hy - 2, 11, 4, skinCol);
  mainBuf.rect(hx - 3, hy + 3, 7, 1, skinSh);
  mainBuf.rect(hx - 3, hy - 4, 7, 1, skinHi);

  if (prof.hair !== 'hooded') {
    mainBuf.rect(hx - 5, hy, 1, 2, skinSh);
    mainBuf.rect(hx + 5, hy, 1, 2, skinCol);
  }

  // Subtle Celeste cheek blush & expressive mouth
  if (headgear !== 'visor' && headgear !== 'plague_mask' && prof.signature !== 'domino_mask') {
    mainBuf.set(hx - 3, hy + 2, '#ff7b9c');
    mainBuf.set(hx + 3, hy + 2, '#ff7b9c');
    if (pose.mouthMood === 'smile') {
      mainBuf.rect(hx - 1, hy + 2, 3, 1, '#e86886');
    } else if (pose.mouthMood === 'fierce') {
      mainBuf.rect(hx, hy + 2, 2, 1, skinSh);
    }
  }

  // Expressive Lower-Set Celeste Eyes!
  const exLeft = hx - 3 + pose.eyeOffsetX;
  const exRight = hx + 1 + pose.eyeOffsetX;
  const ey = hy + pose.eyeOffsetY;
  if (headgear === 'plague_mask') {
    mainBuf.rect(hx - 4, hy - 2, 9, 5, '#e2e8f0');
    mainBuf.thickLine(hx + 3, hy, hx + 8, hy + 2, '#cbd5e1', '#f8fafc');
    mainBuf.rect(hx - 1, hy - 1, 2, 2, acc);
  } else if (headgear === 'visor') {
    mainBuf.rect(hx - 4, hy - 2, 10, 3, '#0e0a1a');
    mainBuf.rect(hx - 3, hy - 1, 8, 2, acc);
    mainBuf.rect(hx + 1, hy - 1, 3, 1, '#ffffff');
  } else if (pose.blink) {
    mainBuf.rect(exLeft, ey + 1, 2, 1, chromaticInk);
    mainBuf.rect(exRight, ey + 1, 2, 1, chromaticInk);
  } else if (pose.happyEyes) {
    mainBuf.rect(exLeft, ey, 2, 1, chromaticInk);
    mainBuf.rect(exRight, ey, 2, 1, chromaticInk);
    mainBuf.set(exLeft + 1, ey - 1, chromaticInk);
    mainBuf.set(exRight + 1, ey - 1, chromaticInk);
  } else if (pose.determinedEyes) {
    for (const ex of [exLeft, exRight]) {
      mainBuf.rect(ex, ey - 1, 2, 2, eyeCol);
      mainBuf.set(ex, ey - 1, '#ffffff');
      mainBuf.set(ex + 1, ey + 1, chromaticInk);
    }
    mainBuf.set(exLeft, ey - 2, chromaticInk);
    mainBuf.set(exRight + 1, ey - 2, chromaticInk);
  } else {
    // 2x3 Crisp Hero Eyes (iris + catchlight + lash)
    for (const ex of [exLeft, exRight]) {
      mainBuf.rect(ex, ey - 1, 2, 1, chromaticInk);
      mainBuf.rect(ex, ey, 2, 2, eyeCol);
      mainBuf.set(ex, ey, '#ffffff');
      mainBuf.set(ex + 1, ey + 1, chromaticInk);
    }
  }

  if (prof.signature === 'domino_mask') {
    mainBuf.rect(hx - 4, ey - 1, 9, 2, '#0e0a1a');
    mainBuf.set(exLeft + 1, ey, accHi);
    mainBuf.set(exRight + 1, ey, accHi);
  }

  // Layered Hair Crown & Expressive Cheek Bangs
  if (prof.hair === 'hooded') {
    mainBuf.rect(hx - 5, hy - 6, 11, 4, cloakDark);
    mainBuf.rect(hx - 4, hy - 7, 9, 2, cloakMid);
    mainBuf.rect(hx - 5, hy - 3, 2, 7, cloakDark);
    mainBuf.rect(hx + 5, hy - 3, 2, 6, cloakMid);
    mainBuf.rect(hx - 3, hy - 6, 6, 1, cloakHi);
  } else if (prof.hair === 'spiky' || prof.hair === 'wild_mane') {
    mainBuf.rect(hx - 5, hy - 6, 11, 4, hairMain);
    mainBuf.rect(hx - 5, hy - 4, 2, 5, hairDark);
    mainBuf.rect(hx + 5, hy - 4, 2, 4, hairMain);
    mainBuf.thickLine(hx - 4, hy - 6, hx - 7, hy - 9, hairMain, hairHi);
    mainBuf.thickLine(hx - 1, hy - 6, hx - 1, hy - 10, hairMain, hairHi);
    mainBuf.thickLine(hx + 3, hy - 6, hx + 6, hy - 9, hairDark, hairMain);
    mainBuf.line(hx - 3, hy - 3, hx - 3, hy - 1, hairMain);
    mainBuf.line(hx, hy - 3, hx + 1, hy - 1, hairHi);
    mainBuf.line(hx + 3, hy - 3, hx + 4, hy - 1, hairMain);
  } else {
    mainBuf.rect(hx - 5, hy - 6, 11, 4, hairMain);
    mainBuf.rect(hx - 4, hy - 7, 9, 2, hairMain);
    mainBuf.rect(hx - 5, hy - 3, 2, 6, hairDark);
    mainBuf.rect(hx + 5, hy - 3, 2, 5, hairMain);
    // Bangs neatly draping over forehead
    mainBuf.rect(hx - 4, hy - 3, 3, 2, hairMain);
    mainBuf.rect(hx, hy - 3, 2, 2, hairHi);
    mainBuf.rect(hx + 2, hy - 3, 3, 2, hairMain);
    // Specular sheen arc
    mainBuf.rect(hx - 3, hy - 6, 6, 1, hairHi);
  }

  // Headgear Overlays (drawn crisply atop crown!)
  if (headgear === 'crown' || headgear === 'tiara') {
    const spH = headgear === 'crown' ? 3 : 2;
    mainBuf.rect(hx - 4, hy - 8, 9, 2, metal);
    mainBuf.rect(hx - 4, hy - 8 - spH, 2, spH, metalHi);
    mainBuf.rect(hx - 1, hy - 9 - spH, 3, spH + 1, metalHi);
    mainBuf.rect(hx + 3, hy - 8 - spH, 2, spH, metalHi);
    mainBuf.set(hx, hy - 8, accHi);
  } else if (headgear === 'halo') {
    mainBuf.rect(hx - 5, hy - 11, 11, 1, metalHi);
    mainBuf.set(hx - 5, hy - 10, metal);
    mainBuf.set(hx + 5, hy - 10, metal);
    mainBuf.rect(hx - 2, hy - 11, 5, 1, '#ffffff');
  } else if (headgear === 'horns') {
    for (const side of [-1, 1] as const) {
      mainBuf.thickLine(hx + side * 4, hy - 6, hx + side * 6, hy - 11, metal, metalHi);
      mainBuf.set(hx + side * 6, hy - 11, '#ffffff');
    }
  } else if (headgear === 'antlers') {
    for (const side of [-1, 1] as const) {
      mainBuf.thickLine(hx + side * 3, hy - 6, hx + side * 7, hy - 11, metal, accHi);
      mainBuf.line(hx + side * 5, hy - 8, hx + side * 5, hy - 11, metalHi);
      mainBuf.set(hx + side * 8, hy - 10, accHi);
    }
  } else if (headgear === 'kitsune_ears') {
    for (const side of [-1, 1] as const) {
      const ex = hx + side * 4 - (side < 0 ? 1 : 0);
      mainBuf.rect(ex, hy - 10, 3, 4, hairMain);
      mainBuf.rect(ex + 1, hy - 11, 1, 1, hairHi);
      mainBuf.rect(ex + 1, hy - 9, 1, 2, accHi);
    }
  } else if (headgear === 'witch_hat') {
    mainBuf.rect(hx - 8, hy - 6, 17, 2, cloakDark);
    mainBuf.rect(hx - 5, hy - 9, 11, 3, cloakMid);
    mainBuf.rect(hx - 3, hy - 11, 6, 2, cloakMid);
    mainBuf.thickLine(hx, hy - 11, hx + 4, hy - 14, cloakMid, cloakHi);
    mainBuf.rect(hx - 5, hy - 7, 11, 1, metalHi);
  } else if (headgear === 'valkyrie_wings') {
    for (const side of [-1, 1] as const) {
      mainBuf.thickLine(hx + side * 4, hy - 4, hx + side * 8, hy - 9, metalHi, '#ffffff');
      mainBuf.line(hx + side * 4, hy - 2, hx + side * 7, hy - 6, metalHi);
    }
  } else if (headgear === 'kabuto') {
    mainBuf.rect(hx - 6, hy - 7, 13, 3, cloakDark);
    mainBuf.rect(hx - 5, hy - 6, 11, 1, cloakMid);
    mainBuf.line(hx - 3, hy - 8, hx, hy - 11, metalHi);
    mainBuf.line(hx + 3, hy - 8, hx, hy - 11, metalHi);
    mainBuf.rect(hx - 1, hy - 10, 3, 1, '#ffffff');
  } else if (headgear === 'goggles') {
    mainBuf.rect(hx - 5, hy - 6, 11, 2, metal);
    mainBuf.rect(hx - 3, hy - 6, 3, 2, accHi);
    mainBuf.rect(hx + 1, hy - 6, 3, 2, accHi);
    mainBuf.set(hx - 3, hy - 6, '#ffffff');
    mainBuf.set(hx + 1, hy - 6, '#ffffff');
  } else if (headgear === 'flower_crown') {
    mainBuf.rect(hx - 4, hy - 7, 9, 1, '#4df0c0');
    mainBuf.set(hx - 3, hy - 8, acc);
    mainBuf.rect(hx, hy - 8, 2, 2, accHi);
    mainBuf.set(hx + 3, hy - 8, acc);
  } else if (headgear === 'jester_cap') {
    mainBuf.thickLine(hx - 2, hy - 7, hx - 7, hy - 11, cloakMid, cloakHi);
    mainBuf.thickLine(hx + 2, hy - 7, hx + 7, hy - 11, acc, accHi);
    mainBuf.set(hx - 7, hy - 11, metalHi);
    mainBuf.set(hx + 7, hy - 11, metalHi);
  }

  // ==========================================================================
  // 4. FRONT ARM + WEAPONRY + BESPOKE 48-HERO SIGNATURE VFX
  // ==========================================================================
  const fArmX = bx + 3;
  const fArmY = shoulderY + 1;
  const handX = fArmX + Math.round(Math.sin(-pose.frontArmAngle) * 5);
  const handY = fArmY + Math.round(Math.cos(-pose.frontArmAngle) * 5);
  mainBuf.thickLine(fArmX, fArmY, handX, handY, cloakMid, cloakHi);
  mainBuf.rect(handX - 1, handY - 1, 2, 2, skinCol);

  if (prof.weapon === 'shield') {
    const shX = handX + 1;
    const shY = handY - 3;
    mainBuf.rect(shX, shY, 5, 7, metal);
    mainBuf.rect(shX + 1, shY + 1, 3, 5, cloakMid);
    mainBuf.set(shX + 2, shY + 3, accHi);
  } else if (prof.weapon === 'orb' || prof.weapon === 'astrolabe' || prof.weapon === 'grimoire') {
    const ox = handX + 3;
    const oy = handY - 2;
    if (prof.weapon === 'grimoire') {
      mainBuf.rect(ox - 1, oy - 2, 5, 5, cloakDark);
      mainBuf.rect(ox, oy - 1, 3, 3, '#f8fafc');
      mainBuf.set(ox + 1, oy, accHi);
      fxBuf.set(ox + 1, oy - 3 - (pose.floatPhase % 2), '#ffffff', false);
    } else {
      mainBuf.disc(ox, oy, 2.1, metalHi);
      mainBuf.disc(ox, oy, 1.3, acc);
      mainBuf.set(ox - 1, oy - 1, '#ffffff');
      if (prof.weapon === 'astrolabe') {
        fxBuf.rect(ox - 3, oy, 7, 1, metalHi, false);
        fxBuf.rect(ox, oy - 3, 1, 7, metalHi, false);
      }
    }
  } else if (prof.weapon === 'twin_daggers') {
    const dxTip = handX + (weaponInHandFront ? 5 : 4);
    const dyTip = handY + (weaponInHandFront ? -4 : 2);
    mainBuf.thickLine(handX, handY, dxTip, dyTip, '#e2e8f0', '#ffffff');
    mainBuf.set(dxTip, dyTip, accHi);
    mainBuf.line(bArmEndX, bArmEndY, bArmEndX - 3, bArmEndY + 2, '#cbd5e1');
  } else if (prof.weapon === 'bow' && weaponInHandFront) {
    const bxTip = handX + 4;
    mainBuf.thickLine(bxTip - 1, handY - 5, bxTip + 2, handY, metal, metalHi);
    mainBuf.thickLine(bxTip + 2, handY, bxTip - 1, handY + 5, metal, metalHi);
    mainBuf.line(bxTip - 1, handY - 4, bxTip - 1, handY + 4, '#e2e8f0');
    fxBuf.line(handX, handY, bxTip + 5, handY, accHi, false);
  } else if (weaponInHandFront) {
    const ang = pose.weaponSwingAngle;
    const wLen =
      prof.weapon === 'greatsword' || prof.weapon === 'scythe' || prof.weapon === 'spear' || prof.weapon === 'halberd'
        ? 12
        : 9;
    const tipX = handX + Math.round(Math.cos(ang) * wLen);
    const tipY = handY + Math.round(Math.sin(ang) * wLen);
    const isPole =
      prof.weapon === 'staff' ||
      prof.weapon === 'scepter' ||
      prof.weapon === 'spear' ||
      prof.weapon === 'halberd' ||
      prof.weapon === 'scythe' ||
      prof.weapon === 'hammer';
    mainBuf.thickLine(handX, handY, tipX, tipY, isPole ? metal : '#e2e8f0', isPole ? metalHi : '#ffffff');
    if (prof.weapon === 'greatsword') {
      mainBuf.line(handX, handY - 1, tipX, tipY - 1, accHi);
      mainBuf.rect(handX - 1, handY - 1, 3, 3, metalHi);
    }
    if (prof.weapon === 'staff' || prof.weapon === 'scepter') {
      mainBuf.disc(tipX, tipY, 2, acc);
      mainBuf.set(tipX - 1, tipY - 1, '#ffffff');
    } else if (prof.weapon === 'scythe') {
      mainBuf.thickLine(tipX, tipY, tipX - 4, tipY + 4, acc, accHi);
    } else if (prof.weapon === 'hammer') {
      mainBuf.rect(tipX - 3, tipY - 2, 6, 4, metalHi);
      mainBuf.rect(tipX - 2, tipY - 1, 4, 2, acc);
    }
  }

  // ==========================================================================
  // 5. COMPACT BESPOKE 48-HERO SIGNATURE FLOATS & ACTION VFX
  // ==========================================================================
  const bob = pose.floatPhase % 2 === 0 ? 0 : 1;
  const sig = prof.signature;
  if (sig === 'chrono_gear') {
    fxBuf.disc(bx + 10, hy - 3 + bob, 1.8, metalHi, false);
    fxBuf.set(bx + 10, hy - 3 + bob, '#0b0817', false);
    fxBuf.set(bx + 10, hy - 6 + bob, accHi, false);
  } else if (sig === 'orbit_planet' || sig === 'star_crown') {
    fxBuf.disc(bx - 9, hy - 5 + bob, 1.5, accHi, false);
    fxBuf.line(bx - 12, hy - 4 + bob, bx - 6, hy - 6 + bob, '#ffffff', false);
    fxBuf.set(bx + 9, hy - 7 - bob, metalHi, false);
  } else if (sig === 'prism_shards' || sig === 'ice_shards' || sig === 'glacier_horns') {
    fxBuf.rect(bx + 9, shoulderY - 2 + bob, 2, 4, accHi, false);
    fxBuf.set(bx + 9, shoulderY - 3 + bob, '#ffffff', false);
    fxBuf.rect(bx - 10, shoulderY + bob, 1, 3, '#ffffff', false);
  } else if (sig === 'sakura_petals' || sig === 'forest_leaves' || sig === 'faerie_dust' || sig === 'floral_vines') {
    fxBuf.rect(bx + 9, hy + bob, 2, 1, accHi, false);
    fxBuf.set(bx + 10, hy + 1 + bob, '#ffffff', false);
    fxBuf.rect(bx - 9, shoulderY + 2 - bob, 2, 1, acc, false);
  } else if (sig === 'soul_lantern' || sig === 'void_rift' || sig === 'plague_censer') {
    fxBuf.rect(bx + 9, shoulderY + bob, 2, 3, metalDark, false);
    fxBuf.set(bx + 9, shoulderY + 1 + bob, accHi, false);
    fxBuf.set(bx + 10, shoulderY + bob, '#ffffff', false);
  } else if (sig === 'music_notes' || sig === 'spirit_bells') {
    fxBuf.rect(bx + 9, hy - 3 + bob, 2, 3, accHi, false);
    fxBuf.set(bx + 10, hy - 3 + bob, '#ffffff', false);
    fxBuf.set(bx - 9, hy - 1 - bob, metalHi, false);
  } else if (sig === 'wind_whirl' || sig === 'silk_ribbons') {
    fxBuf.line(bx - 9, waistY - 1 + bob, bx - 12, waistY - 4 + bob, accHi, false);
    fxBuf.line(bx + 8, shoulderY + 1 - bob, bx + 11, shoulderY - 2 - bob, '#ffffff', false);
  } else if (sig === 'shadow_wisps' || sig === 'blood_sigil' || sig === 'raven_feathers') {
    fxBuf.set(bx + 9, shoulderY + 1 + bob, acc, false);
    fxBuf.rect(bx - 10, waistY - 1 - bob, 1, 2, accHi, false);
  } else if (sig === 'forge_embers' || sig === 'sun_rays' || sig === 'sun_ankh' || sig === 'plasma_exhaust') {
    fxBuf.rect(bx + 9, hy - 1 - bob, 1, 2, '#ffe066', false);
    fxBuf.set(bx + 10, hy - 4 - bob, '#ffffff', false);
    fxBuf.set(bx - 9, shoulderY + bob, accHi, false);
  } else if (sig === 'seraph_feathers' || sig === 'valkyrie_plume' || sig === 'paladin_aura' || sig === 'aether_halo') {
    fxBuf.rect(bx + 9, hy - 3 + bob, 1, 2, '#ffffff', false);
    fxBuf.rect(bx - 9, shoulderY + 1 - bob, 1, 2, accHi, false);
  } else if (sig === 'arc_sparks' || sig === 'storm_halo') {
    fxBuf.line(bx + 8, hy - 4 + bob, bx + 10, hy - 2 + bob, '#ffffff', false);
    fxBuf.line(bx + 10, hy - 2 + bob, bx + 9, hy + bob, accHi, false);
  } else if (sig === 'lunar_crescent') {
    fxBuf.rect(bx + 9, hy - 5 + bob, 2, 4, accHi, false);
    fxBuf.rect(bx + 8, hy - 4 + bob, 1, 2, '#0b0817', false);
  } else if (sig === 'water_droplets') {
    fxBuf.rect(bx + 9, shoulderY - 1 + bob, 1, 2, accHi, false);
    fxBuf.set(bx + 9, shoulderY - 2 + bob, '#ffffff', false);
  } else if (sig === 'bastion_crest' || sig === 'stone_runes' || sig === 'frost_braids') {
    fxBuf.rect(bx + 9, shoulderY + bob, 2, 2, metalHi, false);
    fxBuf.set(bx + 9, shoulderY + bob, accHi, false);
  } else if (sig === 'jester_bells') {
    fxBuf.set(bx + 9, shoulderY + bob, '#ffe066', false);
    fxBuf.set(bx - 9, shoulderY - 1 - bob, accHi, false);
  }

  if (pose.dashStreak) {
    fxBuf.thickLine(bx - 6, shoulderY, bx - 15, shoulderY, accHi, '#ffffff', false);
    fxBuf.thickLine(bx - 5, shoulderY + 4, bx - 16, shoulderY + 4, acc, '#ffffff', false);
    fxBuf.line(bx - 7, waistY + 2, bx - 13, waistY + 2, acc, false);
  }
  if (pose.slashPhase >= 1 && pose.slashPhase <= 2) {
    const sx = bx + 9;
    const sy = shoulderY + 2;
    fxBuf.thickLine(sx - 2, sy - 7, sx + 5, sy, '#ffffff', '#ffffff', false);
    fxBuf.thickLine(sx + 5, sy, sx - 1, sy + 7, '#ffffff', '#ffffff', false);
    fxBuf.line(sx - 3, sy - 5, sx + 4, sy, accHi, false);
    fxBuf.line(sx + 4, sy, sx - 2, sy + 5, accHi, false);
  }
  if (pose.swimBubbles) {
    const by = 8 + (frameIdx % 2) * 3;
    fxBuf.disc(hx + 7, by, 1.1, '#a8f5ff', false);
    fxBuf.set(hx + 9, by - 4, '#ffffff', false);
  }
  if (anim === 'victory') {
    const sp = frameIdx % 2;
    fxBuf.rect(5 + sp * 2, 6, 1, 2, accHi, false);
    fxBuf.rect(32 - sp * 2, 8, 2, 1, '#ffe066', false);
    fxBuf.rect(31, 18 - sp * 2, 1, 2, '#ffffff', false);
  }

  // ==========================================================================
  // 6. COMPOSITE ALL LAYERS WITH UNIFIED CHROMATIC OUTLINE TO BAKE CANVAS
  // ==========================================================================
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, BAKE_W, BAKE_H);
  flushCompositeWithOutline(ctx, backBuf, mainBuf, fxBuf, chromaticInk);
}

export function getOrBakeHeroStudioSprite(
  heroId: HeroId,
  skinId: string,
  anim: HeroAnimKey,
  frameIdx: number,
  dashes: number,
  featherActive: boolean,
  lowStaminaFlash: boolean
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const dashKey = featherActive ? 'f' : dashes >= 2 ? '2' : dashes === 1 ? '1' : '0';
  const count = HERO_ANIM_FRAME_COUNTS[anim] ?? 4;
  const safeFrame = ((Math.floor(frameIdx) % count) + count) % count;
  const key = `px40_${heroId}_${skinId}_${anim}_${safeFrame}_${dashKey}_${lowStaminaFlash ? 'w' : 'n'}`;
  const existing = STUDIO_BAKE_CACHE.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = BAKE_W;
  canvas.height = BAKE_H;
  const g = canvas.getContext('2d');
  if (!g) return null;

  renderHeroPixelArtToCanvas(
    g,
    heroId,
    skinId,
    anim,
    safeFrame,
    dashes,
    featherActive,
    lowStaminaFlash
  );
  STUDIO_BAKE_CACHE.set(key, canvas);
  return canvas;
}

export function drawHeroStudioSprite(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  skinId: string,
  anim: HeroAnimKey,
  frameIdx: number,
  dashes: number,
  featherActive: boolean,
  lowStaminaFlash: boolean,
  dx: number,
  dy: number,
  flipX = false,
  scaleX = 1,
  scaleY = 1,
  targetWorldH = 20
): void {
  const sprite = getOrBakeHeroStudioSprite(
    heroId,
    skinId,
    anim,
    frameIdx,
    dashes,
    featherActive,
    lowStaminaFlash
  );
  if (!sprite) return;
  const targetW = (BAKE_W / BAKE_H) * targetWorldH;
  // Snap draw anchor to integer native canvas pixels when in world mode (2px canvas scale = 0.5 world step)
  const snapX = Math.round(dx * 2) * 0.5;
  const snapY = Math.round(dy * 2) * 0.5;
  ctx.save();
  ctx.translate(snapX, snapY);
  ctx.scale((flipX ? -1 : 1) * scaleX, scaleY);
  ctx.imageSmoothingEnabled = false;
  // Shift slightly so feet at y=38 sit flush on the ground line dy (2px bottom margin in 40x40 grid)
  const footMarginWorld = (2 / BAKE_H) * targetWorldH;
  ctx.drawImage(sprite, -targetW * 0.5, -targetWorldH + footMarginWorld, targetW, targetWorldH);
  ctx.restore();
}

export function drawHeroStudioPortraitBust(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  skinId: string,
  width: number,
  height: number,
  time: number
): void {
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);
  const accent = skin.id !== 'default' ? skin.badgeColor : hero.accentColor;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#090614';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = colorWithAlpha(accent, 0.16);
  ctx.fillRect(4, 4, width - 8, height - 8);
  ctx.fillStyle = colorWithAlpha(accent, 0.24);
  const cx = Math.floor(width * 0.5);
  const cy = Math.floor(height * 0.48);
  const r = Math.floor(width * 0.34);
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Twinkling pixel stars
  const blinkStep = Math.floor(time * 2) % 2;
  ctx.fillStyle = '#ffffffcc';
  ctx.fillRect(Math.floor(width * 0.16), Math.floor(height * 0.22), 3 + blinkStep, 3 + blinkStep);
  ctx.fillStyle = colorWithAlpha(accent, 0.9);
  ctx.fillRect(Math.floor(width * 0.80), Math.floor(height * 0.24), 4 - blinkStep, 4 - blinkStep);

  const frameIdx = Math.floor(time * 2.4) % HERO_ANIM_FRAME_COUNTS.idle;
  const sprite = getOrBakeHeroStudioSprite(
    heroId,
    skinId,
    'idle',
    frameIdx,
    hero.modifiers.baseDashes,
    false,
    false
  );
  if (sprite) {
    // Crisp 24x24 portrait bust crop centered on face, headgear & collar of the 40x40 Celeste sprite
    const srcW = 24;
    const srcH = 24;
    const srcX = 8;
    const srcY = 5;
    const bob = Math.round(Math.sin(time * 2.4) * 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, srcX, srcY, srcW, srcH, 0, 4 + bob, width, height);
  }
}
