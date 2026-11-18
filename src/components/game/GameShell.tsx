// @ts-nocheck -- imported game code, written for a looser TS config
// @ts-nocheck — imported game code, typed under the original looser tsconfig
import React, { useEffect, useRef, useState } from 'react';
import { gameAudio } from '../../game/audio';
import { LORE_CODEX } from '../../game/cutscenes';
import { GameEngine } from '../../game/engine';
import { pollPrimaryGamepad, triggerGamepadRumble } from '../../game/gamepad';
import { getHeroDef } from '../../game/heroes';
import { TOTAL_MECHANICS } from '../../game/mechanicsCatalog';
import { BOSS_ORDER, getPlayModeDef } from '../../game/modes';
import { AURA_TRAIL_MAP, getPassProgressFromXp } from '../../game/passAndRewards';
import { PixelRenderer } from '../../game/renderer';
import {
  BOON_MAP,
  decodeVirtualJoystick,
  ELEMENT_META,
} from '../../game/systems';
import {
  HudSnapshot,
  InputState,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
} from '../../game/types';
import { CHAPTERS } from '../../game/worldData';
import { UNDERWORLD_CHAPTERS } from '../../game/worldDataUnderworld';
import { BlessingShopModal } from './BlessingShopModal';
import { ChroniclesModal } from './ChroniclesModal';
import { CompendiumModal } from './CompendiumModal';
import { CutsceneOverlay } from './CutsceneOverlay';
import { DefeatModal } from './DefeatModal';
import { ForgeEquipmentModal } from './ForgeEquipmentModal';
import { HeroSelectModal } from './HeroSelectModal';
import { LoadoutSanctuaryModal } from './LoadoutSanctuaryModal';
import { ModeSelectModal } from './ModeSelectModal';
import { PauseModal } from './PauseModal';
import { PassAndRewardsModal } from './PassAndRewardsModal';
import { PetsModal } from './PetsModal';
import { PixelButton, PixelIcon, PixelWindow } from './PixelUi';
import { SandboxHudOverlay } from './SandboxHudOverlay';
import { SandboxWorldMapModal } from './SandboxWorldMapModal';
import { SideQuestsModal } from './SideQuestsModal';
import { StageSelectModal } from './StageSelectModal';
import { TitleScreen } from './TitleScreen';
import { VictoryModal } from './VictoryModal';
import { CinematicFX } from './CinematicFX';

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface GameShellProps {
  cloudUserEmail?: string | null;
  onCloudSignIn?: () => void;
  onCloudSignOut?: () => void;
  onEngineReady?: (engine: GameEngine | null) => void;
}

export const GameShell: React.FC<GameShellProps> = ({
  cloudUserEmail,
  onCloudSignIn,
  onCloudSignOut,
  onEngineReady,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bloomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const haloCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<PixelRenderer | null>(null);
  const staminaBarRef = useRef<HTMLDivElement | null>(null);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [overlay, setOverlay] = useState<
    | 'none'
    | 'map'
    | 'compendium'
    | 'heroes'
    | 'blessings'
    | 'chronicles'
    | 'modes'
    | 'sanctuary'
    | 'pass'
    | 'quests'
    | 'forge'
    | 'pets'
  >('none');
  const [forgeInitialTab, setForgeInitialTab] = useState<'equipment' | 'crafting' | 'evolution'>('equipment');
  const [showRadar, setShowRadar] = useState(true);
  const [showTouchControls, setShowTouchControls] = useState(() =>
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) || window.innerWidth <= 900)
  );
  const touchManualRef = useRef(false);
  const lastStaminaRef = useRef(-1);
  const [gamepadName, setGamepadName] = useState<string | null>(null);
  const [gamepadConfirmTick, setGamepadConfirmTick] = useState(0);
  const [gamepadSkipTick, setGamepadSkipTick] = useState(0);
  const prevGamepadConnectedRef = useRef<string | null>(null);

  const keysHeld = useRef<Set<string>>(new Set());
  const keysJustPressed = useRef<Set<string>>(new Set());
  const touchHeld = useRef<Record<string, boolean>>({});
  const touchJustPressed = useRef<Record<string, boolean>>({});
  const touchPointersRef = useRef<Map<number, string>>(new Map());
  const [activeTouchActions, setActiveTouchActions] = useState<Record<string, boolean>>({});
  const [grabLock, setGrabLock] = useState(false);
  const grabLockRef = useRef(false);
  const [sandboxTouchTool, setSandboxTouchTool] = useState<'mine' | 'place'>('mine');
  const sandboxTouchToolRef = useRef<'mine' | 'place'>('mine');
  const activeCanvasToolPointerRef = useRef<number | null>(null);
  const lastSandboxDragTileRef = useRef<string>('');
  const analogRef = useRef<{
    x: number;
    y: number;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }>({ x: 0, y: 0, left: false, right: false, up: false, down: false });
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyKnobRef = useRef<HTMLDivElement | null>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);

  const focusViewport = () => {
    viewportRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    grabLockRef.current = grabLock;
  }, [grabLock]);

  useEffect(() => {
    sandboxTouchToolRef.current = sandboxTouchTool;
  }, [sandboxTouchTool]);

  // Sync body.dataset.state cleanly
  useEffect(() => {
    if (hud) {
      document.body.dataset.state = hud.mode;
    }
  }, [hud?.mode]);

  // Keep mobile touch joystick responsive across viewport resizes
  useEffect(() => {
    const onResize = () => {
      if (touchManualRef.current) return;
      setShowTouchControls(('ontouchstart' in window) || window.innerWidth <= 900);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mount isolated simulation + render loop ONCE
  useEffect(() => {
    const engine = new GameEngine((snap) => {
      const activeEngine = engineRef.current;
      if (activeEngine?.openBlessingsRequested) {
        activeEngine.openBlessingsRequested = false;
        setOverlay('blessings');
      }
      setHud(snap);
      if (staminaBarRef.current && Math.abs(snap.staminaRatio - lastStaminaRef.current) > 0.002) {
        lastStaminaRef.current = snap.staminaRatio;
        staminaBarRef.current.style.transform = `scaleX(${snap.staminaRatio})`;
      }
    });
    engine.onRumble = triggerGamepadRumble;
    const renderer = new PixelRenderer();
    engineRef.current = engine;
    onEngineReady?.(engine);
    if (import.meta.env.DEV) (window as unknown as { __game?: GameEngine }).__game = engine;
    rendererRef.current = renderer;

    // Support ?autostart=1 without triggering autoplay AudioContext warning or cutscene modal
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.skipNextAutoCutscene = true;
      if (params.get('mode') === 'sandbox') {
        engine.startPlayMode('sandbox_world', false);
      } else {
        engine.startPlaying(false);
      }
      const previewVictory = params.get('previewVictory');
      const previewDefeat = params.get('previewDefeat');
      if (previewVictory === 'stage') {
        engine.mode = 'stage_clear';
        engine.emitHud();
      } else if (previewVictory === 'final') {
        engine.victory = true;
        engine.mode = 'gameover';
        engine.emitHud();
      } else if (previewDefeat === 'survival') {
        engine.startPlayMode('survival', true);
        engine.survivalWave = 7;
        engine.survivalKills = 42;
        engine.bestSurvivalWave = 7;
        engine.perfectDodges = 4;
        engine.totalParries = 2;
        engine.mode = 'gameover';
        engine.victory = false;
        engine.emitHud();
      } else if (previewDefeat === 'tower') {
        engine.startPlayMode('tower', true);
        engine.loadTowerFloor(6);
        engine.bestTowerFloor = 6;
        engine.perfectDodges = 5;
        engine.totalParries = 3;
        engine.mode = 'gameover';
        engine.victory = false;
        engine.emitHud();
      } else if (previewDefeat === 'boss') {
        engine.practiceBoss('boss_ignis_rex');
        const boss = engine.liveEntities.find((e) => e.def.kind === 'boss_ignis_rex');
        if (boss) {
          boss.hp = 4;
          boss.maxHp = 10;
        }
        engine.perfectDodges = 3;
        engine.totalParries = 1;
        engine.hardcoreGameOver = true;
        engine.mode = 'gameover';
        engine.victory = false;
        engine.emitHud();
      } else if (previewDefeat === '1') {
        engine.hardcoreGameOver = true;
        engine.mode = 'gameover';
        engine.victory = false;
        engine.emitHud();
      }
    } else {
      setHud(engine.getSnapshot());
    }

    const resolveGameTokens = (e: KeyboardEvent): string[] => {
      const tokens: string[] = [];
      if (e.code) tokens.push(e.code);
      const k = e.key?.toLowerCase();
      if (k === 'arrowleft' || k === 'a') tokens.push('MOVE_LEFT');
      if (k === 'arrowright' || k === 'd') tokens.push('MOVE_RIGHT');
      if (k === 'arrowup' || k === 'w') tokens.push('MOVE_UP');
      if (k === 'arrowdown' || k === 's') tokens.push('MOVE_DOWN');
      if (k === ' ' || k === 'z' || k === 'j') tokens.push('ACT_JUMP');
      if (k === 'x' || k === 'k' || k === 'shift') tokens.push('ACT_DASH');
      if (k === 'c' || k === 'l') tokens.push('ACT_GRAB');
      if (k === 'e' || k === 'enter') tokens.push('ACT_INTERACT');
      if (k === 'q') tokens.push('ACT_SKILL');
      if (k === 'f') tokens.push('ACT_SWAP');
      if (k === 'u') tokens.push('ACT_SOUL');
      return tokens;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      gameAudio.unlock();
      const code = e.code;
      const keyLow = e.key?.toLowerCase() ?? '';
      const tokens = resolveGameTokens(e);
      const isGameKey =
        code.startsWith('Arrow') ||
        keyLow.startsWith('arrow') ||
        tokens.length > 1 ||
        [
          'Space',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyZ',
          'KeyX',
          'KeyC',
          'KeyE',
          'KeyF',
          'KeyG',
          'KeyQ',
          'KeyU',
          'KeyB',
          'KeyJ',
          'KeyK',
          'KeyL',
          'ShiftLeft',
          'ShiftRight',
        ].includes(code);

      if (isGameKey && engine.mode === 'playing') {
        e.preventDefault();
      }

      for (const tok of tokens) {
        if (!keysHeld.current.has(tok)) {
          keysJustPressed.current.add(tok);
        }
        keysHeld.current.add(tok);
      }

      // Global shortcuts
      if (engine.mode === 'title' && (code === 'Enter' || code === 'Space' || keyLow === 'enter' || keyLow === ' ')) {
        e.preventDefault();
        setOverlay('none');
        engine.startPlaying();
        keysHeld.current.clear();
        keysJustPressed.current.clear();
        return;
      }

      if (code === 'Tab' && engine.mode === 'playing') {
        e.preventDefault();
        setShowRadar((v) => !v);
        return;
      }

      if (code === 'KeyT' && (engine.mode === 'playing' || engine.mode === 'paused')) {
        e.preventDefault();
        touchManualRef.current = true;
        setShowTouchControls((v) => !v);
        return;
      }

      if (code === 'Escape' || code === 'KeyP' || keyLow === 'escape') {
        e.preventDefault();
        if (engine.mode === 'playing') {
          engine.setPaused(true);
        } else if (engine.mode === 'paused') {
          setOverlay('none');
          engine.setPaused(false);
        } else if (engine.mode === 'title') {
          setOverlay('none');
        }
      } else if ((code === 'KeyM' || keyLow === 'm') && (engine.mode === 'playing' || engine.mode === 'paused')) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'map') {
            engine.setPaused(false);
            return 'none';
          }
          engine.setPaused(true);
          return 'map';
        });
      } else if (
        (code === 'KeyH' || keyLow === 'h') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'heroes') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'heroes';
        });
      } else if (
        (code === 'KeyB' || keyLow === 'b') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'blessings') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'blessings';
        });
      } else if (
        (code === 'KeyG' || keyLow === 'g') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'sanctuary') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'sanctuary';
        });
      } else if (
        (code === 'KeyV' || keyLow === 'v') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'pass') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'pass';
        });
      } else if (
        (code === 'KeyO' || keyLow === 'o') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'quests') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'quests';
        });
      } else if (
        (code === 'KeyI' || keyLow === 'i') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setForgeInitialTab('equipment');
        setOverlay((cur) => {
          if (cur === 'forge') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'forge';
        });
      } else if (
        (code === 'KeyY' || keyLow === 'y') &&
        (engine.mode === 'title' || engine.mode === 'playing' || engine.mode === 'paused')
      ) {
        e.preventDefault();
        setOverlay((cur) => {
          if (cur === 'pets') {
            if (engine.mode === 'paused') engine.setPaused(false);
            return 'none';
          }
          if (engine.mode === 'playing') engine.setPaused(true);
          return 'pets';
        });
      } else if (/^Digit[1-9]$/.test(code) && engine.playMode === 'sandbox_world' && engine.mode === 'playing') {
        e.preventDefault();
        const idx = Number(code.replace('Digit', '')) - 1;
        engine.selectSandboxSlot(idx);
      } else if (code === 'KeyN' || keyLow === 'n') {
        gameAudio.toggleMute();
        engine.emitHud();
      } else if ((code === 'KeyR' || keyLow === 'r') && engine.mode === 'playing') {
        engine.killPlayer(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const tokens = resolveGameTokens(e);
      for (const tok of tokens) {
        keysHeld.current.delete(tok);
      }
    };

    const clearInputs = () => {
      keysHeld.current.clear();
      keysJustPressed.current.clear();
      touchPointersRef.current.clear();
      touchHeld.current = {};
      touchJustPressed.current = {};
      setActiveTouchActions({});
      joyPointerIdRef.current = null;
      joyOriginRef.current = null;
      activeCanvasToolPointerRef.current = null;
      analogRef.current = { x: 0, y: 0, left: false, right: false, up: false, down: false };
      if (joyKnobRef.current) joyKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    };

    const onPointerDown = () => {
      gameAudio.unlock();
    };

    const onGlobalPointerEnd = (e: PointerEvent) => {
      if (joyPointerIdRef.current === e.pointerId) {
        joyPointerIdRef.current = null;
        joyOriginRef.current = null;
        analogRef.current = { x: 0, y: 0, left: false, right: false, up: false, down: false };
        if (joyKnobRef.current) joyKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
      if (activeCanvasToolPointerRef.current === e.pointerId) {
        activeCanvasToolPointerRef.current = null;
        lastSandboxDragTileRef.current = '';
      }
      if (touchPointersRef.current.delete(e.pointerId)) {
        const nextHeld: Record<string, boolean> = {};
        for (const act of touchPointersRef.current.values()) {
          nextHeld[act] = true;
        }
        touchHeld.current = nextHeld;
        setActiveTouchActions({ ...nextHeld });
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onGlobalPointerEnd);
    window.addEventListener('pointercancel', onGlobalPointerEnd);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);

    let rafId = 0;
    let lastTs = performance.now();
    let lastSlowRenderTs = 0;
    let skipRenderFrames = 0;
    let lastPausedModeRendered = false;

    const frame = (ts: number) => {
      const rawDt = Math.max(0, (ts - lastTs) / 1000);
      lastTs = ts;

      const pad = pollPrimaryGamepad();
      const activePadName = pad.connected ? pad.id : null;
      if (activePadName !== prevGamepadConnectedRef.current) {
        prevGamepadConnectedRef.current = activePadName;
        setGamepadName(activePadName);
      }
      if (pad.anyPressed) {
        gameAudio.unlock();
      }

      if (engine.activeCutscene) {
        if (pad.confirmJustPressed) setGamepadConfirmTick((c) => c + 1);
        if (pad.skipJustPressed) setGamepadSkipTick((c) => c + 1);
      } else {
        if (pad.pauseJustPressed) {
          if (engine.mode === 'playing') {
            engine.setPaused(true);
          } else if (engine.mode === 'paused') {
            setOverlay('none');
            engine.setPaused(false);
          }
        }
        if (pad.mapJustPressed && (engine.mode === 'playing' || engine.mode === 'paused')) {
          setOverlay((cur) => {
            if (cur === 'map') {
              engine.setPaused(false);
              return 'none';
            }
            engine.setPaused(true);
            return 'map';
          });
        }
        if (engine.mode === 'title' && pad.confirmJustPressed) {
          setOverlay((cur) => {
            if (cur === 'none') {
              engine.startPlaying();
            }
            return cur;
          });
        }
      }

      const held = keysHeld.current;
      const just = keysJustPressed.current;
      const th = touchHeld.current;
      const tj = touchJustPressed.current;
      const ana = analogRef.current;

      const input: InputState = {
        left: held.has('ArrowLeft') || held.has('KeyA') || held.has('MOVE_LEFT') || !!th.left || ana.left || pad.input.left,
        right: held.has('ArrowRight') || held.has('KeyD') || held.has('MOVE_RIGHT') || !!th.right || ana.right || pad.input.right,
        up: held.has('ArrowUp') || held.has('KeyW') || held.has('MOVE_UP') || !!th.up || ana.up || pad.input.up,
        down: held.has('ArrowDown') || held.has('KeyS') || held.has('MOVE_DOWN') || !!th.down || ana.down || pad.input.down,
        analogX: Math.abs(ana.x) > 0 ? ana.x : pad.input.analogX,
        analogY: Math.abs(ana.y) > 0 ? ana.y : pad.input.analogY,
        jumpHeld:
          held.has('Space') ||
          held.has('KeyZ') ||
          held.has('KeyJ') ||
          held.has('ACT_JUMP') ||
          !!th.jump ||
          pad.input.jumpHeld,
        jumpJustPressed:
          just.has('Space') ||
          just.has('KeyZ') ||
          just.has('KeyJ') ||
          just.has('ACT_JUMP') ||
          !!tj.jump ||
          pad.input.jumpJustPressed,
        dashJustPressed:
          just.has('KeyX') ||
          just.has('ShiftLeft') ||
          just.has('ShiftRight') ||
          just.has('KeyK') ||
          just.has('ACT_DASH') ||
          !!tj.dash ||
          pad.input.dashJustPressed,
        grabHeld:
          held.has('KeyC') ||
          held.has('KeyL') ||
          held.has('ACT_GRAB') ||
          !!th.grab ||
          grabLockRef.current ||
          pad.input.grabHeld,
        interactJustPressed:
          just.has('KeyE') ||
          just.has('Enter') ||
          just.has('ACT_INTERACT') ||
          !!tj.interact ||
          pad.input.interactJustPressed,
        skillJustPressed:
          just.has('KeyQ') ||
          just.has('ACT_SKILL') ||
          !!tj.skill ||
          Boolean(pad.input.skillJustPressed),
        swapJustPressed:
          just.has('KeyF') ||
          just.has('ACT_SWAP') ||
          !!tj.swap ||
          Boolean(pad.input.swapJustPressed),
        soulSlashJustPressed:
          just.has('KeyU') ||
          just.has('ACT_SOUL') ||
          !!tj.soul,
      };
      just.clear();
      touchJustPressed.current = {};

      engine.step(rawDt, input);

      const isPaused = engine.mode === 'paused';
      const isTitle = engine.mode === 'title';
      const isStaticMenu = isTitle || isPaused;
      if (!isPaused) {
        lastPausedModeRendered = false;
      }
      const shouldDrawFrame = isPaused
        ? !lastPausedModeRendered
        : isTitle
          ? ts - lastSlowRenderTs >= 250
          : skipRenderFrames > 0
            ? ((skipRenderFrames -= 1), false)
            : true;
      const canvas = canvasRef.current;
      if (canvas && shouldDrawFrame) {
        if (isPaused) {
          lastPausedModeRendered = true;
        }
        if (isTitle) {
          lastSlowRenderTs = ts;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const tRender0 = performance.now();
          renderer.render(ctx, engine, isStaticMenu ? 0.08 : Math.min(rawDt, 0.05));
          const renderMs = performance.now() - tRender0;
          if (!isStaticMenu && renderMs > 8) {
            skipRenderFrames = Math.min(3, Math.floor(renderMs / 8));
          }
          // Fast offscreen downsampled HDR bloom + wide halo composited cleanly during active gameplay
          if (engine.mode !== 'title' && renderMs < 8) {
            if (!bloomCanvasRef.current && typeof document !== 'undefined') {
              const bc = document.createElement('canvas');
              bc.width = Math.floor(VIRTUAL_WIDTH / 2);
              bc.height = Math.floor(VIRTUAL_HEIGHT / 2);
              bloomCanvasRef.current = bc;
            }
            if (!haloCanvasRef.current && typeof document !== 'undefined') {
              const hc = document.createElement('canvas');
              hc.width = 64;
              hc.height = 36;
              haloCanvasRef.current = hc;
            }
            const bloom = bloomCanvasRef.current;
            const halo = haloCanvasRef.current;
            const bctx = bloom?.getContext('2d');
            const hctx = halo?.getContext('2d');
            if (bloom && bctx && halo && hctx) {
              bctx.imageSmoothingEnabled = true;
              bctx.globalCompositeOperation = 'copy';
              bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
              hctx.imageSmoothingEnabled = true;
              hctx.globalCompositeOperation = 'copy';
              hctx.drawImage(bloom, 0, 0, halo.width, halo.height);

              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.imageSmoothingEnabled = true;
              ctx.globalCompositeOperation = 'screen';
              ctx.globalAlpha = 0.28;
              ctx.drawImage(bloom, 0, 0, canvas.width, canvas.height);
              ctx.globalAlpha = 0.18;
              ctx.drawImage(halo, 0, 0, canvas.width, canvas.height);
              ctx.restore();
            }
          }
        }
      }
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onGlobalPointerEnd);
      window.removeEventListener('pointercancel', onGlobalPointerEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
    };
  }, []);

  const handleStart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur();
    keysHeld.current.clear();
    keysJustPressed.current.clear();
    touchHeld.current = {};
    touchJustPressed.current = {};
    setOverlay('none');
    engineRef.current?.startPlaying();
    focusViewport();
  };

  const handleRestartFull = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur();
    keysHeld.current.clear();
    keysJustPressed.current.clear();
    touchHeld.current = {};
    touchJustPressed.current = {};
    setOverlay('none');
    engineRef.current?.resetFullRun();
    engineRef.current?.startPlaying();
    focusViewport();
  };

  const syncTouchActionsState = () => {
    const prevHeld = touchHeld.current;
    const nextHeld: Record<string, boolean> = {};
    for (const act of touchPointersRef.current.values()) {
      nextHeld[act] = true;
      if (!prevHeld[act]) {
        touchJustPressed.current[act] = true;
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(4);
        }
      }
    }
    touchHeld.current = nextHeld;
    setActiveTouchActions((cur) => {
      const curKeys = Object.keys(cur);
      const nextKeys = Object.keys(nextHeld);
      if (curKeys.length === nextKeys.length && nextKeys.every((k) => cur[k])) return cur;
      return { ...nextHeld };
    });
  };

  const handleTouchActionPointerDown = (action: string, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    gameAudio.unlock();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without active capture
    }
    touchPointersRef.current.set(e.pointerId, action);
    syncTouchActionsState();
  };

  const handleTouchActionPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!touchPointersRef.current.has(e.pointerId)) return;
    if (typeof document === 'undefined') return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const btn = el?.closest?.('[data-touch-action]') as HTMLElement | null;
    const hitAction = btn?.dataset?.touchAction;
    if (hitAction && touchPointersRef.current.get(e.pointerId) !== hitAction) {
      touchPointersRef.current.set(e.pointerId, hitAction);
      syncTouchActionsState();
    }
  };

  const handleTouchActionPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (touchPointersRef.current.delete(e.pointerId)) {
      syncTouchActionsState();
    }
  };

  const updateJoystickFromPointer = (clientX: number, clientY: number, isInitial = false) => {
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;
    if (isInitial || !joyOriginRef.current) {
      // Floating thumb anchor gently bounded inside joystick pad for zero dead-angle hunt
      const clampX = Math.max(centerX - 18, Math.min(centerX + 18, clientX));
      const clampY = Math.max(centerY - 18, Math.min(centerY + 18, clientY));
      const dCenter = Math.hypot(clientX - centerX, clientY - centerY);
      joyOriginRef.current = dCenter <= 16 ? { x: clampX, y: clampY } : { x: centerX, y: centerY };
    }
    const origin = joyOriginRef.current;
    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    const decoded = decodeVirtualJoystick(dx, dy, 36, 0.12);
    analogRef.current = {
      x: decoded.analogX,
      y: decoded.analogY,
      left: decoded.left,
      right: decoded.right,
      up: decoded.up,
      down: decoded.down,
    };
    if (joyKnobRef.current) {
      const kdx = origin.x - centerX + decoded.knobX;
      const kdy = origin.y - centerY + decoded.knobY;
      joyKnobRef.current.style.transform = `translate3d(${Math.round(kdx)}px, ${Math.round(kdy)}px, 0px)`;
    }
  };

  const resetVirtualJoystick = () => {
    joyPointerIdRef.current = null;
    joyOriginRef.current = null;
    analogRef.current = { x: 0, y: 0, left: false, right: false, up: false, down: false };
    if (joyKnobRef.current) {
      joyKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  };

  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    gameAudio.toggleMute();
    engineRef.current?.emitHud();
  };

  const handleTogglePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.mode === 'playing') {
      eng.setPaused(true);
    } else if (eng.mode === 'paused') {
      setOverlay('none');
      eng.setPaused(false);
    }
  };

  const hasSavedProgress =
    hud &&
    (hud.visitedStages.length > 1 ||
      hud.relicsCollected > 0 ||
      hud.deaths > 0 ||
      hud.chapterIndex > 0);

  const activeHero = getHeroDef(hud?.heroId);
  const activeModeDef = getPlayModeDef(hud?.playMode);
  const titlePassProg = hud
    ? getPassProgressFromXp(hud.passXp)
    : { level: 0, currentXp: 0, nextXp: 100, progress: 0 };
  const titleAura = AURA_TRAIL_MAP[hud?.equippedAuraTrail ?? 'none'] ?? AURA_TRAIL_MAP.none;
  const titleChapters = hud?.isUnderworld ? UNDERWORLD_CHAPTERS : CHAPTERS;
  const titleChapter = titleChapters[hud?.chapterIndex ?? 0] ?? titleChapters[0];

  const dispatchSandboxPointer = (e: React.PointerEvent<HTMLCanvasElement>, action: 'hover' | 'mine' | 'place') => {
    const eng = engineRef.current;
    const canvas = canvasRef.current;
    if (!eng || !canvas || eng.playMode !== 'sandbox_world' || eng.mode !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const canvasAspect = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;
    const rectAspect = rect.width / Math.max(1, rect.height);
    let drawW = rect.width;
    let drawH = rect.height;
    let drawLeft = rect.left;
    let drawTop = rect.top;
    if (rectAspect > canvasAspect) {
      drawW = rect.height * canvasAspect;
      drawLeft = rect.left + (rect.width - drawW) * 0.5;
    } else {
      drawH = rect.width / canvasAspect;
      drawTop = rect.top + (rect.height - drawH) * 0.5;
    }
    const virtualX = ((e.clientX - drawLeft) / Math.max(1, drawW)) * VIRTUAL_WIDTH;
    const virtualY = ((e.clientY - drawTop) / Math.max(1, drawH)) * VIRTUAL_HEIGHT;
    eng.handleSandboxPointer(virtualX + eng.cameraX, virtualY + eng.cameraY, action);
  };

  return (
    <div
      ref={viewportRef}
      tabIndex={-1}
      onMouseDown={() => focusViewport()}
      className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#07050d] outline-none touch-none select-none"
    >
      {/* Isolated Pixel-Art Canvas Viewport (640x360 2x high-detail upscaled) */}
      <div className="relative flex h-full w-full items-center justify-center">
        <canvas
          ref={canvasRef}
          width={VIRTUAL_WIDTH * 2}
          height={VIRTUAL_HEIGHT * 2}
          data-testid="game-canvas"
          onPointerMove={(e) => {
            if (engineRef.current?.playMode !== 'sandbox_world' || engineRef.current?.mode !== 'playing') return;
            if (activeCanvasToolPointerRef.current === e.pointerId) {
              const canvas = canvasRef.current;
              if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const txKey = `${Math.floor((e.clientX - rect.left) / 14)},${Math.floor((e.clientY - rect.top) / 14)}`;
                if (txKey !== lastSandboxDragTileRef.current) {
                  lastSandboxDragTileRef.current = txKey;
                  dispatchSandboxPointer(e, e.pointerType === 'touch' ? sandboxTouchToolRef.current : 'mine');
                  return;
                }
              }
            }
            dispatchSandboxPointer(e, 'hover');
          }}
          onPointerDown={(e) => {
            if (engineRef.current?.playMode !== 'sandbox_world' || engineRef.current?.mode !== 'playing') return;
            if (e.pointerType === 'touch') {
              activeCanvasToolPointerRef.current = e.pointerId;
              lastSandboxDragTileRef.current = '';
              dispatchSandboxPointer(e, sandboxTouchToolRef.current);
              return;
            }
            if (e.button === 2) dispatchSandboxPointer(e, 'place');
            else if (e.button === 0) {
              activeCanvasToolPointerRef.current = e.pointerId;
              dispatchSandboxPointer(e, 'mine');
            }
          }}
          onPointerUp={(e) => {
            if (activeCanvasToolPointerRef.current === e.pointerId) {
              activeCanvasToolPointerRef.current = null;
              lastSandboxDragTileRef.current = '';
            }
          }}
          onContextMenu={(e) => {
            if (engineRef.current?.playMode === 'sandbox_world') e.preventDefault();
          }}
          className="pixel-canvas h-full w-full object-contain touch-none"
        />
        <CinematicFX playing={hud?.mode === 'playing'} paused={hud?.mode === 'paused' || overlay !== 'none'} />
        <div aria-hidden="true" className="game-lens pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="game-grain pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="game-letterbox pointer-events-none absolute inset-0" />
      </div>

      {/* TITLE SCREEN OVERLAY */}
      {hud?.mode === 'title' && overlay === 'none' && (
        <TitleScreen
          hud={hud}
          activeHero={activeHero}
          activeModeDef={activeModeDef}
          titleChapter={titleChapter}
          titlePassProg={titlePassProg}
          titleAura={titleAura}
          hasSavedProgress={hasSavedProgress}
          gamepadName={gamepadName}
          onStart={handleStart}
          onStartPlayMode={(mode) => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            setOverlay('none');
            engineRef.current?.startPlayMode(mode, true);
            focusViewport();
          }}
          onOpenOverlay={(target, forgeTab) => {
            if (forgeTab) setForgeInitialTab(forgeTab);
            setOverlay(target);
          }}
          onToggleMute={handleToggleMute}
          onRestartFull={handleRestartFull}
          cloudUserEmail={cloudUserEmail}
          onCloudSignIn={onCloudSignIn}
          onCloudSignOut={onCloudSignOut}
        />
      )}

      {/* ACTIVE GAMEPLAY HUD */}
      {hud && hud.mode === 'playing' && (
        <div className="fixed inset-0 z-10 pointer-events-none">
          {hud.isSandboxWorld && engineRef.current && (
            <SandboxHudOverlay
              engine={engineRef.current}
              hud={hud}
              showTouchControls={showTouchControls}
              onOpenForge={() => {
                setForgeInitialTab('equipment');
                engineRef.current?.setPaused(true);
                setOverlay('forge');
              }}
              onOpenPets={() => {
                engineRef.current?.setPaused(true);
                setOverlay('pets');
              }}
              onOpenMap={() => {
                engineRef.current?.setPaused(true);
                setOverlay('map');
              }}
            />
          )}

          {/* Minimal Celeste Top-Left Perimeter HUD */}
          <div
            className={`absolute left-2 top-2 flex max-w-[calc(100vw-98px)] flex-col gap-1 sm:left-4 sm:top-3 ${
              hud.isSandboxWorld ? 'sm:max-w-[260px]' : 'sm:max-w-[42vw]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Crisp Pixel Dash Crystal Gems */}
              <div className="flex items-center gap-1" aria-label={`Cargas de Dash: ${hud.dashes}`}>
                {Array.from({ length: hud.maxDashes }).map((_, i) => {
                  const filled = i < hud.dashes;
                  const fillColor = filled
                    ? hud.maxDashes > 1 && i === 1
                      ? '#ff66dd'
                      : '#52e5ff'
                    : '#1c1829';
                  const shadowColor = filled
                    ? hud.maxDashes > 1 && i === 1
                      ? '#a8228d'
                      : '#1687ab'
                    : '#110e1a';
                  return (
                    <svg key={i} viewBox="0 0 16 16" shapeRendering="crispEdges" className="h-5 w-5 drop-shadow-[0_2px_0_#07050d]">
                      <path
                        d="M6 1h4v2h2v2h2v4h-2v2h-2v2H6v-2H4v-2H2V5h2V3h2V1z"
                        fill="#07050d"
                      />
                      <path
                        d="M7 2h2v2h2v2h2v2h-2v2H9v2H7v-2H5V8H3V6h2V4h2V2z"
                        fill={fillColor}
                      />
                      <path
                        d="M9 6h4v2h-2v2H9v2H7v-2h2V6z"
                        fill={shadowColor}
                      />
                      {filled && <rect x="6" y="4" width="3" height="2" fill="#ffffff" />}
                    </svg>
                  );
                })}
              </div>

              {/* Relics + Timer (Campaign/Modes only) */}
              {!hud.isSandboxWorld && (
                <>
                  <div className="flex items-center gap-1 text-stroke-dark">
                    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className="h-4 w-4 drop-shadow-[0_2px_0_#07050d]" aria-hidden="true">
                      <rect x="6" y="1" width="4" height="2" fill="#4df07a" />
                      <path d="M4 3h8v2h2v4h-2v3h-2v2H6v-2H4V9H2V5h2V3z" fill="#07050d" />
                      <path d="M5 4h6v2h2v2h-2v3H9v2H7v-2H5V8H3V6h2V4z" fill="#ff3864" />
                      <path d="M9 6h4v2h-2v3H9v2H7v-2h2V6z" fill="#b3163b" />
                      <rect x="5" y="5" width="2" height="2" fill="#ffffff" />
                    </svg>
                    <span className="font-mono-num text-sm font-bold text-[#f5efe6]">
                      {hud.chapterRelicsCollected}/{hud.chapterTotalRelics}
                    </span>
                  </div>

                  <span className="font-mono-num text-xs text-[#d7cee8] text-stroke-dark">
                    {formatTimer(hud.chapterElapsedSeconds)}
                  </span>
                </>
              )}

              {hud.comboCount > 1 && (
                <span className="border border-[#07050d] bg-[#291547] px-1.5 py-0.5 font-pixel text-[10px] font-bold text-[#ff88dd]">
                  x{hud.comboCount}
                </span>
              )}
            </div>

            {/* Stamina Micro-Bar + Hero + Active Skill + Conditional Combat Buffs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative h-2 w-24 overflow-hidden border-2 border-[#07050d] bg-[#1a1526] shadow-[0_2px_0_0_#07050d]">
                <div
                  ref={staminaBarRef}
                  style={{ transform: `scaleX(${hud.staminaRatio})`, transformOrigin: 'left' }}
                  className={`relative h-full transition-colors ${
                    hud.staminaRatio < 0.25 ? 'bg-[#ff4455]' : 'bg-[#66ffaa]'
                  }`}
                />
              </div>

              <span
                style={{ color: activeHero.accentColor }}
                className="text-stroke-dark font-pixel text-xs font-bold"
              >
                {activeHero.name}
              </span>

              <span
                style={{
                  borderColor: '#07050d',
                  color: hud.heroSkillCooldown <= 0 ? '#09080f' : '#d7cee8',
                  backgroundColor: hud.heroSkillCooldown <= 0 ? activeHero.secondaryColor : '#1c152e',
                }}
                className="inline-flex items-center gap-1 border px-1.5 py-0 font-pixel text-[10px] font-bold"
              >
                {hud.heroSkillCooldown <= 0 ? '[Q] Pronto' : `[Q] ${hud.heroSkillCooldown.toFixed(1)}s`}
              </span>

              {(hud.soulCharge ?? 0) >= 40 && (
                <span
                  data-testid="hud-soul-gauge"
                  className="border border-[#07050d] bg-[#8f1d3b] px-1.5 py-0 font-pixel text-[10px] font-bold text-[#ffe066] pixel-soul-ready"
                >
                  [U] ALMA!
                </span>
              )}

              {hud.heroShieldReady && (
                <span className="border border-[#07050d] bg-[#ff7733] px-1.5 py-0 font-pixel text-[10px] font-bold text-[#09080f]">
                  ESCUDO
                </span>
              )}

              {hud.riftActive && (
                <span className="border border-[#07050d] bg-[#4c1d95] px-1.5 py-0 font-pixel text-[10px] font-bold text-[#52e5ff]">
                  FENDA {hud.riftProgress}/{hud.riftTotal}
                </span>
              )}

              {hud.imbuedElement && hud.imbuedTimer > 0 && ELEMENT_META[hud.imbuedElement] && (
                <span
                  style={{
                    color: ELEMENT_META[hud.imbuedElement].color,
                    borderColor: ELEMENT_META[hud.imbuedElement].color,
                  }}
                  className="border bg-[#190f2b] px-1.5 py-0 font-pixel text-[10px] font-bold"
                >
                  {ELEMENT_META[hud.imbuedElement].label} {Math.ceil(hud.imbuedTimer)}s
                </span>
              )}

              {hud.echoCloneActive && (
                <span className="border border-[#07050d] bg-[#1b4965] px-1.5 py-0 font-pixel text-[10px] font-bold text-[#88eeff]">
                  ECO
                </span>
              )}

              {hud.activeAlchemyBuffs.map((buff) => (
                <span
                  key={buff.id}
                  style={{ color: buff.color, borderColor: buff.color + '88' }}
                  className="border bg-[#120d22] px-1.5 py-0 font-pixel text-[10px] font-bold"
                >
                  {buff.name} {Math.ceil(buff.remainingSec)}s
                </span>
              ))}
            </div>

            {/* Clean Single-Line Room Label */}
            {!hud.isSandboxWorld && (
              <div className="flex items-center gap-1.5 text-stroke-dark font-pixel text-[11px] text-[#ffd27d]">
                {hud.playMode === 'tower' ? (
                  <span data-testid="hud-tower-badge" className="text-[#38bdf8]">
                    Torre · Andar {hud.towerFloor} · {hud.roomName}
                  </span>
                ) : hud.playMode === 'boss_rush' ? (
                  <span className="text-[#ff8899]">
                    Rush Chefões {hud.bossRushIndex}/{hud.bossRushTotal} · {hud.roomName}
                  </span>
                ) : hud.playMode === 'survival' ? (
                  <span className="text-[#8effdb]">
                    Onda {hud.survivalWave} · Abates {hud.survivalKills}
                  </span>
                ) : (
                  <span className="truncate">
                    {hud.isUnderworld ? 'Círculo' : 'Fase'} {hud.chapterIndex + 1} · {hud.stageNumber}/{hud.totalStagesInChapter} ·{' '}
                    <span className="text-[#f5efe6]">
                      {hud.roomName.replace(/^Etapa\s+\d+\s*·\s*/i, '')}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Boss Pixel HP, Stagger & Weakness Bar (Top Center during Boss Fight) */}
          {hud.bossHp !== null && hud.bossMaxHp && (
            <div data-testid="boss-hud-bar" className="pointer-events-none absolute left-1/2 top-16 w-[min(94vw,420px)] -translate-x-1/2 lg:top-3">
              <div className="pixel-panel px-2.5 py-1.5 text-center sm:px-3.5">
                <div className="flex flex-wrap items-center justify-center gap-1.5 font-pixel text-[11px] font-bold tracking-wider text-stroke-dark sm:gap-2 sm:text-xs">
                  <span className="text-[#ff5c77]">{hud.bossName ?? 'GUARDIÃO'}</span>
                  {hud.bossPhase === 2 && (
                    <span className="border border-[#07050d] bg-[#9e471b] px-1.5 py-0 text-[10px] text-[#ffe47a]">
                      FASE II
                    </span>
                  )}
                  {hud.bossPhase === 3 && (
                    <span className="border border-[#07050d] bg-[#9e1b3b] px-1.5 py-0 text-[10px] text-[#ffe47a]">
                      FASE III · FÚRIA
                    </span>
                  )}
                  {hud.bossWeakness && ELEMENT_META[hud.bossWeakness] && (
                    <span
                      style={{
                        color: ELEMENT_META[hud.bossWeakness].color,
                        borderColor: ELEMENT_META[hud.bossWeakness].color + '99',
                      }}
                      className="border bg-[#140e24] px-1.5 py-0 text-[10px]"
                    >
                      Fraqueza: {ELEMENT_META[hud.bossWeakness].label}
                    </span>
                  )}
                  {hud.bossSubState === 'staggered' && (
                    <span className="border border-[#07050d] bg-[#ffd24d] px-1.5 py-0 text-[10px] text-[#09080f]">
                      ATORDOADO · DANO x2!
                    </span>
                  )}
                  {hud.bossSubState === 'recover' && (
                    <span className="border border-[#07050d] bg-[#1a5c49] px-1.5 py-0 text-[10px] text-[#8effdb]">
                      VULNERÁVEL
                    </span>
                  )}
                  {hud.bossSubState === 'windup' && (
                    <span className="border border-[#07050d] bg-[#732334] px-1.5 py-0 text-[10px] text-[#ffd27d]">
                      ATAQUE IMINENTE!
                    </span>
                  )}
                  {hud.bossHitInvulnRemaining > 0 && (
                    <span
                      data-testid="boss-immune-badge"
                      className="border border-[#52e5ff] bg-[#0e3447] px-1.5 py-0 text-[10px] text-[#8ef3ff]"
                    >
                      IMUNE · {hud.bossHitInvulnRemaining.toFixed(1)}s
                    </span>
                  )}
                  <span className="font-mono-num text-[#ffd27d]">
                    {hud.bossHp}/{hud.bossMaxHp}
                  </span>
                </div>
                {hud.bossTitle && (
                  <div className="font-body-pixel text-[10px] text-[#b8afc9]">{hud.bossTitle}</div>
                )}
                <div className="mt-1 flex items-center justify-center gap-0.5 sm:gap-1">
                  {Array.from({ length: hud.bossMaxHp }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 flex-1 max-w-6 border border-[#07050d] sm:h-2.5 ${
                        idx < hud.bossHp!
                          ? hud.bossPhase === 3
                            ? 'bg-[#ff2e63]'
                            : hud.bossPhase === 2
                              ? 'bg-[#ff5c33]'
                              : 'bg-[#ff9933]'
                          : 'bg-[#1a1224]'
                      }`}
                    />
                  ))}
                </div>
                {hud.bossStaggerRatio !== null && (
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    <span className="font-pixel text-[9px] uppercase tracking-wider text-[#ffd24d]">
                      Postura
                    </span>
                    <div className="h-1.5 w-32 overflow-hidden border border-[#07050d] bg-[#120d1e] sm:w-36">
                      <div
                        style={{
                          transform: `scaleX(${Math.max(0, Math.min(1, hud.bossStaggerRatio))})`,
                          transformOrigin: 'left',
                        }}
                        className={`h-full ${
                          hud.bossSubState === 'staggered' ? 'bg-[#ff66dd]' : 'bg-[#ffd24d]'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Minimal Top-Right Corner Utility Cluster */}
          <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-1.5 sm:right-4 sm:top-3">
            <PixelButton
              type="button"
              variant="slate"
              tabIndex={-1}
              onClick={handleToggleMute}
              aria-label={hud.muted ? 'Ativar áudio' : 'Silenciar áudio'}
              title="Áudio [N]"
              className="h-9 w-9 !px-0 !py-0"
            >
              <PixelIcon
                name={hud.muted ? 'sound_off' : 'sound_on'}
                className={`h-4 w-4 ${hud.muted ? 'text-[#ff708d]' : 'text-[#4df0c0]'}`}
              />
            </PixelButton>

            <PixelButton
              type="button"
              variant="gold"
              tabIndex={-1}
              data-testid="hud-pause-btn"
              onClick={handleTogglePause}
              aria-label="Pausar jogo (Esc)"
              title="Pausar [Esc]"
              className="h-9 !px-2.5 !py-0 font-pixel text-xs sm:!px-3"
            >
              <PixelIcon name="pause" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-bold tracking-wider">PAUSA</span>
            </PixelButton>
          </div>

          {/* Pixel Biome / Chapter Entry Banner */}
          {hud.bannerTitle && (
            <div className="pointer-events-none absolute inset-x-0 top-48 flex flex-col items-center px-3 text-center sm:top-24">
              <div className="pixel-panel px-4 py-2 sm:px-7 sm:py-3">
                <span className="pointer-events-none absolute left-1 top-1 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <span className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-1 left-1 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <div className="font-pixel text-base font-bold tracking-wide text-[#f5efe6] text-stroke-dark sm:text-xl">
                  {hud.bannerTitle}
                </div>
                {hud.bannerSub && (
                  <div className="mt-0.5 font-pixel text-[11px] text-[#ffd27d] sm:text-xs">
                    {hud.bannerSub}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pixel Mechanic Discovery Toast */}
          {hud.recentMechanicToast && (
            <div
              className={`pixel-panel pointer-events-none fixed right-3 max-w-[calc(100vw-24px)] px-3 py-1.5 text-xs text-[#4df0c0] sm:bottom-4 sm:right-4 sm:px-4 sm:py-2.5 ${
                showTouchControls ? 'bottom-40' : 'bottom-4'
              }`}
            >
              <span className="font-pixel uppercase tracking-wider text-[#8effdb]">Descoberta:</span>{' '}
              <strong className="font-pixel text-xs text-[#f5efe6] sm:text-sm">
                {hud.recentMechanicToast}
              </strong>
            </div>
          )}

          {/* Context Interaction Floating Prompt (Altar, Quest Beacon, Lore Tablet) */}
          {(hud.nearShrine || hud.nearInteractLabel) && !hud.dialogue && overlay === 'none' && (
            <div
              className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 ${
                showTouchControls ? 'bottom-40 sm:bottom-6' : 'bottom-6'
              }`}
            >
              {hud.nearShrine ? (
                <PixelButton
                  type="button"
                  variant="gold"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    engineRef.current?.setPaused(true);
                    setOverlay('blessings');
                  }}
                  className="px-4 py-2 text-xs"
                >
                  <PixelIcon name="shrine" className="h-4 w-4" />
                  <span>[E / B] Abrir Altar de Bênçãos</span>
                </PixelButton>
              ) : (
                <div className="pixel-panel px-4 py-2 font-pixel text-xs font-bold text-[#ffe066] text-stroke-dark">
                  {hud.nearInteractLabel}
                </div>
              )}
            </div>
          )}

          {/* Toggleable Pixel Stage Mini-Radar (Bottom-Left, Campaign only) */}
          {!showTouchControls && !hud.isSandboxWorld && hud.stageNodes.length > 0 && (
            <div className="absolute bottom-3 left-4 pointer-events-auto">
              {showRadar ? (
                <div className="pixel-panel p-2">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="font-pixel text-[10px] font-bold uppercase tracking-wider text-[#ffd27d]">
                      Radar [Tab]
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        setShowRadar(false);
                        focusViewport();
                      }}
                      className="font-pixel text-[10px] text-[#b8afc9] hover:text-[#ffffff]"
                    >
                      Ocultar
                    </button>
                  </div>
                  <div
                    style={{
                      gridTemplateColumns: `repeat(${
                        Math.max(...hud.stageNodes.map((n) => n.gx)) + 1
                      }, 14px)`,
                    }}
                    className="grid gap-1"
                  >
                    {(() => {
                      const maxX = Math.max(...hud.stageNodes.map((n) => n.gx));
                      const maxY = Math.max(...hud.stageNodes.map((n) => n.gy));
                      const map = new Map(hud.stageNodes.map((n) => [`${n.gx},${n.gy}`, n]));
                      const cells: React.ReactNode[] = [];
                      for (let y = 0; y <= maxY; y++) {
                        for (let x = 0; x <= maxX; x++) {
                          const node = map.get(`${x},${y}`);
                          if (!node) {
                            cells.push(<div key={`${x},${y}`} className="h-3 w-3.5" />);
                          } else {
                            cells.push(
                              <div
                                key={node.id}
                                title={node.id}
                                className={`h-3 w-3.5 border ${
                                  node.current
                                    ? 'border-[#ffffff] bg-[#52e5ff]'
                                    : node.hasGoal
                                    ? 'border-[#07050d] bg-[#ffd27d]'
                                    : node.visited
                                    ? 'border-[#07050d] bg-[#4df0c0]'
                                    : 'border-[#07050d] bg-[#2a223d]'
                                }`}
                              />
                            );
                          }
                        }
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              ) : (
                <PixelButton
                  type="button"
                  variant="slate"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShowRadar(true);
                    focusViewport();
                  }}
                  className="px-2.5 py-1 text-[10px]"
                >
                  Radar [Tab]
                </PixelButton>
              )}
            </div>
          )}

          {/* Mobile True Multi-Touch Analog Joystick + Simultaneous Action Controls ([T]) */}
          {showTouchControls && !hud.dialogue && (
            <div className="pointer-events-none fixed inset-x-0 bottom-2 z-20 flex items-end justify-between px-2.5 pb-[env(safe-area-inset-bottom)] sm:bottom-3 sm:px-5">
              {/* Left Thumb Pad: Floating Sensitive Virtual Analog Stick */}
              <div className="pointer-events-auto flex flex-col items-start gap-1.5">
                {hud.isSandboxWorld && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid="sandbox-touch-mine-btn"
                      onClick={() => setSandboxTouchTool('mine')}
                      className={`pixel-btn h-8 px-2 font-pixel text-[10px] font-bold ${
                        sandboxTouchTool === 'mine'
                          ? 'bg-[#e8a87c] text-[#09080f] is-touch-pressed'
                          : 'bg-[#1c152e]/90 text-[#d7cee8]'
                      }`}
                    >
                      MINERAR
                    </button>
                    <button
                      type="button"
                      data-testid="sandbox-touch-place-btn"
                      onClick={() => setSandboxTouchTool('place')}
                      className={`pixel-btn h-8 px-2 font-pixel text-[10px] font-bold ${
                        sandboxTouchTool === 'place'
                          ? 'bg-[#52e5ff] text-[#09080f] is-touch-pressed'
                          : 'bg-[#1c152e]/90 text-[#d7cee8]'
                      }`}
                    >
                      COLOCAR
                    </button>
                  </div>
                )}

                <div
                  ref={joyBaseRef}
                  data-testid="virtual-joystick"
                  aria-label="Joystick Analógico Virtual"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    gameAudio.unlock();
                    joyPointerIdRef.current = e.pointerId;
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      // Synthetic event without capture
                    }
                    updateJoystickFromPointer(e.clientX, e.clientY, true);
                  }}
                  onPointerMove={(e) => {
                    if (joyPointerIdRef.current === e.pointerId) {
                      e.preventDefault();
                      updateJoystickFromPointer(e.clientX, e.clientY, false);
                    }
                  }}
                  onPointerUp={(e) => {
                    if (joyPointerIdRef.current === e.pointerId) {
                      resetVirtualJoystick();
                    }
                  }}
                  onPointerCancel={() => resetVirtualJoystick()}
                  className="relative flex h-28 w-28 touch-none select-none items-center justify-center border-2 border-[#07050d] bg-[#140e24]/88 shadow-[0_4px_0_0_#07050d] sm:h-32 sm:w-32"
                >
                  <span className="pointer-events-none absolute top-1 font-pixel text-[10px] text-[#8d84ad]">▲</span>
                  <span className="pointer-events-none absolute bottom-1 font-pixel text-[10px] text-[#8d84ad]">▼</span>
                  <span className="pointer-events-none absolute left-1.5 font-pixel text-[10px] text-[#8d84ad]">◄</span>
                  <span className="pointer-events-none absolute right-1.5 font-pixel text-[10px] text-[#8d84ad]">►</span>
                  <div className="pointer-events-none h-10 w-10 border border-[#3a2f59] bg-[#0c0818] sm:h-11 sm:w-11" />
                  <div
                    ref={joyKnobRef}
                    data-testid="virtual-joystick-knob"
                    className="pointer-events-none absolute h-10 w-10 border-2 border-[#07050d] bg-[#52e5ff] shadow-[0_3px_0_0_#1e6478] sm:h-12 sm:w-12"
                  />
                </div>
              </div>

              {/* Right Multi-Touch Action Cluster (Independent pointerIds + Slide-Combo Support) */}
              <div className="pointer-events-auto flex flex-col items-end gap-1.5 touch-none select-none sm:gap-2">
                {/* Secondary Tactical Row */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    data-touch-action="soul"
                    data-testid="touch-btn-soul"
                    onPointerDown={(e) => handleTouchActionPointerDown('soul', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none min-h-[38px] px-2 font-pixel text-[10px] font-bold sm:h-10 sm:px-2.5 sm:text-[11px] ${
                      (hud.soulCharge ?? 0) >= 40
                        ? 'bg-[#8f1d3b]/95 text-[#ffe066]'
                        : 'bg-[#2a1524]/88 text-[#fb7185]'
                    } ${activeTouchActions.soul ? 'is-touch-pressed ring-2 ring-[#ffe066]' : ''}`}
                  >
                    ALMA
                  </button>
                  <button
                    type="button"
                    data-touch-action="swap"
                    data-testid="touch-btn-swap"
                    onPointerDown={(e) => handleTouchActionPointerDown('swap', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none min-h-[38px] px-2 bg-[#194a41]/92 font-pixel text-[10px] font-bold text-[#8effdb] sm:h-10 sm:px-2.5 sm:text-[11px] ${
                      activeTouchActions.swap ? 'is-touch-pressed ring-2 ring-[#8effdb]' : ''
                    }`}
                  >
                    DUPLA
                  </button>
                  <button
                    type="button"
                    data-touch-action="interact"
                    data-testid="touch-btn-interact"
                    onPointerDown={(e) => handleTouchActionPointerDown('interact', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none min-h-[38px] px-2.5 bg-[#3a2812]/92 font-pixel text-[10px] font-bold text-[#ffd27d] sm:h-10 sm:px-3 sm:text-[11px] ${
                      activeTouchActions.interact ? 'is-touch-pressed ring-2 ring-[#ffd27d]' : ''
                    }`}
                  >
                    [E]
                  </button>
                  <button
                    type="button"
                    data-touch-action="skill"
                    data-testid="touch-btn-skill"
                    onPointerDown={(e) => handleTouchActionPointerDown('skill', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none min-h-[38px] px-3 bg-[#4c2463]/95 font-pixel text-[11px] font-bold text-[#ff88dd] sm:h-10 sm:px-3.5 sm:text-xs ${
                      activeTouchActions.skill ? 'is-touch-pressed ring-2 ring-[#ff88dd]' : ''
                    }`}
                  >
                    [Q]
                  </button>
                </div>

                {/* Primary Ergonomic Thumb Row: Lock + Grab + Dash + Jump */}
                <div className="flex items-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    data-testid="touch-btn-grab-lock"
                    aria-pressed={grabLock}
                    title="Travar escalada automática sem segurar"
                    onClick={() => setGrabLock((v) => !v)}
                    className={`pixel-btn touch-none h-11 px-2 font-pixel text-[9px] font-bold sm:h-12 ${
                      grabLock
                        ? 'bg-[#4df0c0] text-[#09080f] ring-2 ring-white'
                        : 'bg-[#1b142d]/90 text-[#b8afc9]'
                    }`}
                  >
                    {grabLock ? 'TRAVA ON' : 'TRAVA'}
                  </button>
                  <button
                    type="button"
                    data-touch-action="grab"
                    data-testid="touch-btn-grab"
                    onPointerDown={(e) => handleTouchActionPointerDown('grab', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none h-12 px-2.5 bg-[#1a5c49]/95 font-pixel text-[11px] font-bold text-[#8effdb] sm:h-13 sm:px-3.5 sm:text-xs ${
                      activeTouchActions.grab || grabLock ? 'is-touch-pressed ring-2 ring-[#8effdb]' : ''
                    }`}
                  >
                    ESCALAR
                  </button>
                  <button
                    type="button"
                    data-touch-action="dash"
                    data-testid="touch-btn-dash"
                    onPointerDown={(e) => handleTouchActionPointerDown('dash', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none h-14 px-3.5 bg-[#2a4a6e]/95 font-pixel text-xs font-bold text-[#9ff0ff] sm:h-15 sm:px-4.5 sm:text-sm ${
                      activeTouchActions.dash ? 'is-touch-pressed ring-2 ring-[#9ff0ff]' : ''
                    }`}
                  >
                    DASH
                  </button>
                  <button
                    type="button"
                    data-touch-action="jump"
                    data-testid="touch-btn-jump"
                    onPointerDown={(e) => handleTouchActionPointerDown('jump', e)}
                    onPointerMove={handleTouchActionPointerMove}
                    onPointerUp={handleTouchActionPointerUp}
                    onPointerCancel={handleTouchActionPointerUp}
                    className={`pixel-btn touch-none h-14 px-4 bg-[#e8a87c]/95 font-pixel text-xs font-bold text-[#09080f] sm:h-15 sm:px-5 sm:text-sm ${
                      activeTouchActions.jump ? 'is-touch-pressed ring-2 ring-white' : ''
                    }`}
                  >
                    PULAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pixel NPC Dialogue Box */}
          {hud.dialogue && (
            <div className="absolute inset-x-0 bottom-3 mx-auto max-w-2xl px-3 pb-[env(safe-area-inset-bottom)] sm:bottom-5 sm:px-4 pointer-events-auto">
              <div className="pixel-panel pixel-scroll max-h-[82dvh] overflow-y-auto p-3.5 sm:p-5">
                <span className="pointer-events-none absolute left-1.5 top-1.5 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <span className="pointer-events-none absolute right-1.5 top-1.5 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-1.5 w-1.5 bg-[#ffd27d]" aria-hidden="true" />

                <div
                  style={{ borderBottomColor: hud.dialogue.accentColor }}
                  className="flex items-baseline justify-between gap-2 border-b-2 pb-2"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span
                      style={{ color: hud.dialogue.accentColor }}
                      className="font-pixel text-lg font-bold text-stroke-dark sm:text-xl"
                    >
                      {hud.dialogue.speaker}
                    </span>
                    <span className="font-pixel text-[11px] text-[#b8afc9] sm:text-xs">
                      · {hud.dialogue.role}
                    </span>
                  </div>
                  <span className="hidden sm:inline font-mono-num text-[11px] text-[#ffd27d]">[E / Espaço]</span>
                </div>

                <p className="mt-3 min-h-[3.2rem] font-body-pixel text-sm leading-relaxed text-[#f5efe6]">
                  {(
                    hud.dialogue.replyText ??
                    hud.dialogue.lines[hud.dialogue.lineIndex]
                  ).slice(0, Math.floor(hud.dialogue.charIndex || 999))}
                </p>

                {!hud.dialogue.replyText &&
                  hud.dialogue.lineIndex === hud.dialogue.lines.length - 1 &&
                  hud.dialogue.choices && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hud.dialogue.choices.map((ch, idx) => (
                        <PixelButton
                          key={ch.label}
                          type="button"
                          variant="cyan"
                          onClick={() => engineRef.current?.advanceDialogue(idx)}
                          className="px-3 py-1.5 text-xs"
                        >
                          {ch.label}
                        </PixelButton>
                      ))}
                    </div>
                  )}

                <div className="mt-4 flex justify-end">
                  <PixelButton
                    type="button"
                    variant="gold"
                    onClick={() => engineRef.current?.advanceDialogue()}
                    className="px-4 py-1.5 text-xs"
                  >
                    {hud.dialogue.replyText ||
                    (hud.dialogue.lineIndex === hud.dialogue.lines.length - 1 &&
                      !hud.dialogue.choices)
                      ? 'Fechar'
                      : 'Continuar'}
                  </PixelButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPACT ORGANIZED PIXEL PAUSE MODAL */}
      {hud?.mode === 'paused' && overlay === 'none' && (
        <PauseModal
          hud={hud}
          totalMechanics={TOTAL_MECHANICS}
          totalChronicles={LORE_CODEX.length}
          gamepadName={gamepadName}
          showRadar={showRadar}
          showTouchControls={showTouchControls}
          onResume={() => {
            setOverlay('none');
            engineRef.current?.setPaused(false);
            focusViewport();
          }}
          onRestartChapter={() => {
            setOverlay('none');
            engineRef.current?.replayChapter();
            focusViewport();
          }}
          onReturnTitle={() => {
            setOverlay('none');
            engineRef.current?.returnToTitle();
          }}
          onToggleMute={() => {
            gameAudio.toggleMute();
            engineRef.current?.emitHud();
          }}
          onOpenOverlay={(target) => setOverlay(target)}
          onCycleGameSpeed={() => {
            const eng = engineRef.current;
            if (!eng) return;
            const speeds: (1 | 0.8 | 0.6)[] = [1, 0.8, 0.6];
            const next = speeds[(speeds.indexOf(eng.assist.gameSpeed) + 1) % speeds.length];
            eng.assist.gameSpeed = next;
            eng.unlockMechanic('ASSIST_MODE');
            eng.emitHud();
          }}
          onToggleAssist={(key) => {
            const eng = engineRef.current;
            if (!eng) return;
            eng.assist[key] = !eng.assist[key];
            if (key === 'hardcoreMode') {
              eng.unlockMechanic('HARDCORE_MODE');
            } else if (key === 'infiniteStamina' || key === 'extraDash') {
              eng.unlockMechanic('ASSIST_MODE');
            }
            eng.emitHud();
          }}
          onToggleRadar={() => setShowRadar((v) => !v)}
          onToggleTouch={() => {
            touchManualRef.current = true;
            setShowTouchControls((v) => !v);
          }}
        />
      )}

      {/* PIXEL STAGE SELECT OR INTERACTIVE 2400x460 CELESTE SANDBOX WORLD MAP */}
      {hud && overlay === 'map' && engineRef.current && (
        hud.isSandboxWorld ? (
          <SandboxWorldMapModal
            engine={engineRef.current}
            hud={hud}
            onTeleportPylon={(tx, ty) => {
              keysHeld.current.clear();
              keysJustPressed.current.clear();
              engineRef.current?.warpToSandboxPylonAt(tx, ty);
              setOverlay('none');
              if (engineRef.current?.mode === 'paused') {
                engineRef.current.setPaused(false);
              }
              focusViewport();
            }}
            onClose={() => {
              setOverlay('none');
              if (engineRef.current?.mode === 'paused') {
                engineRef.current.setPaused(false);
              }
              focusViewport();
            }}
          />
        ) : (
          <StageSelectModal
            hud={hud}
            playMode={hud.playMode}
            chapters={hud.isUnderworld ? UNDERWORLD_CHAPTERS : CHAPTERS}
            collectedRelics={engineRef.current.collectedRelics}
            onSelectChapter={(chapterIdx) => {
              keysHeld.current.clear();
              keysJustPressed.current.clear();
              setOverlay('none');
              engineRef.current?.startChapter(chapterIdx);
            }}
            onFastTravelStage={(stageId) => {
              keysHeld.current.clear();
              keysJustPressed.current.clear();
              setOverlay('none');
              engineRef.current?.fastTravelToRoom(stageId);
            }}
            onClose={() => {
              setOverlay('none');
              if (engineRef.current?.mode === 'paused') {
                engineRef.current.setPaused(false);
              }
            }}
          />
        )
      )}

      {/* PIXEL COMPENDIUM 108 MECHANICS MODAL */}
      {hud && overlay === 'compendium' && engineRef.current && (
        <CompendiumModal
          discoveredCodes={engineRef.current.discoveredMechanics}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* PIXEL HERO SELECT MODAL */}
      {hud && overlay === 'heroes' && engineRef.current && (
        <HeroSelectModal
          activeHeroId={hud.heroId}
          heroSkins={engineRef.current.heroSkinByHero}
          tagHeroId={hud.tagHeroId}
          playerLevel={hud.playerLevel}
          astralCoins={hud.astralCoins}
          unlockedHeroes={hud.unlockedHeroes}
          onUnlockHero={(heroId) => {
            engineRef.current?.unlockHero(heroId);
          }}
          onSelectHero={(heroId, skinId) => {
            const switched = engineRef.current?.setHero(heroId, skinId, true);
            if (!switched) return;
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
          onSelectTagHero={(tagId) => {
            engineRef.current?.setTagHero(tagId, true);
          }}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* PIXEL LOADOUT SANCTUARY MODAL (RUNAS, ESPÍRITOS, DUPLA, MAESTRIA, CONQUISTAS, FANTASMA) */}
      {hud && overlay === 'sanctuary' && engineRef.current && (
        <LoadoutSanctuaryModal
          engine={engineRef.current}
          hud={hud}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* PASSE ESTELAR, MISSÕES, ESTRELAS & COFRE DIÁRIO MODAL */}
      {hud && overlay === 'pass' && engineRef.current && (
        <PassAndRewardsModal
          engine={engineRef.current}
          hud={hud}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* SIDE QUESTS & STAGE EXPLORATION MODAL */}
      {hud && overlay === 'quests' && engineRef.current && (
        <SideQuestsModal
          hud={hud}
          onClaimQuest={(questId) => {
            engineRef.current?.claimSideQuest(questId);
          }}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
            focusViewport();
          }}
        />
      )}

      {/* PIXEL BLESSING ALTAR MODAL */}
      {hud && overlay === 'blessings' && engineRef.current && (
        <BlessingShopModal
          coins={hud.astralCoins}
          blessings={hud.blessings}
          onBuy={(key) => {
            engineRef.current?.buyBlessingUpgrade(key);
          }}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* PIXEL CHRONICLES & CUTSCENE THEATER MODAL */}
      {hud && overlay === 'chronicles' && engineRef.current && (
        <ChroniclesModal
          seenCutscenes={hud.seenCutscenes}
          onPlayCutscene={(id) => {
            setOverlay('none');
            engineRef.current?.triggerCutscene(id, true);
          }}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* PIXEL PLAY MODES MODAL */}
      {hud && overlay === 'modes' && engineRef.current && (
        <ModeSelectModal
          activeMode={hud.playMode}
          bestSurvivalWave={hud.bestSurvivalWave}
          bestBossRushSeconds={hud.bestBossRushSeconds}
          bestTowerFloor={hud.bestTowerFloor}
          totalUnderworldStars={hud.totalUnderworldStars ?? 0}
          sandboxHousesCount={hud.sandboxHousesCount}
          sandboxNpcsCount={hud.sandboxNpcsCount}
          onSelectMode={(modeId) => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            setOverlay('none');
            engineRef.current?.startPlayMode(modeId, true);
            focusViewport();
          }}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
          }}
        />
      )}

      {/* FORJA, EQUIPAMENTOS (10 SLOTS) & EVOLUÇÃO 3X MODAL */}
      {hud && overlay === 'forge' && engineRef.current && (
        <ForgeEquipmentModal
          engine={engineRef.current}
          hud={hud}
          initialTab={forgeInitialTab}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
            focusViewport();
          }}
        />
      )}

      {/* PETS EXCLUSIVOS & VÍNCULO MODAL */}
      {hud && overlay === 'pets' && engineRef.current && (
        <PetsModal
          engine={engineRef.current}
          hud={hud}
          onClose={() => {
            setOverlay('none');
            if (engineRef.current?.mode === 'paused') {
              engineRef.current.setPaused(false);
            }
            focusViewport();
          }}
        />
      )}

      {/* ANIMATED PIXEL-ART STORY CUTSCENE OVERLAY */}
      {hud?.activeCutscene && (
        <CutsceneOverlay
          cutsceneId={hud.activeCutscene}
          heroId={hud.heroId}
          skinId={hud.heroSkinId}
          gamepadConfirmTick={gamepadConfirmTick}
          gamepadSkipTick={gamepadSkipTick}
          onFinish={() => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            engineRef.current?.finishCutscene();
            focusViewport();
          }}
        />
      )}

      {/* ASTRAL BOON DRAFT MODAL (ROGUELITE 3-CARD SELECTION) */}
      {hud?.pendingBoonChoices && hud.pendingBoonChoices.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Escolha uma Carta Astral"
          data-testid="boon-draft-modal"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#05040a]/85 p-4 pointer-events-auto"
        >
          <PixelWindow
            title="Altar das Cartas Astrais"
            subtitle="Escolha 1 bênção tática para potencializar sua jornada"
            accentColor="#ffe066"
            maxWidthClass="max-w-3xl"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {hud.pendingBoonChoices.map((boonId) => {
                const boon = BOON_MAP[boonId];
                if (!boon) return null;
                return (
                  <button
                    key={boon.id}
                    type="button"
                    data-testid={`boon-choice-${boon.id}`}
                    onClick={() => {
                      keysHeld.current.clear();
                      keysJustPressed.current.clear();
                      touchHeld.current = {};
                      touchJustPressed.current = {};
                      engineRef.current?.chooseBoon(boon.id);
                      focusViewport();
                    }}
                    style={{ borderColor: boon.color }}
                    className="pixel-subpanel flex flex-col justify-between gap-3 p-3.5 text-left transition-transform hover:-translate-y-0.5 hover:bg-[#1e1535]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{
                            color: '#09080f',
                            backgroundColor: boon.color,
                          }}
                          className="border border-[#07050d] px-1.5 py-0.5 font-pixel text-[10px] font-bold uppercase"
                        >
                          {boon.rarity}
                        </span>
                        <PixelIcon name="gem" className="h-4 w-4 text-[#ffe066]" />
                      </div>
                      <h3
                        style={{ color: boon.color }}
                        className="mt-2 font-pixel text-base font-bold text-stroke-dark"
                      >
                        {boon.name}
                      </h3>
                      <p className="mt-1.5 font-body-pixel text-xs leading-relaxed text-[#e5def2]">
                        {boon.desc}
                      </p>
                    </div>
                    <div className="border-t border-[#2c2246] pt-2 font-pixel text-xs font-bold text-[#ffd27d]">
                      EQUIPAR CARTA &gt;
                    </div>
                  </button>
                );
              })}
            </div>
          </PixelWindow>
        </div>
      )}

      {/* PIXEL VICTORY MODAL (Stage Clear & Final Victory) */}
      {(hud?.mode === 'stage_clear' || (hud?.mode === 'gameover' && hud.victory)) && overlay === 'none' && (
        <VictoryModal
          hud={hud}
          isFinalVictory={hud.mode === 'gameover' && hud.victory}
          onNextChapter={() => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            engineRef.current?.nextChapter();
            focusViewport();
          }}
          onReplayChapter={() => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            engineRef.current?.replayChapter();
            focusViewport();
          }}
          onOpenStages={() => setOverlay('map')}
          onReplayFull={() => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            if (hud.playMode === 'boss_rush' || hud.playMode === 'survival' || hud.playMode === 'tower') {
              engineRef.current?.startPlayMode(hud.playMode, true);
            } else {
              handleRestartFull();
            }
          }}
          onReturnTitle={() => engineRef.current?.returnToTitle()}
        />
      )}

      {/* PIXEL DEFEAT / SURVIVAL / TOWER / IRONMAN GAMEOVER MODAL */}
      {hud?.mode === 'gameover' && !hud.victory && overlay === 'none' && (
        <DefeatModal
          hud={hud}
          onRetry={() => {
            keysHeld.current.clear();
            keysJustPressed.current.clear();
            if (hud.playMode === 'boss_rush' || hud.playMode === 'survival' || hud.playMode === 'tower') {
              engineRef.current?.startPlayMode(hud.playMode, true);
            } else {
              handleRestartFull();
            }
            focusViewport();
          }}
          onOpenStages={() => setOverlay('map')}
          onReturnTitle={() => engineRef.current?.returnToTitle()}
        />
      )}
    </div>
  );
};
