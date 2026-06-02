/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private rainNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute && this.ctx) {
      this.ctx.suspend();
    } else if (!mute && this.ctx) {
      this.ctx.resume();
    }
  }

  // 法槌敲击 (Gavel Slam / Hammer)
  playGavel() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Wood impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.15);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    // Second bounce echo (very quiet)
    const bounceOsc = this.ctx.createOscillator();
    const bounceGain = this.ctx.createGain();
    bounceOsc.type = 'triangle';
    bounceOsc.frequency.setValueAtTime(120, now + 0.12);
    bounceOsc.frequency.exponentialRampToValueAtTime(10, now + 0.22);
    bounceGain.gain.setValueAtTime(0.3, now + 0.12);
    bounceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    bounceOsc.connect(bounceGain);
    bounceGain.connect(this.ctx.destination);
    bounceOsc.start(now + 0.12);
    bounceOsc.stop(now + 0.26);
  }

  // 脚步声 (Footsteps - dual acoustic thump)
  playFootstep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);

    // Minor second shoe scuff
    const scuffOsc = this.ctx.createOscillator();
    const scuffGain = this.ctx.createGain();
    scuffOsc.type = 'triangle';
    scuffOsc.frequency.setValueAtTime(200, now + 0.02);
    scuffOsc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
    scuffGain.gain.setValueAtTime(0.1, now + 0.02);
    scuffGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    scuffOsc.connect(scuffGain);
    scuffGain.connect(this.ctx.destination);
    scuffOsc.start(now + 0.02);
    scuffOsc.stop(now + 0.11);
  }

  // 笔记书写声 (Notebook pencil scratch)
  playPencilWrite() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.3;
    
    // Scratch filter noise
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // White noise with simple crackling modification
      data[i] = (Math.random() * 2 - 1) * Math.sin(i / 100);
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  // 玻璃碎裂声 / 线索崩溃 (Glass crunch/clue crumble)
  playGlassShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Generates a metallic resonance
    const pitches = [1800, 2400, 3200, 4100];
    pitches.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.01);
      osc.frequency.linearRampToValueAtTime(freq - 400, now + 0.15 + idx * 0.02);

      gain.gain.setValueAtTime(0.15, now + idx * 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + idx * 0.04);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.01);
      osc.stop(now + 0.35);
    });
  }

  // NPC 爆发心跳声 (Heartbeat)
  playHeartbeat() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Main base hit
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.12);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Second bounce
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(50, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(15, now + 0.27);
    gain2.gain.setValueAtTime(0.6, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.35);
  }

  // Water dripping effect (for Kitchen tap investigation)
  playWaterDrip() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.02); // rapid upward sweep

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Ambient rain generator (white/pinkish noise synthesis)
  startAmbientRain() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.rainNode) return;

    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Let's create soft pink/brown filter noise for ambient rain
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter integration
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        // Scale and add higher frequency sizzles to simulate individual rain droplets
        if (Math.random() < 0.003) {
          output[i] += (Math.random() * 0.5);
        }
      }

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = 400;
      filter.Q.value = 0.7;
      filter.gain.value = 2;

      const volumeNode = this.ctx.createGain();
      volumeNode.gain.value = 0.06; // Quiet ambiance background

      rainSource.connect(filter);
      filter.connect(volumeNode);
      volumeNode.connect(this.ctx.destination);

      rainSource.start(0);
      // @ts-ignore
      this.rainNode = rainSource;
    } catch (e) {
      console.warn('Procedural rain synthesis failed or not allowed on main thread: ', e);
    }
  }

  stopAmbientRain() {
    if (this.rainNode) {
      try {
        // @ts-ignore
        this.rainNode.stop();
      } catch (err) {}
      this.rainNode = null;
    }
  }
}

export const gameAudio = new AudioSynthesizer();
