// @ts-nocheck -- imported game code, written for a looser TS config
import React, { useEffect, useRef } from 'react';
import { getHeroDef, getHeroSkinDef, HeroId } from '../../game/heroes';
import {
  drawHeroStudioPortraitBust,
  drawHeroStudioSprite,
} from '../../game/heroArtRenderer';
import {
  drawHeroEvolutionBackLayers,
  drawHeroEvolutionFrontLayers,
} from '../../game/heroEvolutionRenderer';
import { HERO_ANIM_FRAME_COUNTS, type HeroAnimKey } from '../../game/sprites';
import { colorWithAlpha } from '../../game/visualFx';

interface HeroPortraitProps {
  heroId: HeroId;
  skinId?: string;
  size?: number;
  animate?: boolean;
  evolutionTier?: number;
  className?: string;
}

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  heroId,
  skinId = 'default',
  size = 64,
  animate = false,
  evolutionTier = 0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    let lastDraw = 0;
    const render = (now = 0) => {
      if (animate && lastDraw !== 0 && now - lastDraw < 70) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;
      t += 0.08;
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const W = c.width;
        const H = c.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        drawHeroStudioPortraitBust(ctx, heroId, skinId, W, H, animate ? t : 0.35);

        const auraColor = evolutionTier >= 3 ? '#ffe066' : skin.badgeColor;
        // Crisp pixel frame bevel & corner brackets
        ctx.strokeStyle = colorWithAlpha(auraColor, 0.72);
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, W - 4, H - 4);

        ctx.fillStyle = colorWithAlpha(auraColor, 0.92);
        ctx.fillRect(5, 5, 10, 2);
        ctx.fillRect(5, 5, 2, 10);
        ctx.fillRect(W - 15, 5, 10, 2);
        ctx.fillRect(W - 7, 5, 2, 10);

        if (evolutionTier >= 1) {
          ctx.fillStyle = '#090712';
          ctx.fillRect(Math.floor(W * 0.5) - 16, 4, 32, 9);
          ctx.fillStyle = auraColor;
          ctx.fillRect(Math.floor(W * 0.5) - 14, 5, 28, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.floor(W * 0.5) - 6, 6, 12, 2);
        }
      }
      if (animate) {
        raf = requestAnimationFrame(render);
      }
    };
    render();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroId, skinId, animate, evolutionTier, hero.modifiers.baseDashes, skin]);

  return (
    <canvas
      ref={canvasRef}
      width={144}
      height={144}
      style={{ width: size, height: size }}
      className={`pixel-canvas block border-2 border-[#07050d] bg-[#080512] ${className}`}
    />
  );
};

export const HeroFullSpriteCanvas: React.FC<{
  heroId: HeroId;
  skinId?: string;
  evolutionTier?: number;
  size?: number;
  anim?: HeroAnimKey;
}> = ({ heroId, skinId = 'default', evolutionTier = 0, size = 128, anim = 'idle' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    let lastDraw = 0;
    const render = (now = 0) => {
      if (lastDraw !== 0 && now - lastDraw < 75) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;
      t += 0.08;
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        // 72x72 logical space * 4 = 288x288 integer pixels -> 1:1 native texel mapping for 56x64 sprite!
        const V = 72;
        const scale = c.width / V;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, V, V);

        const evoColor =
          evolutionTier >= 3
            ? '#ffe066'
            : evolutionTier >= 2
              ? hero.accentColor
              : skin.badgeColor;

        // Crisp stepped pixel aura backdrop
        ctx.fillStyle = colorWithAlpha(evoColor, evolutionTier >= 1 ? 0.14 : 0.1);
        ctx.fillRect(10, 6, 52, 56);
        ctx.fillStyle = colorWithAlpha(evoColor, evolutionTier >= 1 ? 0.2 : 0.14);
        ctx.fillRect(18, 14, 36, 42);

        // Stepped Pixel Pedestal
        ctx.fillStyle = '#07050d';
        ctx.fillRect(16, 62, 40, 6);
        ctx.fillStyle = '#241a3f';
        ctx.fillRect(18, 63, 36, 4);
        ctx.fillStyle = colorWithAlpha(evoColor, 0.85);
        ctx.fillRect(20, 63, 32, 1);

        const feetY = 64;
        const heroWorldH = 64;
        const headTopY = feetY - heroWorldH;
        const fpsSpeed = anim === 'dash' || anim === 'skill' ? 5.2 : anim === 'run' || anim === 'victory' ? 4.4 : 2.6;
        const frameCount = HERO_ANIM_FRAME_COUNTS[anim] ?? 4;
        const frameIdx = Math.floor(t * fpsSpeed) % frameCount;

        drawHeroEvolutionBackLayers(ctx, {
          heroId,
          tier: evolutionTier,
          time: t,
          cx: 36,
          cy: feetY - heroWorldH * 0.45,
          headTopY,
          feetY,
          facing: 1,
          scale: 1.5,
        });

        drawHeroStudioSprite(
          ctx,
          heroId,
          skinId,
          anim,
          frameIdx,
          hero.modifiers.baseDashes,
          false,
          false,
          36,
          feetY,
          false,
          1,
          1,
          heroWorldH
        );

        drawHeroEvolutionFrontLayers(ctx, {
          heroId,
          tier: evolutionTier,
          time: t,
          cx: 36,
          cy: feetY - heroWorldH * 0.45,
          headTopY,
          feetY,
          facing: 1,
          scale: 1.5,
        });
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroId, skinId, evolutionTier, anim, hero.modifiers.baseDashes, hero.accentColor, skin]);

  return (
    <canvas
      ref={canvasRef}
      width={288}
      height={288}
      style={{ width: size, height: size }}
      className="pixel-canvas block"
    />
  );
};
