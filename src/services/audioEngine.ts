import * as Tone from 'tone';
import type { ChordItem } from '../types';

class AudioEngine {
  private sampler: Tone.Sampler | null = null;
  private synthFallback: Tone.PolySynth | null = null;
  private isLoaded = false;
  private isInitialized = false;
  private volumeNode: Tone.Volume | null = null;
  private reverbNode: Tone.Reverb | null = null;
  private chorusNode: Tone.Chorus | null = null;
  private eqNode: Tone.EQ3 | null = null;
  private activeToneMode: 'clean' | 'warm' | 'overdrive' = 'clean';
  private masterGain: number = 0; // dB

  constructor() {
    // Lazy initialized on first user interaction to comply with Web Audio autoplay policies
  }

  public async initAudio(): Promise<boolean> {
    if (this.isInitialized) {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      return this.isLoaded;
    }

    try {
      await Tone.start();

      // Master output volume
      this.volumeNode = new Tone.Volume(this.masterGain).toDestination();

      // Reverb for room ambience
      this.reverbNode = new Tone.Reverb({
        decay: 1.8,
        preDelay: 0.02,
        wet: 0.22,
      }).connect(this.volumeNode);
      await this.reverbNode.generate();

      // Chorus for lush electric guitar feel
      this.chorusNode = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.35,
        wet: 0.15,
      }).connect(this.reverbNode);
      this.chorusNode.start();

      // 3-Band Guitar Amp EQ Stack
      this.eqNode = new Tone.EQ3({
        low: 1,
        mid: 3,
        high: 2,
        lowFrequency: 250,
        highFrequency: 3500,
      }).connect(this.chorusNode);

      // 1. Electric Guitar Soundfont Sampler (Sampled instrument)
      const sampleMap: Record<string, string> = {
        E2: 'E2.mp3',
        A2: 'A2.mp3',
        C3: 'C3.mp3',
        D3: 'D3.mp3',
        G3: 'G3.mp3',
        B3: 'B3.mp3',
        C4: 'C4.mp3',
        E4: 'E4.mp3',
        A4: 'A4.mp3',
        C5: 'C5.mp3',
        E5: 'E5.mp3',
        G5: 'G5.mp3',
      };

      this.sampler = new Tone.Sampler({
        urls: sampleMap,
        baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_clean-mp3/',
        onload: () => {
          this.isLoaded = true;
          // console.log('Electric guitar soundfont sampler loaded');
        },
        onerror: (err) => {
          console.warn('Sampler error, using fallback synth:', err);
          this.isLoaded = false;
        },
      }).connect(this.eqNode);

      // 2. High-quality Karplus-Strong / Plucked Electric Synth Fallback
      this.synthFallback = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle',
        },
        envelope: {
          attack: 0.005,
          decay: 1.4,
          sustain: 0.1,
          release: 0.8,
        },
      }).connect(this.eqNode);
      this.synthFallback.volume.value = -3;

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.error('Failed to initialize audio engine:', e);
      return false;
    }
  }

  public setVolume(db: number) {
    this.masterGain = db;
    if (this.volumeNode) {
      this.volumeNode.volume.rampTo(db, 0.05);
    }
  }

  public setToneMode(mode: 'clean' | 'warm' | 'overdrive') {
    this.activeToneMode = mode;
    if (!this.eqNode || !this.chorusNode || !this.reverbNode) return;

    if (mode === 'clean') {
      this.eqNode.mid.value = 2;
      this.eqNode.high.value = 3;
      this.chorusNode.wet.value = 0.15;
      this.reverbNode.wet.value = 0.22;
    } else if (mode === 'warm') {
      this.eqNode.low.value = 3;
      this.eqNode.mid.value = 4;
      this.eqNode.high.value = 0;
      this.chorusNode.wet.value = 0.35;
      this.reverbNode.wet.value = 0.3;
    } else if (mode === 'overdrive') {
      this.eqNode.mid.value = 6;
      this.eqNode.high.value = 4;
      this.chorusNode.wet.value = 0.05;
      this.reverbNode.wet.value = 0.15;
    }
  }

  public getToneMode(): 'clean' | 'warm' | 'overdrive' {
    return this.activeToneMode;
  }

  /**
   * Play a single note
   */
  public async playNote(note: string, duration = '2n') {
    await this.initAudio();
    const now = Tone.now();
    try {
      if (this.sampler && this.sampler.loaded) {
        this.sampler.triggerAttackRelease(note, duration, now);
      } else if (this.synthFallback) {
        this.synthFallback.triggerAttackRelease(note, duration, now);
      }
    } catch (err) {
      console.warn('Error playing note:', err);
    }
  }

  /**
   * Play a voiced chord with realistic pick strumming (slight time stagger)
   */
  public async playStrum(
    notes: string[],
    durationSeconds = 1.6,
    strumSpeedMs = 24,
    direction: 'down' | 'up' = 'down'
  ) {
    if (!notes || notes.length === 0) return;
    await this.initAudio();

    const orderedNotes = direction === 'down' ? [...notes] : [...notes].reverse();
    const startTime = Tone.now();

    orderedNotes.forEach((note, idx) => {
      const staggerTime = startTime + (idx * strumSpeedMs) / 1000;
      // Slight velocity variation for realism
      const velocity = 0.75 + Math.random() * 0.2;

      try {
        if (this.sampler && this.sampler.loaded) {
          this.sampler.triggerAttackRelease(note, durationSeconds, staggerTime, velocity);
        } else if (this.synthFallback) {
          this.synthFallback.triggerAttackRelease(note, durationSeconds, staggerTime, velocity);
        }
      } catch (err) {
        console.warn('Error in chord strum:', err);
      }
    });
  }

  /**
   * Play the progression sequentially using Tone.Transport
   */
  public async startProgressionPlayback(
    chords: ChordItem[],
    bpm: number,
    beatsPerChord: number,
    loop: boolean,
    onChordHighlight: (index: number) => void,
    onComplete: () => void
  ) {
    if (!chords || chords.length === 0) return;
    await this.initAudio();

    this.stopPlayback();

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    const secondsPerBeat = 60 / bpm;
    const chordDurationSeconds = beatsPerChord * secondsPerBeat;
    const totalProgressionDuration = chords.length * chordDurationSeconds;

    chords.forEach((chord, chordIdx) => {
      const chordStartTime = chordIdx * chordDurationSeconds;

      // Schedule UI chord highlighting
      Tone.Transport.schedule((time) => {
        Tone.Draw.schedule(() => {
          onChordHighlight(chordIdx);
        }, time);
      }, chordStartTime);

      // Schedule guitar notes strumming
      chord.notes.forEach((note, stringIdx) => {
        const strumOffset = (stringIdx * 0.022); // 22ms per string strum
        const noteTime = chordStartTime + strumOffset;

        Tone.Transport.schedule((time) => {
          try {
            if (this.sampler && this.sampler.loaded) {
              this.sampler.triggerAttackRelease(
                note,
                Math.max(0.4, chordDurationSeconds - 0.1),
                time,
                0.85
              );
            } else if (this.synthFallback) {
              this.synthFallback.triggerAttackRelease(
                note,
                Math.max(0.4, chordDurationSeconds - 0.1),
                time,
                0.85
              );
            }
          } catch (e) {
            console.warn('Playback schedule error:', e);
          }
        }, noteTime);
      });
    });

    if (loop) {
      Tone.Transport.loop = true;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = totalProgressionDuration;
    } else {
      Tone.Transport.loop = false;
      Tone.Transport.schedule((time) => {
        Tone.Draw.schedule(() => {
          this.stopPlayback();
          onComplete();
        }, time);
      }, totalProgressionDuration);
    }

    Tone.Transport.start();
  }

  public stopPlayback() {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (this.sampler) {
        this.sampler.releaseAll();
      }
      if (this.synthFallback) {
        this.synthFallback.releaseAll();
      }
    } catch (e) {
      console.warn('Error stopping playback:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
