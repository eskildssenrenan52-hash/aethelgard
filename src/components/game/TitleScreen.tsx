// @ts-nocheck -- UI module
import React, { useState } from 'react';
import type { HeroDef } from '../../game/heroes';
import { HEROES } from '../../game/heroes';
import type { PlayModeDef } from '../../game/modes';
import { ChapterDef, HudSnapshot } from '../../game/types';
import { CHAPTERS } from '../../game/worldData';
import { UNDERWORLD_CHAPTERS } from '../../game/worldDataUnderworld';
import { HeroSpritePreview } from './HeroSelectModal';
import { PixelButton, PixelIcon } from './PixelUi';

interface TitleScreenProps {
  hud: HudSnapshot;
  activeHero: HeroDef;
  activeModeDef: PlayModeDef;
  titleChapter: ChapterDef;
  titlePassProg: { level: number; progress: number };
  titleAura: { name: string; primaryColor: string };
  hasSavedProgress: boolean;
  gamepadName: string | null;
  onStart: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onStartPlayMode: (mode: 'underworld' | 'campaign' | 'sandbox_world') => void;
  onOpenOverlay: (
    overlay:
      | 'map'
      | 'modes'
      | 'heroes'
      | 'forge'
      | 'pets'
      | 'sanctuary'
      | 'quests'
      | 'pass'
      | 'blessings'
      | 'compendium'
      | 'chronicles',
    forgeTab?: 'equipment' | 'crafting' | 'evolution'
  ) => void;
  onToggleMute: () => void;
  onRestartFull: () => void;
  cloudUserEmail?: string | null;
  onCloudSignIn?: () => void;
  onCloudSignOut?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hud,
  activeHero,
  activeModeDef,
  titleChapter,
  titlePassProg,
  hasSavedProgress,
  gamepadName,
  onStart,
  onStartPlayMode,
  onOpenOverlay,
  onToggleMute,
  onRestartFull,
  cloudUserEmail,
  onCloudSignIn,
  onCloudSignOut,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryStartLabel = hud.isUnderworld
    ? `Continuar Círculo ${hud.chapterIndex + 1}`
    : hasSavedProgress
      ? `Continuar Fase ${hud.chapterIndex + 1}`
      : 'Iniciar Campanha';

  return (
    <div
      data-testid="title-screen"
      className="pixel-scroll fixed inset-0 z-20 flex h-[100dvh] flex-col justify-between gap-3 overflow-y-auto bg-gradient-to-r from-[#07050ee3] via-[#07050e77] to-transparent p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6 pointer-events-auto"
    >
      {/* Minimal Top Bar */}
      <div className="flex w-full items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 border-2 border-[#07050d] bg-[#100c1be0] px-2.5 py-1 shadow-[0_3px_0_0_#07050d]">
          <span
            style={{ backgroundColor: hud.isUnderworld ? '#ff2e63' : activeHero.accentColor }}
            className="inline-block h-2 w-2 shrink-0 border border-[#07050d]"
          />
          <span className="font-mono-num text-[11px] font-bold text-[#ffd27d]">
            {hud.isUnderworld
              ? `Círculo ${(hud.chapterIndex ?? 0) + 1}/${UNDERWORLD_CHAPTERS.length}`
              : `Fase ${(hud.chapterIndex ?? 0) + 1}/${CHAPTERS.length}`}
          </span>
          <span className="hidden sm:inline font-pixel text-xs text-[#f5efe6]">
            · {titleChapter.name}
          </span>
          {hud.playMode !== 'campaign' && (
            <span className="border border-[#07050d] bg-[#1d1430] px-1.5 py-0 font-pixel text-[10px] text-[#52e5ff]">
              {activeModeDef.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {cloudUserEmail ? (
            <div className="flex items-center gap-1.5 border-2 border-[#07050d] bg-[#0e1e1ce6] px-2 py-1 text-[10px] shadow-[0_3px_0_0_#07050d]">
              <PixelIcon name="star" className="h-3 w-3 text-[#4df0c0]" />
              <span className="hidden sm:inline max-w-[140px] truncate font-mono-num font-bold text-[#4df0c0]" title={cloudUserEmail}>
                {cloudUserEmail}
              </span>
              {onCloudSignOut && (
                <button
                  type="button"
                  onClick={onCloudSignOut}
                  className="border border-[#07050d] bg-[#2a1723] px-1.5 py-0 font-pixel text-[9px] text-[#ff9bb0] hover:bg-[#3f2033]"
                >
                  Sair
                </button>
              )}
            </div>
          ) : (
            onCloudSignIn && (
              <PixelButton
                type="button"
                variant="emerald"
                data-testid="cloud-signin-btn"
                onClick={onCloudSignIn}
                className="!px-2.5 !py-1 text-xs"
              >
                <PixelIcon name="star" className="h-3.5 w-3.5 text-[#8effdb]" />
                <span>Nuvem</span>
              </PixelButton>
            )
          )}

          <PixelButton
            type="button"
            variant="slate"
            onClick={onToggleMute}
            aria-label={hud.muted ? 'Ativar Áudio' : 'Silenciar Áudio'}
            className="!px-2.5 !py-1 text-xs"
          >
            <PixelIcon
              name={hud.muted ? 'sound_off' : 'sound_on'}
              className={`h-4 w-4 ${hud.muted ? 'text-[#ff708d]' : 'text-[#4df0c0]'}`}
            />
            <span className="hidden sm:inline font-mono-num text-[11px]">N</span>
          </PixelButton>
        </div>
      </div>

      {/* Left-Aligned Clean Celeste-Inspired Command Stack (Leaves >70% Canvas Open) */}
      <div className="my-auto flex w-full max-w-[400px] flex-col gap-2.5 sm:gap-3 [@media(max-height:480px)]:my-1 [@media(max-height:480px)]:gap-2 pointer-events-auto">
        {/* Pixel Crest Title */}
        <svg
          viewBox="0 0 430 74"
          shapeRendering="crispEdges"
          className="w-full max-w-[380px] drop-shadow-[0_5px_0_#07050d]"
          role="img"
          aria-label="Aethelgard: Abismo de Cinzas"
        >
          <rect x="24" y="2" width="6" height="4" fill="#a8f5ff" />
          <rect x="21" y="6" width="12" height="6" fill="#52e5ff" />
          <rect x="19" y="10" width="16" height="5" fill="#2cb7db" />
          <rect x="24" y="7" width="5" height="4" fill="#ffffff" />
          <rect x="22" y="21" width="10" height="7" fill="#f2cbb0" />
          <rect x="17" y="28" width="20" height="11" fill="#e8a87c" />
          <rect x="13" y="39" width="28" height="13" fill="#b87148" />
          <rect x="9" y="52" width="36" height="11" fill="#7d4930" />
          <rect x="21" y="41" width="12" height="22" fill="#07050d" />
          <rect x="25" y="47" width="4" height="14" fill="#ff2e63" />
          <rect x="26" y="50" width="2" height="9" fill="#ffe066" />
          <rect x="6" y="65" width="42" height="3" fill="#ffd27d" />

          <text
            x="60"
            y="42"
            fill="#07050d"
            fontFamily="Pixelify Sans, monospace"
            fontWeight="700"
            fontSize="38"
            letterSpacing="2"
          >
            AETHELGARD
          </text>
          <text
            x="58"
            y="39"
            fill="#f5efe6"
            fontFamily="Pixelify Sans, monospace"
            fontWeight="700"
            fontSize="38"
            letterSpacing="2"
          >
            AETHELGARD
          </text>
          <rect x="58" y="47" width="176" height="2" fill="#52e5ff" />
          <rect x="238" y="45" width="6" height="6" fill="#ffd27d" />
          <rect x="248" y="47" width="144" height="2" fill="#ff2e63" />
          <text
            x="58"
            y="64"
            fill="#ffd27d"
            fontFamily="Pixelify Sans, monospace"
            fontWeight="700"
            fontSize="11.5"
            letterSpacing="1.6"
          >
            ABISMO DE CINZAS · {HEROES.length} HERÓIS
          </text>
        </svg>

        {/* Active Hero Compact Card */}
        <button
          type="button"
          data-testid="open-heroes-btn"
          onClick={() => onOpenOverlay('heroes')}
          className="group flex items-center justify-between gap-3 border-2 border-[#07050d] bg-[#100c1be8] px-3 py-2 text-left shadow-[0_4px_0_0_#07050d] transition-transform hover:-translate-y-0.5 hover:border-[#ffd27d]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 border-2 border-[#07050d] bg-[#080512] p-0.5">
              <HeroSpritePreview
                hero={activeHero}
                skinId={hud.heroSkinId}
                sizeClass="h-12 w-12"
                animateRun={false}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span style={{ color: activeHero.accentColor }} className="font-pixel text-base font-bold leading-none text-stroke-dark">
                  {activeHero.name}
                </span>
                <span className="border border-[#07050d] bg-[#1d1533] px-1 py-0.5 font-mono-num text-[9px] text-[#ffd27d]">
                  H
                </span>
              </div>
              <div className="mt-0.5 truncate font-body-pixel text-xs text-[#cfc6e0]">
                {activeHero.archetype} · {activeHero.activeSkillName}
              </div>
            </div>
          </div>
          <span className="shrink-0 font-pixel text-xs font-bold text-[#ffd27d] group-hover:translate-x-0.5 transition-transform">
            Heróis ►
          </span>
        </button>

        {/* Primary Play Actions */}
        <div className="flex flex-col gap-2">
          <PixelButton
            type="button"
            variant="gold"
            data-start="true"
            onClick={onStart}
            className="w-full !justify-between px-4 py-3 text-base"
          >
            <span className="flex items-center gap-2.5">
              <PixelIcon name="play" className="h-5 w-5" />
              <span>{primaryStartLabel}</span>
            </span>
            <span className="border border-[#07050d] bg-[#1a1208] px-1.5 py-0.5 font-mono-num text-[10px] text-[#ffe066]">
              ENTER
            </span>
          </PixelButton>

          <div className="grid grid-cols-2 gap-2">
            <PixelButton
              type="button"
              variant="emerald"
              data-testid="start-sandbox-btn"
              onClick={() => onStartPlayMode('sandbox_world')}
              className="px-3 py-2 text-xs sm:text-sm"
            >
              <span>Mundo Aberto</span>
            </PixelButton>

            {hud.isUnderworld ? (
              <PixelButton
                type="button"
                variant="cyan"
                data-testid="start-underworld-btn"
                onClick={() => onStartPlayMode('campaign')}
                className="px-3 py-2 text-xs sm:text-sm"
              >
                <span>Superfície (50)</span>
              </PixelButton>
            ) : (
              <PixelButton
                type="button"
                variant="danger"
                data-testid="start-underworld-btn"
                onClick={() => onStartPlayMode('underworld')}
                className="px-3 py-2 text-xs sm:text-sm"
              >
                <span>Submundo (20)</span>
              </PixelButton>
            )}
          </div>
        </div>

        {/* Clean 4-Button Secondary Strip + Expandable Drawer */}
        <div className="grid grid-cols-4 gap-1.5">
          <PixelButton
            type="button"
            variant="slate"
            onClick={() => onOpenOverlay('map')}
            className="min-h-[38px] !px-1.5 py-1.5 text-[10px] sm:text-[11px]"
          >
            Fases
          </PixelButton>
          <PixelButton
            type="button"
            variant="slate"
            data-testid="open-modes-btn"
            onClick={() => onOpenOverlay('modes')}
            className="min-h-[38px] !px-1.5 py-1.5 text-[10px] sm:text-[11px]"
          >
            Modos
          </PixelButton>
          <PixelButton
            type="button"
            variant="slate"
            data-testid="open-forge-title-btn"
            onClick={() => onOpenOverlay('forge', 'equipment')}
            className="min-h-[38px] !px-1.5 py-1.5 text-[10px] sm:text-[11px]"
          >
            Forja
          </PixelButton>
          <PixelButton
            type="button"
            variant={moreOpen ? 'cyan' : 'slate'}
            data-testid="title-more-btn"
            onClick={() => setMoreOpen((v) => !v)}
            className="min-h-[38px] !px-1.5 py-1.5 text-[10px] sm:text-[11px]"
          >
            {moreOpen ? 'Menos ▴' : 'Mais ▾'}
          </PixelButton>
        </div>

        {moreOpen && (
          <div className="grid grid-cols-3 gap-1.5 border-2 border-[#07050d] bg-[#100c1bf0] p-2 shadow-[0_6px_0_0_#07050d]">
            <PixelButton
              type="button"
              variant="slate"
              data-testid="open-pets-title-btn"
              onClick={() => onOpenOverlay('pets')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Pets [Y]
            </PixelButton>
            <PixelButton
              type="button"
              variant="slate"
              data-testid="open-sanctuary-title-btn"
              onClick={() => onOpenOverlay('sanctuary')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Santuário [G]
            </PixelButton>
            <PixelButton
              type="button"
              variant="slate"
              data-testid="open-quests-title-btn"
              onClick={() => onOpenOverlay('quests')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Missões [O]
            </PixelButton>
            <PixelButton
              type="button"
              variant="slate"
              data-testid="open-pass-title-btn"
              onClick={() => onOpenOverlay('pass')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Passe Nv.{titlePassProg.level}
            </PixelButton>
            <PixelButton
              type="button"
              variant="slate"
              onClick={() => onOpenOverlay('blessings')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Bênçãos [B]
            </PixelButton>
            <PixelButton
              type="button"
              variant="slate"
              onClick={() => onOpenOverlay('compendium')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Compêndio
            </PixelButton>
            <PixelButton
              type="button"
              variant="slate"
              onClick={() => onOpenOverlay('chronicles')}
              className="!px-2 py-1.5 text-[11px]"
            >
              Crônicas
            </PixelButton>
            {hasSavedProgress && (
              <PixelButton
                type="button"
                variant="danger"
                onClick={onRestartFull}
                className="col-span-2 !px-2 py-1.5 text-[11px]"
              >
                Nova Run (Zerar Fase)
              </PixelButton>
            )}
          </div>
        )}
      </div>

      {/* Minimal Bottom Hint */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="hidden sm:block font-pixel text-[11px] tracking-wide text-[#c7bddb] text-stroke-dark">
          WASD/Setas Mover · Espaço Pular · X Dash · C Escalar · Q Poder · Esc Pausa
        </p>
        <p className="sm:hidden font-pixel text-[10px] tracking-wide text-[#c7bddb] text-stroke-dark">
          Touch Multi-Toque: Joystick + Pular/Dash/Escalar/Poder simultâneos
        </p>
        {gamepadName && (
          <span className="border-2 border-[#07050d] bg-[#1a5c49] px-2 py-0.5 font-pixel text-[10px] font-bold text-[#8effdb]">
            JOYSTICK ATIVO
          </span>
        )}
      </div>
    </div>
  );
};
