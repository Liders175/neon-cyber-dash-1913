
class AudioService {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private nextLoopTimeout: number | null = null;

  public async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100,
      });
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (muted) {
        this.ctx.suspend();
      } else {
        this.ctx.resume();
      }
    }
  }

  playJump() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(g).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(10, this.ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.25, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(g).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  async startMusic() {
    if (this.isMuted || this.isPlaying) return;
    const context = await this.init();
    this.isPlaying = true;
    
    this.musicGain = context.createGain();
    this.musicGain.gain.setValueAtTime(0.1, context.currentTime); // Трохи гучніше
    this.musicGain.connect(context.destination);

    const playDrum = (freq: number, time: number, type: 'kick' | 'snare' | 'hihat') => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      
      if (type === 'kick') {
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        o.frequency.exponentialRampToValueAtTime(35, time + 0.12);
        g.gain.setValueAtTime(0.4, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      } else if (type === 'snare') {
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.2, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      } else {
        o.type = 'square'; // Hi-hat simulation
        o.frequency.setValueAtTime(10000, time);
        g.gain.setValueAtTime(0.05, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      }
      
      o.connect(g).connect(this.musicGain!);
      o.start(time); o.stop(time + 0.2);
    };

    const playSynth = (freq: number, time: number, duration: number, type: OscillatorType = 'sawtooth', volume = 0.04) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, time);
      
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(volume, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      o.connect(g).connect(this.musicGain!);
      o.start(time); o.stop(time + duration);
    };

    const scheduleLoop = (startTime: number) => {
      if (!this.isPlaying || !this.ctx) return;
      
      const tempo = 0.12; // Швидкий темп для екшну
      const bassNotes = [65.41, 77.78, 87.31, 58.27]; // C2, Eb2, F2, Bb1
      const leadNotes = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25]; // C4 pentatonic
      
      // Плануємо сітку на 16 кроків (базовий паттерн)
      for(let i = 0; i < 16; i++) {
        const t = startTime + i * tempo;
        
        // Drums
        if (i % 4 === 0) playDrum(110, t, 'kick');
        if (i % 8 === 4) playDrum(200, t, 'snare');
        playDrum(0, t, 'hihat'); // Hi-hat on every beat
        
        // Bass
        const bassNote = bassNotes[Math.floor(i/4) % bassNotes.length];
        playSynth(bassNote, t, tempo * 0.9, 'sawtooth', 0.05);
        
        // Arp/Melody
        if (i % 2 === 0) {
          const melodyNote = leadNotes[(i + Math.floor(Math.random()*2)) % leadNotes.length];
          playSynth(melodyNote, t, tempo * 1.5, 'triangle', 0.03);
        }
      }
      
      const loopDuration = 16 * tempo;
      const nextLoopStart = startTime + loopDuration;
      const delay = (nextLoopStart - this.ctx.currentTime) * 1000 - 50;
      this.nextLoopTimeout = window.setTimeout(() => scheduleLoop(nextLoopStart), Math.max(0, delay));
    };

    scheduleLoop(context.currentTime + 0.1);
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.nextLoopTimeout) {
      clearTimeout(this.nextLoopTimeout);
      this.nextLoopTimeout = null;
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    }
  }
}

export const audioService = new AudioService();
