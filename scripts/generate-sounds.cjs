/**
 * Generate Tivora notification sound files in android/app/src/main/res/raw/
 * Creates valid WAV audio files (PCM 44.1kHz 16-bit mono tone)
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.resolve('C:/Users/User/Desktop/Tivora/android/app/src/main/res/raw');

function createWavBuffer(durationSeconds, frequencyHz) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate sine wave samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequencyHz * t);
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

fs.mkdirSync(RAW_DIR, { recursive: true });

// 1. Message sound: short 0.4s pleasant 880Hz chime
const messageSound = createWavBuffer(0.4, 880);
fs.writeFileSync(path.join(RAW_DIR, 'tivora_message.mp3'), messageSound);
console.log('✓ Created tivora_message.mp3 in res/raw/');

// 2. Ringtone sound: 2.0s 523Hz (C5) call tone loop
const ringtoneSound = createWavBuffer(2.0, 523.25);
fs.writeFileSync(path.join(RAW_DIR, 'tivora_ringtone.mp3'), ringtoneSound);
console.log('✓ Created tivora_ringtone.mp3 in res/raw/');

console.log('✅ Sound resources generated successfully!');
