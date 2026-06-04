/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private rainNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private isMuted: boolean = false;

  // Custom scene ambient trackers
  private ambientVolume: number = Number(localStorage.getItem('game_ambient_volume') || '0.5');
  private bgmVolume: number = Number(localStorage.getItem('game_bgm_volume') || '0.4');
  private currentBgmTrack: number = Number(localStorage.getItem('game_bgm_track') || '1'); // 1, 2, 3 or 0 (muted)

  private rainGainNode: GainNode | null = null;
  private roomGainNode: GainNode | null = null;
  private bgmGainNode: GainNode | null = null;

  private currentRoom: string | null = null;
  private roomAmbientInterval: any = null;
  private roomAmbientInterval2: any = null;
  private roomWebAudioNodes: any[] = [];

  // BGM sequencer states
  private bgmInterval: any = null;
  private bgmStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx) {
      if (!this.rainGainNode) {
        this.rainGainNode = this.ctx.createGain();
        this.rainGainNode.gain.value = 0.06 * this.ambientVolume;
        this.rainGainNode.connect(this.ctx.destination);
      }
      if (!this.roomGainNode) {
        this.roomGainNode = this.ctx.createGain();
        this.roomGainNode.gain.value = this.ambientVolume;
        this.roomGainNode.connect(this.ctx.destination);
      }
      if (!this.bgmGainNode) {
        this.bgmGainNode = this.ctx.createGain();
        this.bgmGainNode.gain.value = this.bgmVolume;
        this.bgmGainNode.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  }

  getAmbientVolume() {
    return this.ambientVolume;
  }

  setAmbientVolume(vol: number) {
    this.ambientVolume = vol;
    localStorage.setItem('game_ambient_volume', String(vol));
    this.updateAmbientNodeVolumes();
  }

  getBgmVolume() {
    return this.bgmVolume;
  }

  setBgmVolume(vol: number) {
    this.bgmVolume = vol;
    localStorage.setItem('game_bgm_volume', String(vol));
    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  getCurrentBgmTrack() {
    return this.currentBgmTrack;
  }

  setCurrentBgmTrack(track: number) {
    this.currentBgmTrack = track;
    localStorage.setItem('game_bgm_track', String(track));
    if (track === 0) {
      this.stopBgm();
    } else {
      this.stopBgm();
      this.startBgm();
    }
  }

  private updateAmbientNodeVolumes() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (this.ctx) {
      if (this.rainGainNode) {
        this.rainGainNode.gain.setValueAtTime(0.06 * this.ambientVolume, now);
      }
      if (this.roomGainNode) {
        this.roomGainNode.gain.setValueAtTime(this.ambientVolume, now);
      }
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
    if (this.roomGainNode) {
      gain.connect(this.roomGainNode);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Deep echoy dripping sound for Wine Cellar
  playCellarDrip() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    if (this.roomGainNode) {
      gain.connect(this.roomGainNode);
    } else {
      gain.connect(this.ctx.destination);
    }

    // Add a simple delayed echo feedback to simulate cave-like environment
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.18;
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = 0.35;

    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Low frequency background hum for Wine Cellar
  startCellarHum() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [42, 63, 85];
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.04, now);
      
      osc.connect(gain);
      if (this.roomGainNode) {
        gain.connect(this.roomGainNode);
      } else {
        gain.connect(this.ctx!.destination);
      }
      
      osc.start(now);
      this.roomWebAudioNodes.push(osc);
    });
  }

  // Fireplace low warm draft rumbling loop for Living Room
  startFireRumble() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, now);
    
    gain.gain.setValueAtTime(0.03, now);
    
    osc.connect(gain);
    if (this.roomGainNode) {
      gain.connect(this.roomGainNode);
    } else {
      gain.connect(this.ctx!.destination);
    }
    
    osc.start(now);
    this.roomWebAudioNodes.push(osc);
  }

  // Floorboard squeak for Hallway
  playCorridorCreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(105, now + 0.45);

    gain.gain.setValueAtTime(0.008, now);
    gain.gain.linearRampToValueAtTime(0.012, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    if (this.roomGainNode) {
      gain.connect(this.roomGainNode);
    } else {
      gain.connect(this.ctx.destination);
    }
    osc.start(now);
    osc.stop(now + 0.55);
  }

  // Howling hallway wind with slow dynamic LFO sweeping
  startHallwayWind() {
    if (!this.ctx) return;
    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const windSource = this.ctx.createBufferSource();
      windSource.buffer = buffer;
      windSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 300;
      filter.Q.value = 4.2;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.012;

      windSource.connect(filter);
      filter.connect(gain);
      if (this.roomGainNode) {
        gain.connect(this.roomGainNode);
      } else {
        gain.connect(this.ctx.destination);
      }

      windSource.start(0);
      this.roomWebAudioNodes.push(windSource);

      let phase = 0;
      const modulate = () => {
        if (this.currentRoom !== 'Hallway' || this.isMuted) return;
        phase += 0.055;
        const freq = 220 + Math.sin(phase) * 110 + Math.cos(phase * 0.4) * 45;
        const vol = 0.008 + (Math.sin(phase * 0.5) + 1) * 0.012;
        try {
          filter.frequency.setValueAtTime(freq, this.ctx!.currentTime);
          gain.gain.setValueAtTime(vol, this.ctx!.currentTime);
        } catch (e) {}

        this.roomAmbientInterval = setTimeout(modulate, 90);
      };
      modulate();
    } catch (err) {}
  }

  // Room ambient state orchestrator
  startAmbientRoom(location: any) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopAmbientRoom();
    this.currentRoom = location;

    // Create roomGainNode if it doesn't exist
    if (!this.roomGainNode) {
      this.roomGainNode = this.ctx.createGain();
      this.roomGainNode.gain.value = this.ambientVolume;
      this.roomGainNode.connect(this.ctx.destination);
    }

    if (location === 'WineCellar') {
      const playDrip = () => {
        if (this.currentRoom !== 'WineCellar' || this.isMuted) return;
        this.playCellarDrip();
        this.roomAmbientInterval2 = setTimeout(playDrip, 1800 + Math.random() * 3200);
      };
      playDrip();
      this.startCellarHum();
    } else if (location === 'Bedroom') {
      const tickTock = () => {
        if (this.currentRoom !== 'Bedroom' || this.isMuted) return;
        
        const now = this.ctx!.currentTime;
        const isOdd = Math.floor(now) % 2 === 0;
        
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isOdd ? 850 : 680, now);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        
        osc.connect(gain);
        if (this.roomGainNode) {
          gain.connect(this.roomGainNode);
        } else {
          gain.connect(this.ctx!.destination);
        }
        
        osc.start(now);
        osc.stop(now + 0.045);
        
        this.roomAmbientInterval = setTimeout(tickTock, 1000);
      };
      tickTock();
    } else if (location === 'Kitchen') {
      const playBubble = () => {
        if (this.currentRoom !== 'Kitchen' || this.isMuted) return;
        
        const now = this.ctx!.currentTime;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80 + Math.random() * 120, now);
        osc.frequency.exponentialRampToValueAtTime(320 + Math.random() * 200, now + 0.04);
        
        gain.gain.setValueAtTime(0.015 + Math.random() * 0.018, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        osc.connect(gain);
        if (this.roomGainNode) {
          gain.connect(this.roomGainNode);
        } else {
          gain.connect(this.ctx!.destination);
        }
        
        osc.start(now);
        osc.stop(now + 0.07);
        
        this.roomAmbientInterval = setTimeout(playBubble, 110 + Math.random() * 320);
      };
      playBubble();
    } else if (location === 'Hallway') {
      this.startHallwayWind();
      const scheduleCreak = () => {
        if (this.currentRoom !== 'Hallway' || this.isMuted) return;
        this.playCorridorCreak();
        this.roomAmbientInterval2 = setTimeout(scheduleCreak, 7500 + Math.random() * 9500);
      };
      scheduleCreak();
    } else if (location === 'LivingRoom') {
      const fireCrackle = () => {
        if (this.currentRoom !== 'LivingRoom' || this.isMuted) return;
        
        if (Math.random() < 0.4) {
          const now = this.ctx!.currentTime;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1600 + Math.random() * 3000, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.01);
          
          gain.gain.setValueAtTime(0.015 + Math.random() * 0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
          
          osc.connect(gain);
          if (this.roomGainNode) {
            gain.connect(this.roomGainNode);
          } else {
            gain.connect(this.ctx!.destination);
          }
          osc.start(now);
          osc.stop(now + 0.018);
        }
        
        this.roomAmbientInterval = setTimeout(fireCrackle, 80 + Math.random() * 240);
      };
      fireCrackle();
      this.startFireRumble();
    }
  }

  stopAmbientRoom() {
    this.currentRoom = null;
    if (this.roomAmbientInterval) {
      clearTimeout(this.roomAmbientInterval);
      this.roomAmbientInterval = null;
    }
    if (this.roomAmbientInterval2) {
      clearTimeout(this.roomAmbientInterval2);
      this.roomAmbientInterval2 = null;
    }
    this.roomWebAudioNodes.forEach(node => {
      try {
        node.stop();
      } catch (err) {}
    });
    this.roomWebAudioNodes = [];
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

      rainSource.connect(filter);
      if (this.rainGainNode) {
        filter.connect(this.rainGainNode);
      } else {
        const volumeNode = this.ctx.createGain();
        volumeNode.gain.value = 0.06;
        filter.connect(volumeNode);
        volumeNode.connect(this.ctx.destination);
      }

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

  // Play piano note synthetically (with hammer click and long natural decay)
  playPianoNote(freq: number) {
    if (this.isMuted || !this.ctx || this.bgmVolume <= 0) return;
    const now = this.ctx.currentTime;
    
    try {
      // 1. Hammer strike
      const oscStrike = this.ctx.createOscillator();
      const gainStrike = this.ctx.createGain();
      oscStrike.type = 'sine';
      oscStrike.frequency.setValueAtTime(freq * 2, now);
      
      gainStrike.gain.setValueAtTime(this.bgmVolume * 0.08, now);
      gainStrike.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      oscStrike.connect(gainStrike);
      if (this.bgmGainNode) gainStrike.connect(this.bgmGainNode);
      else gainStrike.connect(this.ctx.destination);
      
      oscStrike.start(now);
      oscStrike.stop(now + 0.06);
      
      // 2. Primary tone String resonance
      const oscTone = this.ctx.createOscillator();
      const gainTone = this.ctx.createGain();
      oscTone.type = 'triangle';
      oscTone.frequency.setValueAtTime(freq, now);
      
      gainTone.gain.setValueAtTime(this.bgmVolume * 0.16, now);
      gainTone.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      
      oscTone.connect(gainTone);
      if (this.bgmGainNode) gainTone.connect(this.bgmGainNode);
      else gainTone.connect(this.ctx.destination);
      
      oscTone.start(now);
      oscTone.stop(now + 1.3);
    } catch (e) {}
  }

  startBgm() {
    if (this.bgmInterval) return;
    this.initCtx();
    if (!this.ctx) return;
    
    this.bgmStep = 0;
    const tick = () => {
      if (this.isMuted || this.currentBgmTrack === 0) return;
      
      let chord: number[] = [];
      if (this.currentBgmTrack === 1) {
        // Midnight Nocturne: Am, F, Dm, E7 loop
        const trackChords = [
          [220, 261.63, 329.63, 440, 329.63, 261.63, 220, 110], // Am
          [174.61, 220, 261.63, 349.23, 261.63, 220, 174.61, 87.31], // F
          [146.83, 174.61, 220, 293.66, 220, 174.61, 146.83, 73.42], // Dm
          [164.81, 207.65, 246.94, 329.63, 246.94, 207.65, 164.81, 82.41] // E7
        ];
        const chordIndex = Math.floor(this.bgmStep / 8) % 4;
        chord = trackChords[chordIndex];
      } else if (this.currentBgmTrack === 2) {
        // Rainy Suspicion: Dm, Gm, C, F
        const trackChords = [
          [146.83, 220, 293.66, 349.23, 440, 349.23, 293.66, 220],
          [196, 233.08, 293.66, 392, 493.88, 392, 293.66, 196],
          [130.81, 196, 261.63, 329.63, 392, 329.63, 261.63, 196],
          [174.61, 220, 349.23, 440, 523.25, 440, 349.23, 220]
        ];
        const chordIndex = Math.floor(this.bgmStep / 8) % 4;
        chord = trackChords[chordIndex];
      } else if (this.currentBgmTrack === 3) {
        // Clockwork Truth: Em, Am, B7, Em
        const trackChords = [
          [164.81, 329.63, 493.88, 659.25, 493.88, 329.63, 164.81, 82.41],
          [220, 440, 523.25, 880, 523.25, 440, 220, 110],
          [246.94, 493.88, 587.33, 987.77, 587.33, 493.88, 246.94, 123.47],
          [164.81, 329.63, 493.88, 659.25, 493.88, 329.63, 164.81, 82.41]
        ];
        const chordIndex = Math.floor(this.bgmStep / 8) % 4;
        chord = trackChords[chordIndex];
      }
      
      if (chord.length > 0) {
        const noteIndex = this.bgmStep % 8;
        const freq = chord[noteIndex];
        
        if (this.currentBgmTrack === 3 && noteIndex % 2 === 0) {
          this.playPianoNote(freq);
          this.playPianoNote(freq / 2);
        } else {
          this.playPianoNote(freq);
        }
      }
      
      this.bgmStep = (this.bgmStep + 1) % 32;
    };
    
    try {
      tick();
      this.bgmInterval = setInterval(tick, 260);
    } catch (e) {}
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const gameAudio = new AudioSynthesizer();
