// @ts-nocheck -- Web Audio 19-instrument FM + Orchestral Studio Music & SFX Engine
import {
  BIOME_MUSIC_SCORES,
  BiomeMusicScore,
  DrumStep,
  JUKEBOX_TO_BIOME,
  SONG_LENGTH,
  SynthTimbre,
  computeNoteSteps,
  getBiomeMusicScore,
  getSectionAtStep,
  midiToFreq,
} from './biomeMusic';
import { AnyBiomeId } from './types';

function makeWarmSaturationCurve(): Float32Array {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const drive = 1.45;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private unlocked = false;
  private currentBiome: AnyBiomeId | null = null;
  private combatIntensity = 0.35; // 0..1 adaptive intensity
  private bossActive = false;

  // Master studio music chain:
  // voices -> dryBus + reverbSend -> 2.6s Stereo Convolver -> reverbReturn
  //                 + delaySend  -> Stereo Ping-Pong Delay -> delayReturn
  //        -> musicMasterGain -> warmLowpass -> presenceShelf -> tapeShaper -> compressor -> destination
  private musicMasterGain: GainNode | null = null;
  private musicDryBus: GainNode | null = null;
  private musicReverbSend: GainNode | null = null;
  private musicReverbReturn: GainNode | null = null;
  private musicDelaySend: GainNode | null = null;
  private musicDelayReturn: GainNode | null = null;
  private musicWarmFilter: BiquadFilterNode | null = null;
  private musicCompressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Sequencer state
  private seqTimer: number | null = null;
  private seqActive = false;
  private seqStep = 0;
  private nextNoteTime = 0;
  private activeScore: BiomeMusicScore | null = null;
  private visibilityHooked = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    if (this.musicMasterGain && this.ctx) {
      const target = m || !this.seqActive ? 0 : (this.activeScore?.masterVolume ?? 0.115);
      this.musicMasterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Smoothly adjusts orchestral intensity (ostinato, percussion & counter-melody swell) during combat/bosses */
  public setCombatIntensity(intensity: number, isBoss = false): void {
    this.combatIntensity = Math.max(0, Math.min(1, intensity));
    this.bossActive = isBoss;
  }

  private hookVisibility(): void {
    if (this.visibilityHooked || typeof document === 'undefined') return;
    this.visibilityHooked = true;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.musicMasterGain) return;
      if (document.hidden) {
        this.musicMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      } else if (this.seqActive && !this.muted) {
        this.nextNoteTime = Math.max(this.nextNoteTime, this.ctx.currentTime + 0.06);
        this.musicMasterGain.gain.setTargetAtTime(
          this.activeScore?.masterVolume ?? 0.115,
          this.ctx.currentTime,
          0.12
        );
      }
    });
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.unlocked) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.hookVisibility();
    return this.ctx;
  }

  private createHallImpulse(ctx: AudioContext): AudioBuffer {
    const duration = 2.6;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    const L = impulse.getChannelData(0);
    const R = impulse.getChannelData(1);

    let lpL = 0;
    let lpR = 0;
    let hpL = 0;
    let hpR = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Pre-delay early reflections + velvet Concert Hall tail
      const early = i < rate * 0.045 && i % 390 < 24 ? 0.55 : 0;
      const env = t < 0.018 ? t / 0.018 : Math.pow(1 - t, 2.5);
      const rawL = (Math.random() * 2 - 1) * (env + early);
      const rawR = (Math.random() * 2 - 1) * (env + early);
      lpL = lpL * 0.66 + rawL * 0.34;
      lpR = lpR * 0.66 + rawR * 0.34;
      hpL = hpL * 0.992 + lpL * 0.008;
      hpR = hpR * 0.992 + lpR * 0.008;
      L[i] = (lpL - hpL * 0.4) * 0.92;
      R[i] = (lpR - hpR * 0.4) * 0.92;
    }
    return impulse;
  }

  private ensureMusicBus(ctx: AudioContext): GainNode | null {
    try {
      if (!this.musicMasterGain || !this.musicDryBus || !this.musicWarmFilter || !this.musicCompressor) {
        const master = ctx.createGain();
        const dryBus = ctx.createGain();
        const reverbSend = ctx.createGain();
        const reverbReturn = ctx.createGain();
        const delaySend = ctx.createGain();
        const delayReturn = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const presenceEq = ctx.createBiquadFilter();
        const comp = ctx.createDynamicsCompressor();

        filter.type = 'lowpass';
        filter.frequency.value = this.activeScore?.padWarmthHz ?? 4600;
        filter.Q.value = 0.5;

        presenceEq.type = 'highshelf';
        presenceEq.frequency.value = 3100;
        presenceEq.gain.value = 1.8;

        comp.threshold.value = -13;
        comp.knee.value = 18;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.007;
        comp.release.value = 0.24;

        master.gain.value = 0;
        dryBus.gain.value = 1.0;
        reverbSend.gain.value = 1.0;
        reverbReturn.gain.value = this.activeScore?.reverbMix ?? 0.42;
        delaySend.gain.value = 1.0;
        delayReturn.gain.value = this.activeScore?.delayMix ?? 0.18;

        dryBus.connect(master);

        if (typeof ctx.createConvolver === 'function') {
          const convolver = ctx.createConvolver();
          convolver.buffer = this.createHallImpulse(ctx);
          reverbSend.connect(convolver);
          convolver.connect(reverbReturn);
          reverbReturn.connect(master);
        } else {
          reverbSend.connect(reverbReturn);
          reverbReturn.connect(master);
        }

        if (typeof ctx.createDelay === 'function') {
          const delayL = ctx.createDelay(1.0);
          const delayR = ctx.createDelay(1.0);
          const fbL = ctx.createGain();
          const fbR = ctx.createGain();
          const delayLp = ctx.createBiquadFilter();

          delayL.delayTime.value = 0.26;
          delayR.delayTime.value = 0.39;
          fbL.gain.value = 0.32;
          fbR.gain.value = 0.29;
          delayLp.type = 'lowpass';
          delayLp.frequency.value = 2400;

          delaySend.connect(delayL);
          delayL.connect(delayR);
          delayR.connect(fbR);
          fbR.connect(delayLp);
          delayLp.connect(delayL);
          delayL.connect(fbL);
          fbL.connect(delayReturn);
          delayR.connect(delayReturn);
          delayReturn.connect(master);
        }

        master.connect(filter);
        filter.connect(presenceEq);

        if (typeof ctx.createWaveShaper === 'function') {
          const tapeShaper = ctx.createWaveShaper();
          tapeShaper.curve = makeWarmSaturationCurve();
          tapeShaper.oversample = '2x';
          presenceEq.connect(tapeShaper);
          tapeShaper.connect(comp);
        } else {
          presenceEq.connect(comp);
        }
        comp.connect(ctx.destination);

        this.musicMasterGain = master;
        this.musicDryBus = dryBus;
        this.musicReverbSend = reverbSend;
        this.musicReverbReturn = reverbReturn;
        this.musicDelaySend = delaySend;
        this.musicDelayReturn = delayReturn;
        this.musicWarmFilter = filter;
        this.musicCompressor = comp;
      }
      return this.musicMasterGain;
    } catch {
      return null;
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const len = Math.floor(ctx.sampleRate * 0.65);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
    return buf;
  }

  private connectVoiceOut(
    ctx: AudioContext,
    source: AudioNode,
    pan: number,
    reverbAmount: number,
    delayAmount: number
  ): void {
    const dry = this.musicDryBus;
    const rev = this.musicReverbSend;
    const del = this.musicDelaySend;
    if (!dry) return;

    let outNode: AudioNode = source;
    if (typeof ctx.createStereoPanner === 'function' && Math.abs(pan) > 0.01) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      source.connect(panner);
      outNode = panner;
    }

    outNode.connect(dry);

    if (rev && reverbAmount > 0.01) {
      const rSend = ctx.createGain();
      rSend.gain.value = reverbAmount;
      outNode.connect(rSend);
      rSend.connect(rev);
    }
    if (del && delayAmount > 0.01) {
      const dSend = ctx.createGain();
      dSend.gain.value = delayAmount;
      outNode.connect(dSend);
      dSend.connect(del);
    }
  }

  public unlock(): void {
    this.unlocked = true;
    const ctx = this.ensureContext();
    if (ctx && this.currentBiome && !this.seqActive) {
      const b = this.currentBiome;
      this.currentBiome = null;
      this.updateBiomeAmbience(b);
    }
  }

  public updateBiomeAmbience(biome: AnyBiomeId): void {
    const sameBiome = this.currentBiome === biome && this.seqActive;
    this.currentBiome = biome;
    const score = getBiomeMusicScore(biome);
    this.activeScore = score;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const bus = this.ensureMusicBus(ctx);
    if (!bus) return;

    try {
      if (this.musicWarmFilter) {
        this.musicWarmFilter.frequency.setTargetAtTime(score.padWarmthHz, ctx.currentTime, 0.35);
      }
      if (this.musicReverbReturn) {
        this.musicReverbReturn.gain.setTargetAtTime(score.reverbMix, ctx.currentTime, 0.35);
      }
      if (this.musicDelayReturn) {
        this.musicDelayReturn.gain.setTargetAtTime(score.delayMix, ctx.currentTime, 0.35);
      }

      if (!sameBiome) {
        this.seqStep = 0;
        this.nextNoteTime = ctx.currentTime + 0.08;
      }

      this.seqActive = true;
      const targetVol =
        this.muted || (typeof document !== 'undefined' && document.hidden)
          ? 0
          : score.masterVolume;
      bus.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.25);

      if (this.seqTimer === null && typeof window !== 'undefined') {
        this.seqTimer = window.setInterval(() => this.schedulerTick(), 38);
      }
    } catch {
      // Ignore audio errors in headless environments
    }
  }

  public stopAmbience(): void {
    this.seqActive = false;
    if (this.seqTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.seqTimer);
      this.seqTimer = null;
    }
    if (this.musicMasterGain && this.ctx) {
      try {
        this.musicMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private schedulerTick(): void {
    if (!this.seqActive || !this.ctx || !this.activeScore || !this.musicMasterGain) return;
    if (this.muted || this.ctx.state !== 'running') {
      this.nextNoteTime = this.ctx.currentTime + 0.06;
      return;
    }
    if (typeof document !== 'undefined' && document.hidden) return;

    const score = this.activeScore;
    const stepDuration = 60 / score.bpm / score.subdivision;
    const scheduleAhead = 0.18;
    const totalSteps = score.length || SONG_LENGTH;

    if (this.nextNoteTime < this.ctx.currentTime - 0.25) {
      this.nextNoteTime = this.ctx.currentTime + 0.04;
    }

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAhead) {
      this.scheduleStep(this.ctx, score, this.seqStep, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.seqStep = (this.seqStep + 1) % totalSteps;
    }
  }

  private scheduleStep(
    ctx: AudioContext,
    score: BiomeMusicScore,
    step: number,
    time: number,
    stepDur: number
  ): void {
    const section = getSectionAtStep(step);
    const bar = Math.floor(step / 8);
    const combatBoost = this.bossActive ? 1.18 : 0.92 + this.combatIntensity * 0.24;

    // 1. Lush Rolled/Sustained 4-Note Stereo Pad / Choir / Ensemble Chord (on downbeats)
    if (step % 8 === 0) {
      const chord = score.chords[bar % score.chords.length];
      const chordDur = stepDur * 7.85;
      const secGain =
        section === 'D'
          ? 1.18
          : section === 'B'
            ? 1.06
            : section === 'C'
              ? 0.94
              : section === 'INTRO' || section === 'OUTRO'
                ? 0.78
                : 0.90;
      const pans = [-0.42, 0.38, -0.18, 0.24];
      const stagger =
        score.chordVoicingStyle === 'rolled'
          ? 0.022
          : score.chordVoicingStyle === 'arpeggiated'
            ? 0.042
            : 0.0;
      chord.forEach((midi, idx) => {
        const baseVol = idx === 0 ? 0.115 : idx === 3 ? 0.088 : 0.095;
        this.playEnsemblePadVoice(
          ctx,
          score.padTimbre,
          midiToFreq(midi),
          time + idx * stagger,
          Math.max(0.25, chordDur - idx * stagger),
          baseVol * secGain,
          pans[idx % pans.length]
        );
      });
    }

    // 2. Expressive Lead Melody with Dynamic Velocity, Grace-Note Ornament & Climax Octave Sparkle
    const melMidi = score.melody[step];
    if (melMidi !== null && melMidi !== undefined) {
      const holdSteps = computeNoteSteps(score.melody, step, 8);
      const dur = Math.max(stepDur * 0.85, holdSteps * stepDur * 0.95);
      const vel = score.melodyVelocity?.[step] ?? 1.0;

      // Subtle grace-note pickup on held lyrical peaks in Section B & D
      if ((section === 'B' || section === 'D') && vel >= 1.05 && holdSteps >= 3) {
        this.playTimbreNote(
          ctx,
          score.leadTimbre,
          midiToFreq(melMidi - 2),
          Math.max(ctx.currentTime, time - 0.026),
          0.06,
          0.13 * vel,
          -0.08
        );
      }

      this.playTimbreNote(
        ctx,
        score.leadTimbre,
        midiToFreq(melMidi),
        time,
        dur,
        0.31 * vel,
        0.0
      );

      // In Section D Climax, soar with octave violin/celesta shimmer
      if (section === 'D' && step % 8 === 0 && holdSteps >= 2) {
        this.playTimbreNote(
          ctx,
          'violin',
          midiToFreq(Math.min(100, melMidi + 12)),
          time,
          dur * 0.94,
          0.125,
          -0.30
        );
      }
    }

    // 3. Orchestral Counter-Melody / Dialogue Voice
    const counterMidi = score.counterMelody?.[step];
    if (counterMidi !== null && counterMidi !== undefined) {
      const holdCounter = computeNoteSteps(score.counterMelody, step, 8);
      const dur = Math.max(stepDur * 0.9, holdCounter * stepDur * 0.94);
      const cVol = (section === 'D' ? 0.24 : section === 'C' ? 0.23 : 0.19) * combatBoost;
      this.playTimbreNote(ctx, score.counterTimbre, midiToFreq(counterMidi), time, dur, cVol, 0.30);
    }

    // 4. Piano / Harp / Koto / Lute Accompaniment
    const arpMidi = score.counterArp[step];
    if (arpMidi !== null && arpMidi !== undefined) {
      const panAlt = step % 4 < 2 ? -0.32 : -0.14;
      const aVol = section === 'D' ? 0.185 : section === 'INTRO' || section === 'OUTRO' ? 0.135 : 0.16;
      this.playTimbreNote(
        ctx,
        score.arpTimbre,
        midiToFreq(arpMidi),
        time,
        stepDur * 1.48,
        aVol,
        panAlt
      );
    }

    // 5. Kinetic 7th-Layer Ostinato (Spiccato / Pizzicato / Marimba / Clockwork Pulse)
    const ostMidi = score.ostinato?.[step];
    if (ostMidi !== null && ostMidi !== undefined) {
      const oVol =
        (section === 'D' ? 0.145 : section === 'B' ? 0.12 : section === 'INTRO' || section === 'OUTRO' ? 0.08 : 0.095) *
        combatBoost;
      const panOst = step % 2 === 0 ? 0.22 : -0.22;
      this.playTimbreNote(
        ctx,
        score.ostinatoTimbre ?? 'pizzicato',
        midiToFreq(ostMidi),
        time,
        stepDur * 0.72,
        oVol,
        panOst
      );
    }

    // 6. Dual-Layer Acoustic & Sub-Bass Anchor
    const bassMidi = score.bass[step];
    if (bassMidi !== null && bassMidi !== undefined) {
      const holdBass = computeNoteSteps(score.bass, step, 6);
      const dur = holdBass * stepDur * 0.92;
      const bVol = section === 'D' ? 0.31 : section === 'C' ? 0.23 : 0.27;
      this.playBassVoice(ctx, midiToFreq(bassMidi), time, dur, bVol);
    }

    // 7. Multi-Piece Percussion & Timpani
    const drum = score.drums[step];
    if (drum) {
      const dPow = (section === 'D' ? 1.15 : section === 'INTRO' || section === 'OUTRO' ? 0.65 : 1.0) * combatBoost;
      this.playDrumVoice(ctx, drum, time, dPow);
    }
  }

  /** 2-Operator FM synthesis voice for crystalline acoustic pianos, bells, marimbas, plucked strings, & brass */
  private playFmVoice(
    ctx: AudioContext,
    carrierType: OscillatorType,
    modType: OscillatorType,
    freq: number,
    modRatio: number,
    modIndexStart: number,
    modIndexEnd: number,
    modDecay: number,
    attack: number,
    sustainRatio: number,
    time: number,
    dur: number,
    vol: number,
    pan: number,
    reverbSend: number,
    delaySend: number,
    filterHz: number,
    vibratoDepth = 0
  ): void {
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    const env = ctx.createGain();

    carrier.type = carrierType;
    mod.type = modType;
    carrier.frequency.setValueAtTime(freq, time);
    mod.frequency.setValueAtTime(freq * modRatio, time);

    modGain.gain.setValueAtTime(freq * modIndexStart, time);
    modGain.gain.exponentialRampToValueAtTime(
      Math.max(1, freq * modIndexEnd),
      time + Math.min(dur, modDecay)
    );

    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(filterHz, time);
    filt.Q.value = 0.65;

    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(vol, time + attack);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0008, vol * sustainRatio),
      time + Math.min(dur * 0.65, attack + 0.22)
    );
    env.gain.exponentialRampToValueAtTime(0.0004, time + dur);

    if (vibratoDepth > 0) {
      this.addVibrato(ctx, [carrier], freq, time, dur, vibratoDepth, 5.2);
    }

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filt);
    filt.connect(env);
    this.connectVoiceOut(ctx, env, pan, reverbSend, delaySend);

    mod.start(time);
    carrier.start(time);
    mod.stop(time + dur + 0.03);
    carrier.stop(time + dur + 0.03);
  }

  /** Lush 3-voice stereo ensemble pad & dual-formant vowel choir */
  private playEnsemblePadVoice(
    ctx: AudioContext,
    timbre: SynthTimbre,
    freq: number,
    time: number,
    dur: number,
    vol: number,
    pan: number
  ): void {
    const isChoir = timbre === 'choir';
    const isOrgan = timbre === 'organ';
    const isStrings = timbre === 'violin' || timbre === 'cello';

    const oscL = ctx.createOscillator();
    const oscC = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const g = ctx.createGain();

    oscL.type = isChoir || isStrings ? 'sawtooth' : 'triangle';
    oscC.type = isChoir ? 'triangle' : isStrings ? 'sawtooth' : 'sine';
    oscR.type = isChoir || isStrings ? 'sawtooth' : 'triangle';

    oscL.frequency.setValueAtTime(freq * 0.9955, time);
    oscC.frequency.setValueAtTime(freq, time);
    oscR.frequency.setValueAtTime(freq * 1.0048, time);

    const attack = Math.min(0.42, dur * 0.34);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol * 0.88, time + attack);
    g.gain.setValueAtTime(vol * 0.74, time + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0004, time + dur);

    if (isChoir) {
      // Parallel vocal vowel formants ("Ah" -> "Oh")
      const f1 = ctx.createBiquadFilter();
      const f2 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(720, time);
      f1.Q.value = 2.0;
      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(1240, time);
      f2.Q.value = 2.6;

      oscL.connect(f1);
      oscC.connect(f1);
      oscR.connect(f2);
      f1.connect(g);
      f2.connect(g);
    } else {
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(isOrgan ? 1750 : isStrings ? 2450 : 2000, time);
      filt.Q.value = 0.65;
      oscL.connect(filt);
      oscC.connect(filt);
      oscR.connect(filt);
      filt.connect(g);
    }

    this.connectVoiceOut(ctx, g, pan, 0.58, 0.08);
    oscL.start(time);
    oscC.start(time);
    oscR.start(time);
    oscL.stop(time + dur + 0.04);
    oscC.stop(time + dur + 0.04);
    oscR.stop(time + dur + 0.04);
  }

  private playBassVoice(
    ctx: AudioContext,
    freq: number,
    time: number,
    dur: number,
    vol: number
  ): void {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    sub.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    sub.frequency.setValueAtTime(freq * 0.5, time);
    subGain.gain.setValueAtTime(0.62, time);

    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(560, time);
    filt.frequency.exponentialRampToValueAtTime(165, time + dur);
    filt.Q.value = 1.2;

    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.012);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol * 0.54), time + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0005, time + dur);

    osc.connect(filt);
    sub.connect(subGain);
    subGain.connect(g);
    filt.connect(g);
    this.connectVoiceOut(ctx, g, 0, 0.06, 0);

    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.02);
    sub.stop(time + dur + 0.02);
  }

  private addVibrato(
    ctx: AudioContext,
    oscs: OscillatorNode[],
    freq: number,
    time: number,
    dur: number,
    depthRatio = 0.005,
    rate = 5.2
  ): void {
    if (dur < 0.22) return;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(rate, time);
    lfoGain.gain.setValueAtTime(0, time);
    lfoGain.gain.linearRampToValueAtTime(freq * depthRatio, time + Math.min(0.18, dur * 0.45));
    lfo.connect(lfoGain);
    for (const o of oscs) {
      lfoGain.connect(o.frequency);
    }
    lfo.start(time);
    lfo.stop(time + dur + 0.02);
  }

  private playTimbreNote(
    ctx: AudioContext,
    timbre: SynthTimbre,
    freq: number,
    time: number,
    dur: number,
    vol: number,
    pan = 0
  ): void {
    // 2-Op FM Acoustic Instruments
    if (timbre === 'piano') {
      this.playFmVoice(
        ctx,
        'sine',
        'sine',
        freq,
        2.0,
        2.6,
        0.35,
        0.42,
        0.004,
        0.42,
        time,
        dur,
        vol,
        pan,
        0.50,
        0.22,
        Math.min(5800, freq * 7.5)
      );
      return;
    }
    if (timbre === 'celesta' || timbre === 'musicbox') {
      this.playFmVoice(
        ctx,
        'sine',
        'sine',
        freq,
        timbre === 'musicbox' ? 3.5 : 4.0,
        2.4,
        0.15,
        0.32,
        0.003,
        0.32,
        time,
        dur,
        vol * 0.92,
        pan,
        0.60,
        0.30,
        6200
      );
      return;
    }
    if (timbre === 'marimba') {
      this.playFmVoice(
        ctx,
        'sine',
        'triangle',
        freq,
        4.0,
        1.8,
        0.08,
        0.09,
        0.002,
        0.22,
        time,
        dur,
        vol,
        pan,
        0.38,
        0.22,
        3400
      );
      return;
    }
    if (timbre === 'horn' || timbre === 'trumpet') {
      const isTrp = timbre === 'trumpet';
      this.playFmVoice(
        ctx,
        'sawtooth',
        'sine',
        freq,
        1.0,
        isTrp ? 2.1 : 1.5,
        0.65,
        0.18,
        isTrp ? 0.022 : 0.045,
        0.74,
        time,
        dur,
        vol * 0.95,
        pan,
        0.46,
        0.14,
        isTrp ? 3400 : 2100,
        0.0035
      );
      return;
    }

    // Dual/Triple Oscillator Ensembles & Plucked Acoustic Models
    const osc = ctx.createOscillator();
    const over = ctx.createOscillator();
    const overGain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    const env = ctx.createGain();

    let attack = 0.014;
    let overRatio = 2;
    let overLevel = 0.24;
    let reverbSend = 0.38;
    let delaySend = 0.18;
    let useDetuneVoice = false;
    let vibratoDepth = 0;

    if (timbre === 'violin' || timbre === 'cello') {
      osc.type = 'sawtooth';
      over.type = 'sawtooth';
      overRatio = 1.0052;
      overLevel = 0.88;
      attack = Math.min(0.085, dur * 0.28);
      reverbSend = 0.54;
      delaySend = 0.14;
      useDetuneVoice = true;
      vibratoDepth = timbre === 'violin' ? 0.0055 : 0.0042;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(timbre === 'violin' ? 3100 : 1480, time);
      filt.Q.value = 0.9;
    } else if (timbre === 'choir') {
      osc.type = 'sawtooth';
      over.type = 'triangle';
      overRatio = 1.0035;
      overLevel = 0.72;
      attack = Math.min(0.14, dur * 0.35);
      reverbSend = 0.68;
      delaySend = 0.22;
      vibratoDepth = 0.0042;
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(840, time);
      filt.Q.value = 1.85;
    } else if (timbre === 'flute' || timbre === 'oboe') {
      const isOboe = timbre === 'oboe';
      osc.type = isOboe ? 'sawtooth' : 'sine';
      over.type = isOboe ? 'square' : 'triangle';
      overRatio = 2;
      overLevel = isOboe ? 0.22 : 0.16;
      attack = Math.min(0.055, dur * 0.22);
      reverbSend = 0.48;
      delaySend = 0.22;
      vibratoDepth = 0.005;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(isOboe ? 2250 : 2900, time);
      if (!isOboe) {
        const breath = ctx.createBufferSource();
        breath.buffer = this.getNoiseBuffer(ctx);
        const bFilt = ctx.createBiquadFilter();
        bFilt.type = 'bandpass';
        bFilt.frequency.setValueAtTime(2250, time);
        const bGain = ctx.createGain();
        bGain.gain.setValueAtTime(vol * 0.09, time);
        bGain.gain.exponentialRampToValueAtTime(0.0005, time + 0.05);
        breath.connect(bFilt);
        bFilt.connect(bGain);
        bGain.connect(env);
        breath.start(time);
        breath.stop(time + 0.06);
      }
    } else if (timbre === 'harp' || timbre === 'lute' || timbre === 'koto' || timbre === 'pizzicato') {
      osc.type = timbre === 'pizzicato' ? 'sawtooth' : 'triangle';
      over.type = 'sine';
      overRatio = timbre === 'koto' ? 2 : 1.5;
      overLevel = 0.28;
      attack = 0.003;
      reverbSend = timbre === 'pizzicato' ? 0.34 : 0.48;
      delaySend = timbre === 'pizzicato' ? 0.12 : 0.24;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(timbre === 'pizzicato' ? 2500 : 4100, time);
      filt.frequency.exponentialRampToValueAtTime(640, time + Math.min(dur, 0.42));
      if (timbre === 'koto') {
        osc.frequency.setValueAtTime(freq * 0.94, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.045);
      }
    } else if (timbre === 'harpsichord') {
      osc.type = 'sawtooth';
      over.type = 'square';
      overRatio = 2;
      overLevel = 0.22;
      attack = 0.002;
      reverbSend = 0.36;
      delaySend = 0.18;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(4800, time);
      filt.frequency.exponentialRampToValueAtTime(1250, time + Math.min(dur, 0.4));
    } else if (timbre === 'organ') {
      osc.type = 'triangle';
      over.type = 'sine';
      overRatio = 2;
      overLevel = 0.45;
      attack = 0.032;
      reverbSend = 0.58;
      delaySend = 0.12;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(2550, time);
    } else if (timbre === 'clockwork') {
      osc.type = 'triangle';
      over.type = 'square';
      overRatio = 2;
      overLevel = 0.16;
      attack = 0.002;
      reverbSend = 0.36;
      delaySend = 0.26;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(3600, time);
      filt.frequency.exponentialRampToValueAtTime(950, time + dur);
    } else {
      osc.type = 'sawtooth';
      over.type = 'sawtooth';
      overRatio = 1.0058;
      overLevel = 0.58;
      attack = 0.012;
      reverbSend = 0.44;
      delaySend = 0.28;
      vibratoDepth = 0.0042;
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(3600, time);
      filt.frequency.exponentialRampToValueAtTime(1250, time + dur);
    }

    if (timbre !== 'koto') {
      osc.frequency.setValueAtTime(freq, time);
    }
    over.frequency.setValueAtTime(freq * overRatio, time);
    overGain.gain.setValueAtTime(overLevel, time);

    if (vibratoDepth > 0) {
      this.addVibrato(ctx, useDetuneVoice ? [osc, over] : [osc], freq, time, dur, vibratoDepth, 5.2);
    }

    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(vol, time + attack);
    const sustainLevel = Math.max(
      0.0008,
      vol * (timbre === 'organ' || timbre === 'choir' || timbre === 'violin' ? 0.78 : 0.45)
    );
    env.gain.exponentialRampToValueAtTime(sustainLevel, time + Math.min(dur * 0.65, attack + 0.22));
    env.gain.exponentialRampToValueAtTime(0.0004, time + dur);

    osc.connect(filt);
    over.connect(overGain);
    overGain.connect(filt);
    filt.connect(env);
    this.connectVoiceOut(ctx, env, pan, reverbSend, delaySend);

    osc.start(time);
    over.start(time);
    osc.stop(time + dur + 0.03);
    over.stop(time + dur + 0.03);
  }

  private playDrumVoice(ctx: AudioContext, kind: DrumStep, time: number, intensity = 1): void {
    if (!kind) return;
    if (kind === 'K') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.13);
      g.gain.setValueAtTime(0.30 * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.16);
      osc.connect(g);
      this.connectVoiceOut(ctx, g, 0, 0.06, 0);
      osc.start(time);
      osc.stop(time + 0.17);
    } else if (kind === 'S') {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(1820, time);
      filt.Q.value = 0.85;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15 * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.12);
      src.connect(filt);
      filt.connect(g);
      this.connectVoiceOut(ctx, g, 0.06, 0.26, 0.05);
      src.start(time);
      src.stop(time + 0.13);

      const body = ctx.createOscillator();
      const bg = ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(198, time);
      body.frequency.exponentialRampToValueAtTime(112, time + 0.07);
      bg.gain.setValueAtTime(0.11 * intensity, time);
      bg.gain.exponentialRampToValueAtTime(0.0005, time + 0.08);
      body.connect(bg);
      this.connectVoiceOut(ctx, bg, 0, 0.14, 0);
      body.start(time);
      body.stop(time + 0.09);
    } else if (kind === 'H' || kind === 'O') {
      const isOpen = kind === 'O';
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      const filt = ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.setValueAtTime(isOpen ? 5600 : 6500, time);
      const g = ctx.createGain();
      const dur = isOpen ? 0.24 : 0.045;
      g.gain.setValueAtTime((isOpen ? 0.072 : 0.055) * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + dur);
      src.connect(filt);
      filt.connect(g);
      this.connectVoiceOut(ctx, g, 0.18, isOpen ? 0.32 : 0.12, 0.06);
      src.start(time);
      src.stop(time + dur + 0.02);
    } else if (kind === 'M') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(178, time);
      osc.frequency.exponentialRampToValueAtTime(82, time + 0.17);
      g.gain.setValueAtTime(0.22 * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.21);
      osc.connect(g);
      this.connectVoiceOut(ctx, g, -0.18, 0.40, 0);
      osc.start(time);
      osc.stop(time + 0.22);
    } else if (kind === 'C') {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      const filt = ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.setValueAtTime(4200, time);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.115 * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.60);
      src.connect(filt);
      filt.connect(g);
      this.connectVoiceOut(ctx, g, -0.15, 0.64, 0.12);
      src.start(time);
      src.stop(time + 0.62);
    } else if (kind === 'R') {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(6200, time);
      filt.Q.value = 1.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.045 * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.05);
      src.connect(filt);
      filt.connect(g);
      this.connectVoiceOut(ctx, g, -0.22, 0.20, 0.06);
      src.start(time);
      src.stop(time + 0.06);
    } else if (kind === 'T') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1040, time);
      osc.frequency.exponentialRampToValueAtTime(660, time + 0.045);
      g.gain.setValueAtTime(0.095 * intensity, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.06);
      osc.connect(g);
      this.connectVoiceOut(ctx, g, 0.24, 0.36, 0.16);
      osc.start(time);
      osc.stop(time + 0.07);
    }
  }

  /** Plays a multi-section 64-step preview (INTRO bloom + Section A exposition + entrance into B) */
  public playJukeboxPreview(trackId: string): void {
    if (this.muted) return;
    this.unlock();
    const mappedBiome = JUKEBOX_TO_BIOME[trackId] ?? 'silver_ash';
    if (this.seqActive) {
      this.updateBiomeAmbience(mappedBiome);
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;
    const bus = this.ensureMusicBus(ctx);
    if (!bus) return;

    const score = BIOME_MUSIC_SCORES[mappedBiome] ?? BIOME_MUSIC_SCORES.silver_ash;
    const stepDur = 60 / score.bpm / score.subdivision;
    const now = ctx.currentTime + 0.03;

    try {
      if (this.musicWarmFilter) {
        this.musicWarmFilter.frequency.setTargetAtTime(score.padWarmthHz, now, 0.15);
      }
      if (this.musicReverbReturn) {
        this.musicReverbReturn.gain.setTargetAtTime(score.reverbMix, now, 0.15);
      }
      if (this.musicDelayReturn) {
        this.musicDelayReturn.gain.setTargetAtTime(score.delayMix, now, 0.15);
      }
      bus.gain.setTargetAtTime(score.masterVolume, now, 0.04);
      // Showcase 64-step orchestral opening (INTRO + A + surge into B)
      for (let i = 0; i < 64; i++) {
        this.scheduleStep(ctx, score, i, now + i * stepDur, stepDur);
      }
      if (!this.seqActive) {
        bus.gain.setTargetAtTime(0, now + stepDur * 64.5, 0.35);
      }
    } catch {
      // Ignore audio errors
    }
  }

  public playTone(
    freq: number,
    duration = 0.14,
    type: OscillatorType = 'triangle',
    volume = 0.08
  ): void {
    this.tone(freq, freq, duration, type, volume, 0);
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delay = 0
  ): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const jitter = 1 + (Math.random() - 0.5) * 0.06;
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freqStart * jitter), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd * jitter), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public playJump(wall = false): void {
    if (wall) {
      this.tone(240, 520, 0.09, 'triangle', 0.09);
    } else {
      this.tone(190, 440, 0.095, 'triangle', 0.09);
    }
  }

  public playDash(superTech = false): void {
    if (superTech) {
      this.tone(420, 140, 0.14, 'sawtooth', 0.11);
      this.tone(660, 880, 0.12, 'triangle', 0.07, 0.02);
    } else {
      this.tone(340, 110, 0.12, 'sawtooth', 0.1);
      this.tone(220, 90, 0.09, 'square', 0.05);
    }
  }

  public playLand(heavy = false): void {
    this.tone(heavy ? 130 : 165, 55, heavy ? 0.09 : 0.05, 'triangle', heavy ? 0.09 : 0.05);
  }

  public playSpring(): void {
    this.tone(260, 720, 0.15, 'triangle', 0.1);
    this.tone(390, 860, 0.12, 'sine', 0.06, 0.03);
  }

  public playCrystal(): void {
    this.tone(587.33, 880, 0.08, 'sine', 0.08);
    this.tone(880, 1174.66, 0.11, 'triangle', 0.07, 0.04);
  }

  public playRelic(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.tone(n, n * 1.02, 0.12, 'triangle', 0.085, i * 0.055);
    });
  }

  public playKeyOrSwitch(): void {
    this.tone(440, 660, 0.09, 'sine', 0.08);
    this.tone(660, 990, 0.13, 'triangle', 0.08, 0.05);
  }

  public playDeath(): void {
    this.tone(280, 70, 0.22, 'sawtooth', 0.12);
    this.tone(190, 52, 0.25, 'square', 0.09, 0.04);
  }

  public playRespawn(): void {
    this.tone(220, 440, 0.11, 'sine', 0.06);
  }

  public playEnemyHit(killed = false): void {
    if (killed) {
      this.tone(360, 95, 0.14, 'sawtooth', 0.1);
      this.tone(520, 780, 0.1, 'triangle', 0.07, 0.03);
    } else {
      this.tone(240, 140, 0.08, 'square', 0.08);
    }
  }

  public playParry(): void {
    this.tone(620, 1240, 0.11, 'triangle', 0.11);
    this.tone(930, 1480, 0.13, 'sine', 0.08, 0.02);
  }

  public playDialogueBlip(pitch = 1): void {
    this.tone(320 * pitch, 340 * pitch, 0.035, 'square', 0.035);
  }

  public playCrumble(): void {
    this.tone(140, 65, 0.14, 'sawtooth', 0.06);
  }

  public playVictory(): void {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((n, i) => {
      this.tone(n, n, 0.3, 'triangle', 0.08, i * 0.08);
    });
  }

  public playBossRoar(): void {
    this.tone(130, 58, 0.36, 'sawtooth', 0.12);
    this.tone(92, 46, 0.42, 'square', 0.08, 0.05);
  }

  public playBossLaser(): void {
    this.tone(680, 210, 0.22, 'sawtooth', 0.1);
    this.tone(1120, 420, 0.16, 'triangle', 0.07, 0.02);
  }

  public playWaveStart(): void {
    const notes = [392.0, 493.88, 587.33];
    notes.forEach((n, i) => {
      this.tone(n, n * 1.05, 0.12, 'triangle', 0.075, i * 0.06);
    });
  }
}

export const gameAudio = new GameAudio();
