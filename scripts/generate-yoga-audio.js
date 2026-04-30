#!/usr/bin/env node
/**
 * generate-yoga-audio.js
 *
 * Batch-generates yoga narration audio files via Grok TTS API.
 * Reads the manifest from scripts/output/yoga-voice-manifest.json
 * and generates .m4a files for both female and male voices.
 *
 * Usage:
 *   export GROK_API_KEY="xai-..."
 *   node scripts/generate-yoga-audio.js                    # both genders
 *   node scripts/generate-yoga-audio.js --gender=female    # female only
 *   node scripts/generate-yoga-audio.js --gender=male      # male only
 *   node scripts/generate-yoga-audio.js --dry-run          # show what would be generated
 *   node scripts/generate-yoga-audio.js --limit=10         # generate first 10 only
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Config ───────────────────────────────────────────
const API_URL = 'https://api.x.ai/v1/tts';
const API_KEY = process.env.GROK_API_KEY;

// Voice mapping: warm female for yoga, professional male
const VOICES = {
  female: 'ara',   // warm voice
  male: 'rex',     // professional voice
};

const MANIFEST_PATH = path.join(__dirname, 'output', 'yoga-voice-manifest.json');
const AUDIO_BASE = path.join(__dirname, '..', 'audio', 'yoga');

// Rate limiting: Grok API may have limits
const DELAY_MS = 500; // 500ms between requests

// ── Parse args ───────────────────────────────────────
const args = process.argv.slice(2);
let genderFilter = null; // null = both
let dryRun = false;
let limit = Infinity;

for (const arg of args) {
  if (arg.startsWith('--gender=')) genderFilter = arg.split('=')[1];
  if (arg === '--dry-run') dryRun = true;
  if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1]);
}

// ── Validate ─────────────────────────────────────────
if (!API_KEY && !dryRun) {
  console.error('ERROR: Set GROK_API_KEY environment variable');
  console.error('  export GROK_API_KEY="xai-..."');
  process.exit(1);
}

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('ERROR: Manifest not found. Run first:');
  console.error('  node scripts/generate-voice-manifest.js');
  process.exit(1);
}

// ── Load manifest ────────────────────────────────────
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
console.log(`Loaded manifest: ${manifest.length} entries`);

// ── Yoga-style text enhancement ──────────────────────
// Add subtle breath markers and whisper tags for the yoga voice feel
function enhanceForYoga(text) {
  // Add a gentle breath at the start of longer cues
  let enhanced = text;
  if (enhanced.length > 60) {
    enhanced = '[breath] ' + enhanced;
  }
  // Wrap "breathe" instructions in emphasis
  enhanced = enhanced.replace(/(breathe?\s+(?:deeply|here|into|slowly|steadily|naturally|softly))/gi, '<emphasis>$1</emphasis>');
  // Add breath before ellipsis pauses
  enhanced = enhanced.replace(/\.\.\.\s*/g, '... [breath] ');
  return enhanced;
}

// ── API call ─────────────────────────────────────────
function generateAudio(text, voiceId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text: text,
      voice_id: voiceId,
      language: 'en',
      output_format: {
        codec: 'mp3',
        sample_rate: 24000,
        bit_rate: 128000,
      },
    });

    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', d => errBody += d);
        res.on('end', () => reject(new Error(`API ${res.statusCode}: ${errBody}`)));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────
async function main() {
  const genders = genderFilter ? [genderFilter] : ['female', 'male'];
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let count = 0;

  for (const gender of genders) {
    const voiceId = VOICES[gender];
    const outDir = path.join(AUDIO_BASE, gender);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    console.log(`\n── Generating ${gender} voice (${voiceId}) ──`);

    for (const entry of manifest) {
      if (count >= limit) break;

      const outFile = path.join(outDir, entry.filename.replace('.m4a', '.mp3'));

      // Skip if already exists
      if (fs.existsSync(outFile)) {
        totalSkipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  [dry] ${gender}/${entry.filename} — "${entry.text.substring(0, 60)}..."`);
        count++;
        continue;
      }

      // Enhance text for yoga feel
      const enhancedText = enhanceForYoga(entry.text);

      try {
        process.stdout.write(`  ${gender}/${entry.filename} ... `);
        const audioData = await generateAudio(enhancedText, voiceId);
        fs.writeFileSync(outFile, audioData);
        console.log(`✓ ${(audioData.length / 1024).toFixed(1)}KB`);
        totalGenerated++;
        count++;
        await sleep(DELAY_MS);
      } catch (err) {
        console.log(`✗ ${err.message}`);
        totalErrors++;
        count++;
        // On rate limit, wait longer
        if (err.message.includes('429')) {
          console.log('  Rate limited — waiting 10s...');
          await sleep(10000);
        }
      }
    }
  }

  console.log('\n── Summary ──');
  console.log(`Generated: ${totalGenerated}`);
  console.log(`Skipped (already exist): ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Total entries: ${manifest.length} × ${genders.length} genders = ${manifest.length * genders.length}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
