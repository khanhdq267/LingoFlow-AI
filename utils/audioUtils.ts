/**
 * Converts a Blob to a Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result); 
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper: Decode base64 string to Uint8Array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Decode raw PCM data (16-bit, 24kHz)
async function decodePCM(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit integer to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Decodes and plays a base64 audio string.
 * Handles both Raw PCM (from Gemini TTS) and Data URIs (local playback).
 */
export const playBase64Audio = async (base64String: string) => {
  try {
    // 1. If it has a mime type header (e.g., from user recording), play via HTMLAudioElement
    if (base64String.startsWith('data:audio')) {
      const audio = new Audio(base64String);
      await audio.play();
      return;
    }

    // 2. Otherwise, assume Raw PCM from Gemini TTS (24kHz, 16-bit, mono)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    
    const bytes = decodeBase64(base64String);
    const audioBuffer = await decodePCM(bytes, audioContext);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

  } catch (e) {
    console.error("Error playing audio:", e);
  }
};
