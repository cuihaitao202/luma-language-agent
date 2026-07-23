export function resampleMono(input, inputRate, outputRate = 16000) {
  if (!input?.length || inputRate <= 0 || outputRate <= 0) return new Float32Array();
  if (inputRate === outputRate) return new Float32Array(input);
  const outputLength = Math.max(1, Math.round(input.length * outputRate / inputRate));
  const output = new Float32Array(outputLength);
  const scale = (input.length - 1) / Math.max(1, outputLength - 1);
  for (let i = 0; i < outputLength; i += 1) {
    const position = i * scale;
    const left = Math.floor(position);
    const right = Math.min(input.length - 1, left + 1);
    const mix = position - left;
    output[i] = input[left] * (1 - mix) + input[right] * mix;
  }
  return output;
}

export function floatToPcm16(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
  }
  return output;
}

export function pcm16ToBase64(pcm) {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToPcm16(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

export class RealtimePcmAudio {
  constructor(onInputChunk) {
    this.onInputChunk = onInputChunk;
    this.inputContext = null;
    this.outputContext = null;
    this.source = null;
    this.processor = null;
    this.silentGain = null;
    this.playing = new Set();
    this.nextPlayAt = 0;
    this.playbackChain = Promise.resolve();
    this.playbackGeneration = 0;
  }

  async start(stream) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error("This browser does not support live PCM audio");
    this.inputContext = new AudioContext();
    await this.inputContext.resume();
    this.source = this.inputContext.createMediaStreamSource(stream);
    // About 85 ms at 48 kHz: fewer WebSocket frames on mobile without adding
    // a noticeable turn-taking delay.
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    this.silentGain = this.inputContext.createGain();
    this.silentGain.gain.value = 0;
    this.processor.onaudioprocess = (event) => {
      const source = event.inputBuffer.getChannelData(0);
      const resampled = resampleMono(source, event.inputBuffer.sampleRate, 16000);
      this.onInputChunk?.(pcm16ToBase64(floatToPcm16(resampled)));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.inputContext.destination);
  }

  async play(base64Audio) {
    if (!base64Audio) return;
    const generation = this.playbackGeneration;
    this.playbackChain = this.playbackChain
      .catch(() => {})
      .then(() => this.schedulePlayback(base64Audio, generation));
    return this.playbackChain;
  }

  async schedulePlayback(base64Audio, generation) {
    if (generation !== this.playbackGeneration) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!this.outputContext) this.outputContext = new AudioContext();
    await this.outputContext.resume();
    if (generation !== this.playbackGeneration) return;
    const pcm = base64ToPcm16(base64Audio);
    const buffer = this.outputContext.createBuffer(1, pcm.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i += 1) channel[i] = pcm[i] / 32768;
    const node = this.outputContext.createBufferSource();
    node.buffer = buffer;
    node.connect(this.outputContext.destination);
    // Add a small lead only when playback starts or starves. This absorbs
    // ordinary mobile-network jitter while keeping steady-state latency low.
    if (this.nextPlayAt < this.outputContext.currentTime + 0.035) {
      this.nextPlayAt = this.outputContext.currentTime + 0.075;
    }
    const startsAt = this.nextPlayAt;
    this.nextPlayAt = startsAt + buffer.duration;
    this.playing.add(node);
    node.onended = () => this.playing.delete(node);
    node.start(startsAt);
  }

  interrupt() {
    this.playbackGeneration += 1;
    this.playbackChain = Promise.resolve();
    for (const node of this.playing) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    this.playing.clear();
    this.nextPlayAt = this.outputContext?.currentTime || 0;
  }

  close() {
    this.interrupt();
    if (this.processor) this.processor.onaudioprocess = null;
    try { this.source?.disconnect(); } catch { /* no-op */ }
    try { this.processor?.disconnect(); } catch { /* no-op */ }
    try { this.silentGain?.disconnect(); } catch { /* no-op */ }
    this.inputContext?.close().catch(() => {});
    this.outputContext?.close().catch(() => {});
  }
}
