// @ts-nocheck -- Celeste-Plus 56x64 Studio Pixel-Art Hero & Portrait Engine
// Renders all 48 heroes x 3 skins (144 variants) across 12 multi-frame actions
// on a high-craft 56x64 nearest-neighbor pixel grid with:
// - 1px sculpted contour outline (#080612) & selective interior shading
// - Unique per-archetype torso armor/robes/brigandine/hakama & articulated limbs
// - 48 bespoke hero signatures (floating orbs, gears, tails, potion vials, wings, rune sparks)
// - 3x4 expressive Celeste eyes (iris gradient, sclera, catchlights, blink/fierce/joy states)
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

export const HERO_PIXEL_W = 56;
export const HERO_PIXEL_H = 64;
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

function shadeHex(hex: string, factor: number): string {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex;
  let r: number;
  let g: number;
  let b: number;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => cl(v).toString(16).padStart(2, '0');
  return `#${toHex(r * factor)}${toHex(g * factor)}${toHex(b * factor)}`;
}

// ============================================================================
// HIGH-CRAFT INTEGER PIXEL BUFFER WITH AUTO-CONTOUR & BRUSH PRIMITIVES
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

  public get(x: number, y: number): string | null {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.w || iy < 0 || iy >= this.h) return null;
    return this.pixels[iy * this.w + ix];
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
    for (let guard = 0; guard < 180; guard++) {
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
    const r2 = r * r + 0.35;
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy <= r2) {
          this.set(cx + dx, cy + dy, color, outline);
        }
      }
    }
  }
}

function flushBufWithOutline(
  ctx: CanvasRenderingContext2D,
  buf: PixelBuf,
  outlineColor: string
): void {
  const { w, h, pixels, outlineMask } = buf;
  // Pass 1: 1px crisp silhouette outline around all masked pixels
  ctx.fillStyle = outlineColor;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (pixels[idx] !== null) continue;
      const adj =
        (x > 0 && outlineMask[idx - 1] === 1) ||
        (x < w - 1 && outlineMask[idx + 1] === 1) ||
        (y > 0 && outlineMask[idx - w] === 1) ||
        (y < h - 1 && outlineMask[idx + w] === 1);
      if (adj) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  // Pass 2: Shaded pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = pixels[y * w + x];
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
}

function computePose(anim: HeroAnimKey, rawFrame: number): PoseKinematics {
  const count = HERO_ANIM_FRAME_COUNTS[anim] ?? 4;
  const f = ((Math.floor(rawFrame) % count) + count) % count;

  const base: PoseKinematics = {
    bodyX: 27,
    bodyY: 36,
    headX: 27,
    headY: 22,
    leanX: 0,
    leftFootX: -4,
    leftFootY: 0,
    rightFootX: 4,
    rightFootY: 0,
    backArmAngle: 0.22,
    frontArmAngle: -0.18,
    capeSweepX: -4,
    capeLiftY: 0,
    wingFlapY: 0,
    blink: false,
    happyEyes: false,
    determinedEyes: false,
    eyeOffsetX: 1,
    eyeOffsetY: 0,
    weaponSwingAngle: -0.55,
    slashPhase: -1,
    dashStreak: false,
    swimBubbles: false,
    floatPhase: f,
    mouthMood: 'neutral',
  };

  if (anim === 'idle') {
    const breath = f === 1 || f === 2 ? 1 : f === 3 ? 1 : 0;
    base.bodyY = 36 + breath;
    base.headY = 22 + breath;
    base.capeSweepX = f === 0 || f === 5 ? -5 : f === 2 || f === 3 ? -3 : -4;
    base.capeLiftY = f === 2 || f === 3 ? -1 : 0;
    base.wingFlapY = f === 1 || f === 2 ? 2 : f === 4 ? -1 : 0;
    base.blink = f === 4;
    return base;
  }

  if (anim === 'run') {
    const bob = f === 1 || f === 4 ? -2 : f === 2 || f === 5 ? 0 : 1;
    const strides: [number, number, number, number][] = [
      [-7, -2, 7, -3],
      [-3, 0, 4, -5],
      [4, -3, -5, -2],
      [7, -2, -7, -3],
      [3, -5, -4, 0],
      [-5, -2, 5, -2],
    ];
    const [lfx, lfy, rfx, rfy] = strides[f];
    base.bodyX = 28;
    base.bodyY = 36 + bob;
    base.headX = 30;
    base.headY = 22 + bob;
    base.leanX = 2;
    base.leftFootX = lfx;
    base.leftFootY = lfy;
    base.rightFootX = rfx;
    base.rightFootY = rfy;
    base.backArmAngle = f < 3 ? 0.78 : -0.68;
    base.frontArmAngle = f < 3 ? -0.78 : 0.72;
    base.capeSweepX = -11 - (f % 2) * 2;
    base.capeLiftY = -3 + (f % 2) * 2;
    base.wingFlapY = f % 2 === 0 ? -2 : 2;
    base.determinedEyes = true;
    base.weaponSwingAngle = -0.92;
    return base;
  }

  if (anim === 'jump') {
    const tuck = f >= 1 ? -2 : 0;
    base.bodyY = 33 + tuck;
    base.headY = 19 + tuck;
    base.leanX = 2;
    base.leftFootX = -4;
    base.leftFootY = -3;
    base.rightFootX = 5;
    base.rightFootY = f >= 1 ? -6 : -3;
    base.backArmAngle = -0.95;
    base.frontArmAngle = -1.15;
    base.capeSweepX = -9;
    base.capeLiftY = 4;
    base.wingFlapY = f % 2 === 0 ? -5 : -1;
    base.eyeOffsetY = -1;
    base.weaponSwingAngle = -0.75;
    return base;
  }

  if (anim === 'fall') {
    const flutter = f % 2;
    base.bodyY = 34;
    base.headY = 20;
    base.leanX = -1;
    base.leftFootX = -5;
    base.leftFootY = -2 + flutter;
    base.rightFootX = 5;
    base.rightFootY = -3 + (1 - flutter);
    base.backArmAngle = -0.8 - flutter * 0.16;
    base.frontArmAngle = -0.8 + flutter * 0.16;
    base.capeSweepX = -8 - flutter * 2;
    base.capeLiftY = -8 - flutter * 2;
    base.wingFlapY = -5 - flutter * 2;
    base.eyeOffsetY = 1;
    base.weaponSwingAngle = -0.35;
    return base;
  }

  if (anim === 'dash') {
    base.bodyX = 31;
    base.bodyY = 36;
    base.headX = 34;
    base.headY = 24 + (f % 2);
    base.leanX = 4;
    base.leftFootX = -9;
    base.leftFootY = -3;
    base.rightFootX = -2;
    base.rightFootY = -5;
    base.backArmAngle = 1.15;
    base.frontArmAngle = 0.95;
    base.capeSweepX = -16 - (f % 2) * 3;
    base.capeLiftY = -4;
    base.wingFlapY = -2;
    base.determinedEyes = true;
    base.weaponSwingAngle = -1.25;
    base.dashStreak = true;
    return base;
  }

  if (anim === 'climb') {
    const reach = f < 2 ? -1 : 1;
    base.bodyX = 28;
    base.bodyY = 36 + (f % 2 === 0 ? -1 : 0);
    base.headX = 28;
    base.headY = 22 + (f % 2 === 0 ? -1 : 0);
    base.leftFootX = -2;
    base.leftFootY = reach > 0 ? -5 : 0;
    base.rightFootX = 5;
    base.rightFootY = reach > 0 ? 0 : -5;
    base.backArmAngle = reach > 0 ? -1.45 : -0.4;
    base.frontArmAngle = reach > 0 ? -0.4 : -1.45;
    base.capeSweepX = -6;
    base.capeLiftY = 2;
    base.eyeOffsetY = -1;
    return base;
  }

  if (anim === 'wall_slide') {
    const jitter = f % 2;
    base.bodyX = 28;
    base.bodyY = 36 + jitter;
    base.headX = 28;
    base.headY = 22 + jitter;
    base.leanX = -2;
    base.leftFootX = -3;
    base.leftFootY = -2;
    base.rightFootX = 5;
    base.rightFootY = -5;
    base.frontArmAngle = -1.35;
    base.backArmAngle = 0.45;
    base.capeSweepX = -8;
    base.capeLiftY = -4;
    base.determinedEyes = true;
    base.eyeOffsetY = 1;
    return base;
  }

  if (anim === 'crouch') {
    const settle = f === 0 ? 4 : 6;
    base.bodyY = 36 + settle;
    base.headX = 29;
    base.headY = 24 + settle;
    base.leanX = 2;
    base.leftFootX = -5;
    base.leftFootY = 0;
    base.rightFootX = 5;
    base.rightFootY = 0;
    base.capeSweepX = -6;
    base.capeLiftY = 3;
    base.determinedEyes = true;
    return base;
  }

  if (anim === 'swim') {
    const kick = f % 2 === 0 ? -3 : 3;
    base.bodyX = 28;
    base.bodyY = 36 + (f === 1 || f === 2 ? -1 : 0);
    base.headX = 31;
    base.headY = 23 + (f === 1 || f === 2 ? -1 : 0);
    base.leanX = 3;
    base.leftFootX = -8;
    base.leftFootY = -3 + kick;
    base.rightFootX = -4;
    base.rightFootY = -3 - kick;
    base.backArmAngle = f < 2 ? -0.65 : 0.75;
    base.frontArmAngle = f < 2 ? 0.75 : -0.65;
    base.capeSweepX = -11;
    base.capeLiftY = -3;
    base.swimBubbles = true;
    return base;
  }

  if (anim === 'glide') {
    const soar = f === 1 ? -2 : 0;
    base.bodyY = 34 + soar;
    base.headY = 20 + soar;
    base.leanX = 2;
    base.leftFootX = -5;
    base.leftFootY = -2;
    base.rightFootX = 4;
    base.rightFootY = -3;
    base.backArmAngle = -1.15;
    base.frontArmAngle = -1.15;
    base.capeSweepX = -14;
    base.capeLiftY = -6 + soar;
    base.wingFlapY = -4 + soar;
    return base;
  }

  if (anim === 'skill') {
    const lunge = f === 0 ? -2 : f === 1 ? 5 : f === 2 ? 4 : 2;
    base.bodyX = 27 + lunge;
    base.bodyY = 36 + (f === 1 ? 1 : 0);
    base.headX = 29 + lunge;
    base.headY = 22 + (f === 1 ? 1 : 0);
    base.leanX = f === 0 ? -2 : 3;
    base.leftFootX = -6;
    base.leftFootY = 0;
    base.rightFootX = f >= 1 ? 7 : 3;
    base.rightFootY = f === 1 ? -2 : 0;
    base.frontArmAngle = f === 0 ? -1.45 : f === 1 ? 0.35 : f === 2 ? 0.8 : 0.15;
    base.backArmAngle = 0.8;
    base.capeSweepX = -11 - lunge;
    base.capeLiftY = -3;
    base.determinedEyes = true;
    base.weaponSwingAngle = f === 0 ? -1.45 : f === 1 ? 0.45 : f === 2 ? 0.95 : 0.12;
    base.slashPhase = f;
    base.mouthMood = 'fierce';
    return base;
  }

  // 'victory'
  const joy = f === 1 || f === 2 ? -2 : 0;
  base.bodyY = 34 + joy;
  base.headY = 20 + joy;
  base.leftFootX = -5;
  base.leftFootY = 0;
  base.rightFootX = 5;
  base.rightFootY = 0;
  base.frontArmAngle = -1.5;
  base.backArmAngle = 0.3;
  base.capeSweepX = f % 2 === 0 ? -8 : -10;
  base.capeLiftY = -3 + joy;
  base.wingFlapY = -3 + joy;
  base.happyEyes = f === 1 || f === 2;
  base.eyeOffsetY = -1;
  base.weaponSwingAngle = -0.22;
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

  const outline = pal.o || '#080612';
  const skinCol = pal.s || '#f5d7c4';
  const skinSh = pal.S || '#cfa086';
  const skinHi = shadeHex(skinCol, 1.07);
  const hairDark = pal.d || '#2a1a40';
  const hairMain = pal.h || '#c84b6b';
  const hairHi = pal.H || '#ff9ebe';
  const cloakDark = pal.D || '#1a2444';
  const cloakDeep = shadeHex(cloakDark, 0.72);
  const cloakMid = pal.C || '#2d4b8a';
  const cloakHi = pal.c || '#6dc2ff';
  const metal = pal.g || '#d99e30';
  const metalDark = shadeHex(metal, 0.68);
  const metalHi = pal.G || '#fff2a6';
  const acc = pal.a || hero.accentColor;
  const accHi = pal.A || '#ffffff';
  const eyeCol = pal.e || hero.accentColor;
  const bootDark = pal.b || '#221a30';
  const bootLight = pal.L || '#52436e';

  const pose = computePose(anim, frameIdx);
  const backBuf = new PixelBuf(BAKE_W, BAKE_H);
  const mainBuf = new PixelBuf(BAKE_W, BAKE_H);
  const fxBuf = new PixelBuf(BAKE_W, BAKE_H);

  const footBaseY = 60;
  const shoulderY = pose.bodyY - 2;
  const waistY = pose.bodyY + 10;
  const bx = pose.bodyX;
  const hx = pose.headX;
  const hy = pose.headY;

  // ==========================================================================
  // 1. BACK LAYER: WINGS, CAPES, THRUSTERS, FOX TAILS, BACK HAIR, SHEATHED WEAPONS
  // ==========================================================================
  const wy = shoulderY + 1 + pose.wingFlapY;
  if (prof.cloak === 'seraph_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 6;
      // Multi-tiered feathered angel wings!
      backBuf.thickLine(wx, wy, wx + side * 14, wy - 9, accHi, '#ffffff');
      backBuf.thickLine(wx, wy + 2, wx + side * 16, wy - 5, '#ffffff', '#ffffff');
      backBuf.thickLine(wx, wy + 4, wx + side * 14, wy - 1, accHi);
      backBuf.thickLine(wx, wy + 6, wx + side * 11, wy + 4, acc);
      backBuf.line(wx, wy + 8, wx + side * 8, wy + 7, acc);
      // Individual feather pinion tips
      backBuf.rect(wx + side * 14 - (side < 0 ? 1 : 0), wy - 9, 2, 2, '#ffffff');
      backBuf.rect(wx + side * 15 - (side < 0 ? 1 : 0), wy - 5, 2, 2, accHi);
      backBuf.set(wx + side * 14, wy - 1, '#ffffff');
      backBuf.set(wx + side * 11, wy + 4, accHi);
    }
  } else if (prof.cloak === 'dragon_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 6;
      // Spined horned bat-dragon wing with shaded membrane
      backBuf.thickLine(wx, wy + 2, wx + side * 14, wy - 9, metalHi, metalHi);
      backBuf.line(wx + side * 14, wy - 9, wx + side * 16, wy + 1, metal);
      backBuf.line(wx + side * 3, wy + 4, wx + side * 13, wy - 4, cloakDark);
      backBuf.line(wx + side * 4, wy + 5, wx + side * 13, wy - 1, acc);
      backBuf.line(wx + side * 5, wy + 6, wx + side * 11, wy + 3, cloakDark);
      backBuf.line(wx + side * 5, wy + 7, wx + side * 9, wy + 6, acc);
      backBuf.rect(wx + side * 14 - (side < 0 ? 1 : 0), wy - 10, 2, 2, accHi);
    }
  } else if (prof.cloak === 'butterfly_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 5;
      const sx0 = side < 0 ? wx - 14 : wx;
      backBuf.rect(sx0, wy - 7, 14, 7, acc);
      backBuf.ditherRect(sx0 + 1, wy - 6, 12, 5, acc, accHi);
      backBuf.rect(side < 0 ? wx - 11 : wx + 1, wy, 10, 6, acc);
      backBuf.disc(wx + side * 9, wy - 4, 2, '#ffffff');
      backBuf.disc(wx + side * 6, wy + 3, 1.4, metalHi);
    }
  } else if (prof.cloak === 'mecha_thrusters') {
    backBuf.rect(bx - 11, shoulderY - 2, 7, 11, metalDark);
    backBuf.rect(bx - 10, shoulderY - 1, 5, 9, metal);
    backBuf.rect(bx - 9, shoulderY, 3, 3, metalHi);
    backBuf.rect(bx - 10, shoulderY + 9, 5, 2, acc);
    if (anim === 'dash' || anim === 'jump' || anim === 'glide' || anim === 'skill') {
      fxBuf.thickLine(bx - 8, shoulderY + 11, bx - 14 + pose.capeSweepX * 0.25, shoulderY + 17, accHi, '#ffffff', false);
      fxBuf.set(bx - 10, shoulderY + 13, '#ffffff', false);
    }
  }

  // Hero Signature (Back Layer): Multi-Tail Kitsune, Dragon Tail, Sashimono Banner, Fae/Aether Wings
  if (prof.signature === 'fox_tails') {
    const wave = Math.sin(pose.floatPhase * 1.3) * 2;
    for (const angOff of [-5, -1, 3, 6]) {
      const tx = bx - 9 + pose.capeSweepX * 0.4;
      const ty = waistY - 2 + angOff + Math.round(wave);
      backBuf.thickLine(bx - 2, waistY + 1, tx, ty, hairMain, hairHi);
      backBuf.disc(tx, ty, 2.2, hairMain);
      backBuf.disc(tx - 1, ty, 1.3, '#ffffff');
    }
  } else if (prof.signature === 'dragon_tail') {
    const tTipX = bx - 15 + pose.capeSweepX * 0.35;
    const tTipY = waistY + 5 + (pose.floatPhase % 2 === 0 ? -1 : 1);
    backBuf.thickLine(bx - 2, waistY + 3, tTipX, tTipY, cloakDark, acc);
    backBuf.rect(tTipX - 2, tTipY - 1, 3, 3, metalHi);
  } else if (prof.signature === 'bushido_banner') {
    const sway = Math.round(pose.capeSweepX * 0.2);
    backBuf.line(bx - 6, waistY + 4, bx - 7 + sway, hy - 14, metalDark);
    backBuf.rect(bx - 13 + sway, hy - 14, 6, 13, acc);
    backBuf.rect(bx - 12 + sway, hy - 12, 4, 2, metalHi);
    backBuf.rect(bx - 11 + sway, hy - 7, 2, 4, '#ffffff');
  } else if (prof.signature === 'fae_wings') {
    for (const side of [-1, 1] as const) {
      const wx = bx + side * 6;
      backBuf.thickLine(wx, wy - 1, wx + side * 12, wy - 7, accHi, '#ffffff');
      backBuf.line(wx, wy + 2, wx + side * 9, wy + 4, acc);
    }
  } else if (prof.signature === 'radar_dish') {
    backBuf.rect(bx - 10, shoulderY - 5, 6, 6, metal);
    backBuf.disc(bx - 8, shoulderY - 3, 2, accHi);
    backBuf.set(bx - 10, shoulderY - 7, '#ffffff');
  }

  // Flowing cloak / scarf / star mantle / ribbons / fur mantle (sculpted multi-fold cloth!)
  const cEndX = bx + pose.capeSweepX - 7;
  const cEndY = waistY + 9 + pose.capeLiftY;
  if (prof.cloak === 'scarf') {
    // Multi-segment billowing Celeste scarf with highlight crease!
    const midX = Math.round((bx - 3 + cEndX) * 0.5);
    const midY = shoulderY + 3 + Math.round(pose.capeLiftY * 0.5) + (pose.floatPhase % 2);
    backBuf.thickLine(bx - 3, shoulderY + 2, midX, midY, acc, accHi);
    backBuf.thickLine(midX, midY, cEndX, shoulderY + 4 + pose.capeLiftY, acc, accHi);
    backBuf.rect(cEndX - 1, shoulderY + 4 + pose.capeLiftY, 3, 2, accHi);
  } else if (prof.cloak === 'ribbons') {
    backBuf.thickLine(bx - 3, shoulderY + 3, cEndX, cEndY - 5, acc, accHi);
    backBuf.thickLine(bx - 3, shoulderY + 7, cEndX + 3, cEndY, accHi, '#ffffff');
  } else if (prof.cloak !== 'mecha_thrusters') {
    const capeTopX = bx - 5;
    const capeTopY = shoulderY;
    for (let t = 0; t <= 15; t++) {
      const ratio = t / 15;
      const wave = Math.round(Math.sin(ratio * Math.PI + pose.floatPhase) * 1.4);
      const rx = Math.round(capeTopX + (cEndX - capeTopX) * ratio) + wave;
      const ry = Math.round(capeTopY + (cEndY - capeTopY) * ratio);
      const wSpan = Math.round(5 + ratio * 7);
      for (let dx = 0; dx < wSpan; dx++) {
        const px = rx + dx;
        const isStar = prof.cloak === 'star_mantle' && (px * 3 + ry * 5) % 9 === 0;
        const col = isStar
          ? '#ffffff'
          : dx === 0
            ? cloakHi
            : dx === wSpan - 1
              ? cloakDeep
              : t >= 13 && prof.cloak !== 'tattered_cloak'
                ? metal
                : (px + ry) % 2 === 0
                  ? cloakMid
                  : cloakDark;
        if (prof.cloak === 'tattered_cloak' && t >= 11 && (dx + t) % 3 === 0) continue;
        backBuf.set(px, ry, col);
      }
    }
    if (prof.cloak === 'fur_mantle') {
      backBuf.rect(bx - 9, shoulderY - 2, 18, 5, accHi);
      backBuf.ditherRect(bx - 8, shoulderY - 1, 16, 3, accHi, metal);
    }
  }

  // Back Hair Styles (lush layered locks flowing behind torso)
  if (prof.hair === 'flowing' || prof.hair === 'long_noble') {
    const len = prof.hair === 'long_noble' ? 19 : 14;
    for (let dy = 0; dy < len; dy++) {
      const sway = Math.round((pose.capeSweepX * 0.42 * dy) / len);
      const wSpan = prof.hair === 'long_noble' ? 12 - Math.floor(dy * 0.25) : 10 - Math.floor(dy * 0.2);
      for (let dx = 0; dx < wSpan; dx++) {
        const c =
          dx === 0
            ? hairHi
            : dy > len - 4 || dx === wSpan - 1
              ? hairDark
              : hairMain;
        backBuf.set(hx - 6 + dx + sway, hy + 1 + dy, c);
      }
    }
  } else if (prof.hair === 'twintails') {
    for (const side of [-1, 1] as const) {
      const tx = hx + side * 9;
      for (let dy = 0; dy < 15; dy++) {
        const sway = Math.round(pose.capeSweepX * 0.3 * (dy / 15));
        const col = dy < 4 ? hairHi : dy > 10 ? hairDark : hairMain;
        backBuf.rect(tx + sway, hy - 1 + dy, 3, 1, col);
      }
    }
  } else if (prof.hair === 'ponytail') {
    for (let i = 0; i < 15; i++) {
      const px = hx - 6 - Math.round(i * 0.65) + Math.round(pose.capeSweepX * 0.28);
      const py = hy - 3 + Math.round(i * 0.9) + Math.round(pose.capeLiftY * 0.3);
      backBuf.rect(px, py, 3, 2, i < 4 ? hairHi : i > 10 ? hairDark : hairMain);
    }
  } else if (prof.hair === 'braid') {
    for (let i = 0; i < 15; i++) {
      const sway = Math.round(pose.capeSweepX * 0.25 * (i / 15));
      const zig = i % 3 === 0 ? 1 : 0;
      backBuf.rect(hx - 6 + sway + zig, hy + 1 + i, 3, 1, i % 2 === 0 ? hairMain : hairHi);
    }
  }

  // Sheathed / Back Weapon (when idle/run/jump)
  const weaponInHandFront = anim === 'skill' || anim === 'victory';
  if (!weaponInHandFront && prof.weapon !== 'jetpack' && prof.weapon !== 'shield' && prof.weapon !== 'orb') {
    const wAnchorX = bx - 6;
    const wAnchorY = shoulderY + 2;
    if (prof.weapon === 'greatsword' || prof.weapon === 'blade' || prof.weapon === 'katana') {
      const len = prof.weapon === 'greatsword' ? 21 : 16;
      const tipX = wAnchorX - Math.round(len * 0.58);
      const tipY = wAnchorY - Math.round(len * 0.72);
      backBuf.thickLine(wAnchorX + 3, wAnchorY + 3, tipX, tipY, '#cbd5e1', '#f8fafc');
      if (prof.weapon === 'greatsword') {
        backBuf.line(wAnchorX + 4, wAnchorY + 3, tipX + 1, tipY + 1, acc);
      }
      backBuf.set(tipX, tipY, '#ffffff');
      backBuf.rect(wAnchorX + 1, wAnchorY + 1, 5, 3, metal);
      backBuf.set(wAnchorX + 2, wAnchorY + 2, metalHi);
    } else if (prof.weapon === 'staff' || prof.weapon === 'scepter' || prof.weapon === 'spear' || prof.weapon === 'halberd' || prof.weapon === 'scythe') {
      backBuf.thickLine(wAnchorX + 6, waistY + 6, wAnchorX - 8, hy - 11, metalDark, metal);
      if (prof.weapon === 'scythe') {
        backBuf.thickLine(wAnchorX - 8, hy - 11, wAnchorX + 4, hy - 14, acc, accHi);
        backBuf.line(wAnchorX + 4, hy - 14, wAnchorX + 8, hy - 8, acc);
      } else if (prof.weapon === 'spear' || prof.weapon === 'halberd') {
        backBuf.rect(wAnchorX - 10, hy - 15, 4, 5, metalHi);
        backBuf.set(wAnchorX - 9, hy - 16, '#ffffff');
        if (prof.weapon === 'halberd') {
          backBuf.rect(wAnchorX - 6, hy - 13, 4, 4, metal);
        }
      } else {
        backBuf.disc(wAnchorX - 8, hy - 13, 3, acc);
        backBuf.disc(wAnchorX - 9, hy - 14, 1.5, accHi);
        backBuf.set(wAnchorX - 9, hy - 14, '#ffffff');
      }
    } else if (prof.weapon === 'bow') {
      backBuf.thickLine(wAnchorX - 4, hy - 6, wAnchorX - 9, shoulderY + 2, metal, metalHi);
      backBuf.thickLine(wAnchorX - 9, shoulderY + 2, wAnchorX - 4, waistY + 3, metal, metalHi);
      backBuf.line(wAnchorX - 4, hy - 5, wAnchorX - 4, waistY + 2, '#e2e8f0');
    } else if (prof.weapon === 'hammer') {
      backBuf.thickLine(wAnchorX + 4, waistY + 4, wAnchorX - 8, hy - 7, metalDark, metal);
      backBuf.rect(wAnchorX - 13, hy - 11, 10, 6, cloakMid);
      backBuf.rect(wAnchorX - 12, hy - 10, 8, 2, accHi);
      backBuf.rect(wAnchorX - 13, hy - 11, 2, 6, metalHi);
    }
  }

  // Quiver on back for rangers/archers
  if (prof.signature === 'quiver') {
    backBuf.rect(bx - 8, shoulderY - 3, 4, 9, metalDark);
    backBuf.set(bx - 8, shoulderY - 5, accHi);
    backBuf.set(bx - 6, shoulderY - 5, '#ffffff');
  }

  // ==========================================================================
  // 2. FOREGROUND BODY: SHADED LEGS, BOOTS, UNIQUE ARCHETYPE TORSO, BELT, ARMS
  // ==========================================================================
  const bFootX = bx + pose.leftFootX;
  const bFootY = footBaseY + pose.leftFootY;
  const isHakama = prof.archetype === 'samurai' || prof.archetype === 'kitsune' || prof.archetype === 'monk';
  const legW = isHakama ? 5 : 3;

  // Back Leg & Articulated Boot
  mainBuf.thickLine(bx - 3, waistY, bFootX, bFootY - 5, cloakDeep, cloakDark);
  if (legW > 3) {
    mainBuf.line(bx - 5, waistY + 2, bFootX - 1, bFootY - 5, cloakDark);
  }
  mainBuf.rect(bFootX - 2, bFootY - 5, 6, 5, bootDark);
  mainBuf.rect(bFootX - 2, bFootY - 5, 5, 1, metal);
  mainBuf.rect(bFootX - 2, bFootY - 1, 6, 1, '#0d0917');

  // Front Leg & Articulated Boot with Knee Guard
  const fFootX = bx + pose.rightFootX;
  const fFootY = footBaseY + pose.rightFootY;
  mainBuf.thickLine(bx + 2, waistY, fFootX, fFootY - 5, cloakMid, cloakHi);
  if (legW > 3) {
    mainBuf.line(bx + 4, waistY + 2, fFootX + 2, fFootY - 5, cloakMid);
  }
  mainBuf.rect(fFootX - 2, fFootY - 5, 6, 5, bootLight);
  mainBuf.rect(fFootX - 1, fFootY - 2, 5, 2, bootDark);
  mainBuf.rect(fFootX - 2, fFootY - 5, 5, 1, metalHi);
  mainBuf.set(fFootX, fFootY - 7, metalHi); // Knee guard highlight

  // Back Arm + Gauntlet
  const bArmEndX = bx - 7 + Math.round(Math.sin(pose.backArmAngle) * 8);
  const bArmEndY = shoulderY + 2 + Math.round(Math.cos(pose.backArmAngle) * 8);
  mainBuf.thickLine(bx - 5, shoulderY + 2, bArmEndX, bArmEndY, cloakDark, cloakMid);
  mainBuf.rect(bArmEndX - 1, bArmEndY - 1, 3, 3, skinSh);

  // Sculpted Torso tailored by Archetype!
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

  const torsoW = isArmored ? 14 : 12;
  const tLeft = bx - Math.floor(torsoW / 2) + (pose.leanX > 1 ? 1 : 0);

  for (let ty = 0; ty < 13; ty++) {
    const flare = isRobed && ty >= 7 ? Math.floor((ty - 6) * 0.5) : 0;
    const taper = !isRobed && ty >= 9 ? -1 : 0;
    for (let tx = -flare - taper; tx < torsoW + flare + taper; tx++) {
      const px = tLeft + tx;
      const py = shoulderY + ty;
      let col = cloakMid;
      if (tx <= -flare + 1) {
        col = cloakHi;
      } else if (tx >= torsoW + flare - 2) {
        col = cloakDark;
      } else if (ty <= 2) {
        col = cloakHi;
      } else if (ty >= 10) {
        col = (px + py) % 2 === 0 ? cloakDark : cloakMid;
      }

      if (isArmored && ty >= 2 && ty <= 6 && tx >= 3 && tx <= torsoW - 4) {
        // Beveled breastplate armor!
        col = ty <= 3 ? metalHi : ty === 4 ? metal : metalDark;
      } else if (isRobed && Math.abs(px - bx) <= 1 && ty >= 2) {
        // Vertical robe stole / embroidered front drape
        col = ty % 3 === 0 ? metalHi : acc;
      }
      mainBuf.set(px, py, col);
    }
  }

  // Collar / Scarf Wrap / Armor Pauldrons / Alchemist Potion Belt
  mainBuf.rect(tLeft - 1, shoulderY, torsoW + 2, 3, isArmored ? metalHi : acc);
  mainBuf.rect(tLeft, shoulderY + 1, torsoW, 1, isArmored ? metal : accHi);

  if (isArmored) {
    // Layered Pauldrons with rim highlights
    mainBuf.rect(tLeft - 3, shoulderY - 1, 5, 5, metalHi);
    mainBuf.rect(tLeft - 2, shoulderY + 1, 4, 3, metal);
    mainBuf.rect(tLeft + torsoW - 2, shoulderY - 1, 5, 5, metal);
    mainBuf.rect(tLeft + torsoW - 1, shoulderY + 1, 3, 2, metalDark);
  }
  if (prof.archetype === 'mecha') {
    mainBuf.rect(bx - 2, shoulderY + 4, 4, 4, accHi);
    mainBuf.rect(bx - 1, shoulderY + 5, 2, 2, '#ffffff');
  } else if (prof.signature === 'potion_flasks') {
    mainBuf.rect(bx - 5, waistY - 3, 3, 4, '#4df0c0');
    mainBuf.rect(bx + 3, waistY - 3, 3, 4, '#ff66dd');
    mainBuf.set(bx - 4, waistY - 4, '#ffffff');
    mainBuf.set(bx + 4, waistY - 4, '#ffffff');
  } else if (prof.signature === 'prayer_beads') {
    for (let bi = -4; bi <= 4; bi += 2) {
      mainBuf.disc(bx + bi, shoulderY + 3 + (4 - Math.abs(bi)) * 0.6, 1.1, metalHi);
    }
  } else if (prof.signature === 'anvil_apron') {
    mainBuf.rect(bx - 4, shoulderY + 4, 9, 8, bootDark);
    mainBuf.rect(bx - 3, shoulderY + 5, 7, 1, metal);
  } else if (prof.signature === 'scarab_collar') {
    mainBuf.rect(bx - 5, shoulderY + 1, 11, 2, metalHi);
    mainBuf.disc(bx, shoulderY + 2, 1.6, accHi);
  } else if (prof.signature === 'alpine_pin') {
    mainBuf.rect(bx - 2, shoulderY + 2, 4, 3, '#ff4d6d');
    mainBuf.set(bx - 1, shoulderY + 2, '#ffffff');
  } else {
    // Crisp Hero Chest Emblem Insignia (star / crest / gem / moon / flame / bolt / leaf)
    const emY = shoulderY + 5;
    if (prof.emblem === 'star' || prof.emblem === 'gem') {
      mainBuf.rect(bx - 1, emY, 3, 3, accHi);
      mainBuf.set(bx, emY + 1, '#ffffff');
    } else if (prof.emblem === 'crest' || prof.emblem === 'moon') {
      mainBuf.rect(bx - 1, emY, 3, 3, metalHi);
      mainBuf.set(bx, emY + 1, acc);
    } else {
      mainBuf.rect(bx - 1, emY, 2, 3, accHi);
      mainBuf.set(bx, emY, '#ffffff');
    }
  }

  // Waist Belt + Jewelled Buckle
  mainBuf.rect(tLeft - 1, waistY - 1, torsoW + 2, 3, cloakDeep);
  mainBuf.rect(bx - 2, waistY - 1, 4, 3, metalHi);
  mainBuf.rect(bx - 1, waistY, 2, 1, acc);

  // Sculpted Neck Shadow connecting Head & Collar
  mainBuf.rect(hx - 2, hy + 5, 5, 2, skinSh);

  // ==========================================================================
  // 3. EXPRESSIVE CELESTE-PLUS HEAD (15x14 SCULPTED FACE), EYES, HAIR & HEADGEAR
  // ==========================================================================
  // Rounded sculpted face silhouette (forehead -> wide cheeks -> soft tapered chin)
  mainBuf.rect(hx - 6, hy - 6, 13, 10, skinCol);
  mainBuf.rect(hx - 7, hy - 4, 15, 7, skinCol);
  mainBuf.rect(hx - 5, hy + 4, 11, 2, skinCol);
  // Subtle ear peeks on non-hooded heads
  if (prof.hair !== 'hooded') {
    mainBuf.rect(hx - 8, hy - 1, 1, 3, skinSh);
    mainBuf.rect(hx + 8, hy - 1, 1, 3, skinCol);
  }
  // Top highlight & warm chin/cheek shading
  mainBuf.rect(hx - 5, hy - 6, 11, 1, skinHi);
  mainBuf.rect(hx - 5, hy + 5, 11, 1, skinSh);
  mainBuf.set(hx - 6, hy + 3, skinSh);
  mainBuf.set(hx + 6, hy + 3, skinSh);

  // Cute Celeste blush + delicate mouth expression
  if (headgear !== 'visor' && headgear !== 'plague_mask' && prof.signature !== 'domino_mask') {
    mainBuf.rect(hx - 5, hy + 2, 2, 1, '#ff7b9c');
    mainBuf.rect(hx + 4, hy + 2, 2, 1, '#ff7b9c');
    if (pose.mouthMood === 'smile') {
      mainBuf.rect(hx - 1, hy + 3, 3, 1, '#e86886');
      mainBuf.set(hx, hy + 4, '#ffffff');
    } else if (pose.mouthMood === 'fierce') {
      mainBuf.rect(hx - 1, hy + 3, 3, 1, skinSh);
    }
  }

  // Expressive 3x4 Celeste-Plus Eyes!
  const exLeft = hx - 4 + pose.eyeOffsetX;
  const exRight = hx + 2 + pose.eyeOffsetX;
  const ey = hy + pose.eyeOffsetY;
  if (headgear === 'plague_mask') {
    mainBuf.rect(hx - 6, hy - 3, 13, 8, '#e2e8f0');
    mainBuf.thickLine(hx + 5, hy, hx + 12, hy + 3, '#cbd5e1', '#f8fafc');
    mainBuf.disc(hx, hy - 1, 2, acc);
    mainBuf.set(hx - 1, hy - 2, '#ffffff');
  } else if (headgear === 'visor') {
    mainBuf.rect(hx - 6, hy - 3, 14, 5, '#0b0e1c');
    mainBuf.rect(hx - 5, hy - 2, 12, 3, acc);
    mainBuf.rect(hx + 1, hy - 2, 5, 1, '#ffffff');
  } else if (pose.blink) {
    mainBuf.rect(exLeft, ey + 1, 3, 1, outline);
    mainBuf.rect(exRight, ey + 1, 3, 1, outline);
  } else if (pose.happyEyes) {
    // Cheerful curved victory eyes ^ ^
    mainBuf.line(exLeft, ey + 1, exLeft + 1, ey, outline);
    mainBuf.line(exLeft + 1, ey, exLeft + 2, ey + 1, outline);
    mainBuf.line(exRight, ey + 1, exRight + 1, ey, outline);
    mainBuf.line(exRight + 1, ey, exRight + 2, ey + 1, outline);
  } else if (pose.determinedEyes) {
    // Intense Celeste combat/dash eyes + angled brow
    for (const ex of [exLeft, exRight]) {
      mainBuf.rect(ex, ey - 1, 3, 3, eyeCol);
      mainBuf.set(ex, ey - 1, '#ffffff');
      mainBuf.set(ex + 2, ey + 1, '#080612');
    }
    mainBuf.line(exLeft, ey - 2, exLeft + 2, ey - 1, outline);
    mainBuf.line(exRight, ey - 1, exRight + 2, ey - 2, outline);
  } else {
    // 3x4 Luminous Hero Eyes (upper lash + iris + deep pupil + twin catchlights + sclera)
    for (const ex of [exLeft, exRight]) {
      mainBuf.rect(ex, ey - 2, 3, 1, outline); // upper lash
      mainBuf.set(ex, ey - 1, '#ffffff');
      mainBuf.rect(ex + 1, ey - 1, 2, 2, eyeCol);
      mainBuf.set(ex + 1, ey, '#0b0817'); // pupil
      mainBuf.set(ex, ey, '#ffffff'); // sclera
      mainBuf.rect(ex, ey + 1, 3, 1, eyeCol);
      mainBuf.set(ex, ey - 1, '#ffffff'); // top catchlight
      mainBuf.set(ex + 2, ey + 1, '#ffffff'); // bottom iris glint
    }
  }

  // Domino mask overlay for phantom thief
  if (prof.signature === 'domino_mask') {
    mainBuf.rect(hx - 6, ey - 2, 13, 3, '#0b0817');
    mainBuf.set(exLeft + 1, ey, accHi);
    mainBuf.set(exRight + 1, ey, accHi);
  }

  // Layered Hair Crown & Expressive Bangs
  if (prof.hair === 'hooded') {
    mainBuf.rect(hx - 8, hy - 9, 17, 6, cloakDark);
    mainBuf.rect(hx - 7, hy - 11, 15, 3, cloakMid);
    mainBuf.rect(hx - 8, hy - 4, 3, 10, cloakDark);
    mainBuf.rect(hx + 7, hy - 4, 3, 8, cloakMid);
    mainBuf.rect(hx - 6, hy - 9, 11, 2, cloakHi);
  } else if (prof.hair === 'spiky' || prof.hair === 'wild_mane') {
    mainBuf.rect(hx - 8, hy - 9, 17, 6, hairMain);
    mainBuf.rect(hx - 8, hy - 6, 3, 8, hairDark);
    mainBuf.rect(hx + 7, hy - 6, 3, 7, hairMain);
    // Bold anime/Celeste spiky locks!
    mainBuf.thickLine(hx - 6, hy - 9, hx - 10, hy - 14, hairMain, hairHi);
    mainBuf.thickLine(hx - 1, hy - 9, hx - 2, hy - 15, hairMain, hairHi);
    mainBuf.thickLine(hx + 4, hy - 9, hx + 8, hy - 14, hairDark, hairMain);
    // Spiky forehead bangs
    mainBuf.line(hx - 5, hy - 4, hx - 4, hy - 1, hairMain);
    mainBuf.line(hx - 1, hy - 4, hx, hy - 1, hairHi);
    mainBuf.line(hx + 4, hy - 4, hx + 5, hy - 1, hairMain);
  } else {
    // Rich layered bangs & crown sheen
    mainBuf.rect(hx - 8, hy - 9, 17, 6, hairMain);
    mainBuf.rect(hx - 6, hy - 11, 13, 3, hairMain);
    mainBuf.rect(hx - 8, hy - 5, 3, 9, hairDark);
    mainBuf.rect(hx + 7, hy - 5, 3, 8, hairMain);
    // Framed bangs draping neatly above brows
    mainBuf.rect(hx - 6, hy - 5, 4, 3, hairMain);
    mainBuf.rect(hx - 1, hy - 5, 3, 2, hairHi);
    mainBuf.rect(hx + 3, hy - 5, 5, 3, hairMain);
    // Curved specular sheen
    mainBuf.rect(hx - 5, hy - 9, 9, 2, hairHi);
    mainBuf.rect(hx - 3, hy - 10, 5, 1, hairHi);
  }

  // Headgear Overlays (drawn crisply over crown!)
  if (headgear === 'crown' || headgear === 'tiara') {
    const spH = headgear === 'crown' ? 5 : 3;
    mainBuf.rect(hx - 6, hy - 12, 13, 3, metal);
    mainBuf.rect(hx - 6, hy - 12 - spH, 3, spH, metalHi);
    mainBuf.rect(hx - 1, hy - 13 - spH, 3, spH + 1, metalHi);
    mainBuf.rect(hx + 4, hy - 12 - spH, 3, spH, metalHi);
    mainBuf.rect(hx - 1, hy - 12, 3, 2, accHi);
  } else if (headgear === 'halo') {
    mainBuf.rect(hx - 7, hy - 16, 15, 2, metalHi);
    mainBuf.set(hx - 8, hy - 15, metal);
    mainBuf.set(hx + 8, hy - 15, metal);
    mainBuf.rect(hx - 4, hy - 16, 7, 1, '#ffffff');
  } else if (headgear === 'horns') {
    for (const side of [-1, 1] as const) {
      mainBuf.thickLine(hx + side * 6, hy - 9, hx + side * 9, hy - 16, metal, metalHi);
      mainBuf.set(hx + side * 9, hy - 17, '#ffffff');
    }
  } else if (headgear === 'antlers') {
    for (const side of [-1, 1] as const) {
      mainBuf.thickLine(hx + side * 5, hy - 9, hx + side * 11, hy - 17, metal, accHi);
      mainBuf.line(hx + side * 8, hy - 12, hx + side * 7, hy - 17, metalHi);
      mainBuf.line(hx + side * 9, hy - 14, hx + side * 13, hy - 15, accHi);
    }
  } else if (headgear === 'kitsune_ears') {
    for (const side of [-1, 1] as const) {
      const ex = hx + side * 6 - (side < 0 ? 2 : 0);
      mainBuf.rect(ex, hy - 15, 4, 6, hairMain);
      mainBuf.rect(ex + 1, hy - 17, 2, 2, hairHi);
      mainBuf.rect(ex + 1, hy - 13, 2, 3, accHi);
    }
  } else if (headgear === 'witch_hat') {
    mainBuf.rect(hx - 12, hy - 9, 25, 3, cloakDark);
    mainBuf.rect(hx - 7, hy - 13, 15, 4, cloakMid);
    mainBuf.rect(hx - 4, hy - 17, 9, 4, cloakMid);
    mainBuf.thickLine(hx, hy - 17, hx + 5, hy - 20, cloakMid, cloakHi);
    mainBuf.rect(hx - 7, hy - 10, 15, 2, metalHi);
  } else if (headgear === 'valkyrie_wings') {
    for (const side of [-1, 1] as const) {
      mainBuf.thickLine(hx + side * 7, hy - 6, hx + side * 12, hy - 13, metalHi, '#ffffff');
      mainBuf.line(hx + side * 7, hy - 4, hx + side * 11, hy - 9, metalHi);
    }
  } else if (headgear === 'kabuto') {
    mainBuf.rect(hx - 9, hy - 11, 19, 5, cloakDark);
    mainBuf.rect(hx - 8, hy - 10, 17, 2, cloakMid);
    mainBuf.thickLine(hx - 5, hy - 12, hx, hy - 17, metal, metalHi);
    mainBuf.thickLine(hx + 5, hy - 12, hx, hy - 17, metal, metalHi);
    mainBuf.rect(hx - 1, hy - 16, 3, 2, '#ffffff');
  } else if (headgear === 'goggles') {
    mainBuf.rect(hx - 8, hy - 10, 17, 3, metal);
    mainBuf.rect(hx - 5, hy - 10, 4, 3, accHi);
    mainBuf.rect(hx + 2, hy - 10, 4, 3, accHi);
    mainBuf.set(hx - 5, hy - 10, '#ffffff');
    mainBuf.set(hx + 2, hy - 10, '#ffffff');
  } else if (headgear === 'flower_crown') {
    mainBuf.rect(hx - 6, hy - 11, 13, 2, '#4df0c0');
    mainBuf.disc(hx - 5, hy - 12, 1.5, acc);
    mainBuf.disc(hx, hy - 12, 1.8, accHi);
    mainBuf.disc(hx + 5, hy - 12, 1.5, acc);
  } else if (headgear === 'jester_cap') {
    mainBuf.thickLine(hx - 3, hy - 10, hx - 11, hy - 16, cloakMid, cloakHi);
    mainBuf.thickLine(hx + 3, hy - 10, hx + 11, hy - 16, acc, accHi);
    mainBuf.disc(hx - 11, hy - 16, 1.5, metalHi);
    mainBuf.disc(hx + 11, hy - 16, 1.5, metalHi);
  }

  // ==========================================================================
  // 4. FRONT ARM + DETAILED WEAPONRY + BESPOKE FLOATING SIGNATURE FX
  // ==========================================================================
  const fArmX = bx + 5;
  const fArmY = shoulderY + 2;
  const handX = fArmX + Math.round(Math.sin(-pose.frontArmAngle) * 8);
  const handY = fArmY + Math.round(Math.cos(-pose.frontArmAngle) * 8);
  mainBuf.thickLine(fArmX, fArmY, handX, handY, cloakMid, cloakHi);
  mainBuf.rect(handX - 1, handY - 1, 3, 3, skinCol);

  if (prof.weapon === 'shield') {
    const shX = handX + 1;
    const shY = handY - 5;
    mainBuf.rect(shX, shY, 7, 11, metal);
    mainBuf.rect(shX + 1, shY + 1, 5, 9, cloakMid);
    mainBuf.rect(shX + 2, shY + 4, 3, 3, accHi);
    mainBuf.set(shX + 3, shY + 5, '#ffffff');
  } else if (prof.weapon === 'orb' || prof.weapon === 'astrolabe' || prof.weapon === 'grimoire') {
    const ox = handX + 5;
    const oy = handY - 3;
    if (prof.weapon === 'grimoire') {
      mainBuf.rect(ox - 2, oy - 4, 7, 8, cloakDark);
      mainBuf.rect(ox - 1, oy - 3, 5, 6, '#f8fafc');
      mainBuf.rect(ox, oy - 1, 3, 2, accHi);
      fxBuf.set(ox + 1, oy - 5 - (pose.floatPhase % 2), '#ffffff', false);
    } else {
      mainBuf.disc(ox, oy, 3.2, metalHi);
      mainBuf.disc(ox, oy, 2.1, acc);
      mainBuf.set(ox - 1, oy - 1, '#ffffff');
      if (prof.weapon === 'astrolabe') {
        fxBuf.rect(ox - 5, oy, 11, 1, metalHi, false);
        fxBuf.rect(ox, oy - 5, 1, 11, metalHi, false);
      }
    }
  } else if (prof.weapon === 'twin_daggers') {
    const dxTip = handX + (weaponInHandFront ? 8 : 5);
    const dyTip = handY + (weaponInHandFront ? -6 : 3);
    mainBuf.thickLine(handX, handY, dxTip, dyTip, '#e2e8f0', '#ffffff');
    mainBuf.set(dxTip, dyTip, accHi);
    // Matching off-hand dagger
    mainBuf.thickLine(bArmEndX, bArmEndY, bArmEndX - 5, bArmEndY + 3, '#cbd5e1', '#ffffff');
  } else if (prof.weapon === 'bow' && weaponInHandFront) {
    const bxTip = handX + 6;
    mainBuf.thickLine(bxTip - 2, handY - 7, bxTip + 2, handY, metal, metalHi);
    mainBuf.thickLine(bxTip + 2, handY, bxTip - 2, handY + 7, metal, metalHi);
    mainBuf.line(bxTip - 2, handY - 6, bxTip - 2, handY + 6, '#e2e8f0');
    fxBuf.line(handX, handY, bxTip + 7, handY, accHi, false);
  } else if (weaponInHandFront) {
    const ang = pose.weaponSwingAngle;
    const wLen =
      prof.weapon === 'greatsword' || prof.weapon === 'scythe' || prof.weapon === 'spear' || prof.weapon === 'halberd'
        ? 18
        : 14;
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
      mainBuf.line(handX, handY - 2, tipX, tipY - 2, accHi);
      mainBuf.rect(handX - 1, handY - 2, 4, 4, metalHi);
    }
    if (prof.weapon === 'staff' || prof.weapon === 'scepter') {
      mainBuf.disc(tipX, tipY, 3, acc);
      mainBuf.set(tipX - 1, tipY - 1, '#ffffff');
    } else if (prof.weapon === 'scythe') {
      mainBuf.thickLine(tipX, tipY, tipX - 5, tipY + 6, acc, accHi);
    } else if (prof.weapon === 'hammer') {
      mainBuf.rect(tipX - 4, tipY - 3, 8, 6, metalHi);
      mainBuf.rect(tipX - 3, tipY - 2, 6, 4, acc);
    }
  }

  // ==========================================================================
  // 5. BESPOKE 48-HERO SIGNATURES & ACTION VFX (ORBS, GEARS, RUNES, SLASHES)
  // ==========================================================================
  const bob = pose.floatPhase % 2 === 0 ? 0 : 1;
  const sig = prof.signature;
  if (sig === 'chrono_gear') {
    fxBuf.disc(bx + 15, hy - 5 + bob, 2.5, metalHi, false);
    fxBuf.set(bx + 15, hy - 5 + bob, '#0b0817', false);
    fxBuf.set(bx + 15, hy - 9 + bob, accHi, false);
    fxBuf.set(bx + 18, hy - 5 + bob, accHi, false);
  } else if (sig === 'orbit_planet' || sig === 'star_crown') {
    fxBuf.disc(bx - 14, hy - 7 + bob, 2.4, accHi, false);
    fxBuf.line(bx - 18, hy - 6 + bob, bx - 10, hy - 8 + bob, '#ffffff', false);
    fxBuf.set(bx + 13, hy - 10 - bob, metalHi, false);
  } else if (sig === 'prism_shards' || sig === 'ice_shards' || sig === 'glacier_horns') {
    fxBuf.rect(bx + 14, shoulderY - 3 + bob, 2, 5, accHi, false);
    fxBuf.set(bx + 14, shoulderY - 4 + bob, '#ffffff', false);
    fxBuf.rect(bx - 15, shoulderY + bob, 2, 4, '#ffffff', false);
  } else if (sig === 'sakura_petals' || sig === 'forest_leaves' || sig === 'faerie_dust' || sig === 'floral_vines') {
    fxBuf.rect(bx + 13, hy + bob, 2, 2, accHi, false);
    fxBuf.set(bx + 15, hy + 2 + bob, '#ffffff', false);
    fxBuf.rect(bx - 14, shoulderY + 3 - bob, 2, 2, acc, false);
  } else if (sig === 'soul_lantern' || sig === 'void_rift' || sig === 'plague_censer') {
    fxBuf.rect(bx + 13, shoulderY + bob, 3, 5, metalDark, false);
    fxBuf.disc(bx + 14, shoulderY + 2 + bob, 1.8, accHi, false);
    fxBuf.set(bx + 14, shoulderY + 1 + bob, '#ffffff', false);
  } else if (sig === 'music_notes' || sig === 'spirit_bells') {
    fxBuf.rect(bx + 14, hy - 4 + bob, 2, 4, accHi, false);
    fxBuf.set(bx + 15, hy - 4 + bob, '#ffffff', false);
    fxBuf.disc(bx - 13, hy - 2 - bob, 1.4, metalHi, false);
  } else if (sig === 'wind_whirl' || sig === 'silk_ribbons') {
    fxBuf.line(bx - 13, waistY - 2 + bob, bx - 17, waistY - 6 + bob, accHi, false);
    fxBuf.line(bx + 12, shoulderY + 2 - bob, bx + 16, shoulderY - 2 - bob, '#ffffff', false);
  } else if (sig === 'shadow_wisps' || sig === 'blood_sigil' || sig === 'raven_feathers') {
    fxBuf.disc(bx + 13, shoulderY + 2 + bob, 1.6, acc, false);
    fxBuf.rect(bx - 15, waistY - 2 - bob, 2, 3, cloakDark, false);
    fxBuf.set(bx - 15, waistY - 2 - bob, accHi, false);
  } else if (sig === 'forge_embers' || sig === 'sun_rays' || sig === 'sun_ankh' || sig === 'plasma_exhaust') {
    fxBuf.rect(bx + 13, hy - 2 - bob, 2, 2, '#ffe066', false);
    fxBuf.set(bx + 15, hy - 6 - bob, '#ffffff', false);
    fxBuf.rect(bx - 14, shoulderY + bob, 2, 2, accHi, false);
  } else if (sig === 'seraph_feathers' || sig === 'valkyrie_plume' || sig === 'paladin_aura' || sig === 'aether_halo') {
    fxBuf.rect(bx + 14, hy - 4 + bob, 2, 3, '#ffffff', false);
    fxBuf.rect(bx - 14, shoulderY + 2 - bob, 2, 3, accHi, false);
  } else if (sig === 'arc_sparks' || sig === 'storm_halo') {
    fxBuf.line(bx + 12, hy - 5 + bob, bx + 15, hy - 2 + bob, '#ffffff', false);
    fxBuf.line(bx + 15, hy - 2 + bob, bx + 13, hy + 1 + bob, accHi, false);
  } else if (sig === 'lunar_crescent') {
    fxBuf.rect(bx + 13, hy - 7 + bob, 3, 5, accHi, false);
    fxBuf.rect(bx + 12, hy - 6 + bob, 2, 3, '#0b0817', false);
  } else if (sig === 'water_droplets') {
    fxBuf.rect(bx + 13, shoulderY - 1 + bob, 2, 3, accHi, false);
    fxBuf.set(bx + 13, shoulderY - 2 + bob, '#ffffff', false);
  } else if (sig === 'bastion_crest' || sig === 'stone_runes' || sig === 'frost_braids') {
    fxBuf.rect(bx + 13, shoulderY + bob, 3, 3, metalHi, false);
    fxBuf.set(bx + 14, shoulderY + 1 + bob, accHi, false);
  } else if (sig === 'jester_bells') {
    fxBuf.disc(bx + 14, shoulderY + bob, 1.5, '#ffe066', false);
    fxBuf.disc(bx - 14, shoulderY - 2 - bob, 1.5, accHi, false);
  }

  if (pose.dashStreak) {
    fxBuf.thickLine(bx - 9, shoulderY + 1, bx - 22, shoulderY + 1, accHi, '#ffffff', false);
    fxBuf.thickLine(bx - 8, shoulderY + 7, bx - 24, shoulderY + 7, acc, '#ffffff', false);
    fxBuf.line(bx - 10, waistY + 4, bx - 20, waistY + 4, acc, false);
  }
  if (pose.slashPhase >= 1 && pose.slashPhase <= 2) {
    const sx = bx + 13;
    const sy = shoulderY + 4;
    fxBuf.thickLine(sx - 3, sy - 10, sx + 7, sy, '#ffffff', '#ffffff', false);
    fxBuf.thickLine(sx + 7, sy, sx - 2, sy + 10, '#ffffff', '#ffffff', false);
    fxBuf.line(sx - 5, sy - 8, sx + 5, sy, accHi, false);
    fxBuf.line(sx + 5, sy, sx - 4, sy + 8, accHi, false);
  }
  if (pose.swimBubbles) {
    const by = 10 + (frameIdx % 2) * 4;
    fxBuf.disc(hx + 11, by, 1.5, '#a8f5ff', false);
    fxBuf.set(hx + 14, by - 6, '#ffffff', false);
  }
  if (anim === 'victory') {
    const sp = frameIdx % 2;
    fxBuf.rect(7 + sp * 2, 9, 2, 2, accHi, false);
    fxBuf.rect(46 - sp * 2, 12, 2, 2, '#ffe066', false);
    fxBuf.rect(44, 26 - sp * 2, 2, 2, '#ffffff', false);
  }

  // ==========================================================================
  // 6. FLUSH ALL LAYERS TO BAKE CANVAS
  // ==========================================================================
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, BAKE_W, BAKE_H);
  flushBufWithOutline(ctx, backBuf, outline);
  flushBufWithOutline(ctx, mainBuf, outline);
  flushBufWithOutline(ctx, fxBuf, outline);
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
  const key = `px56_${heroId}_${skinId}_${anim}_${safeFrame}_${dashKey}_${lowStaminaFlash ? 'w' : 'n'}`;
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
  targetWorldH = 26
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
  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale((flipX ? -1 : 1) * scaleX, scaleY);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, -targetW * 0.5, -targetWorldH, targetW, targetWorldH);
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
    // Integer pixel bust crop focusing on face, headgear, collar & upper weapon on 56x64 grid
    const srcW = 36;
    const srcH = 40;
    const srcX = 10;
    const srcY = 4;
    const bob = Math.round(Math.sin(time * 2.4) * 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, srcX, srcY, srcW, srcH, 4, 4 + bob, width - 8, height - 4);
  }
}
