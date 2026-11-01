#!/usr/bin/env node
/* ============================================================================
 * 生成 THE INDUCTION MIXER 网页混音器的 Sample 清单与 Web 音频
 * ============================================================================
 *
 * 输入（本地 masters，均在 .gitignore 覆盖的 audio-masters/ 下）：
 *   audio-masters/induction-samples/loop-01.wav … loop-07.wav
 *   audio-masters/generated-percussion/<voice>-<bpm>-bpm-<seed>.wav
 *
 * 输出（部署）：
 *   audio/the-induction-mixer/loop-01.m4a … loop-07.m4a
 *   audio/the-induction-mixer/kick-080.m4a … clap-140.m4a
 *   data/the-induction-mixer/samples.json
 *
 * 每次 START 由 js/mixer-riverrun.js 从清单里随机抽 12 条（不重复），
 * 每条各自 loop；清单顺序不影响随机结果。
 *
 * 用法：
 *   node scripts/gen-samples.mjs
 * ============================================================================ */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const FFMPEG = join(ROOT, 'tmp', 'bin', 'ffmpeg');
const OUT_DIR = join(ROOT, 'audio', 'the-induction-mixer');
const MANIFEST = join(ROOT, 'data', 'the-induction-mixer', 'samples.json');
const RECORDED_DIR = join(ROOT, 'audio-masters', 'induction-samples');
const PERCUSSION_DIR = join(ROOT, 'audio-masters', 'generated-percussion');

const VOICES = new Set(['kick', 'snare', 'hat', 'clap']);

function transcode(src, dst) {
  execFileSync(FFMPEG, [
    '-hide_banner', '-y', '-i', src,
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '1',
    '-movflags', '+faststart', dst,
  ], { stdio: 'ignore' });
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(dirname(MANIFEST), { recursive: true });

  const recorded = readdirSync(RECORDED_DIR)
    .filter(f => /^loop-\d{2}\.wav$/.test(f))
    .sort();
  if (recorded.length === 0) throw new Error('no recorded loops found');

  const generated = readdirSync(PERCUSSION_DIR)
    .filter(f => /^(kick|snare|hat|clap)-\d{3}-bpm-\d+\.wav$/.test(f))
    .filter(f => VOICES.has(f.split('-')[0]))
    .sort();

  const samples = [];
  let bytes = 0;

  for (const f of recorded) {
    const dst = join(OUT_DIR, f.replace(/\.wav$/, '.m4a'));
    transcode(join(RECORDED_DIR, f), dst);
    samples.push(`audio/the-induction-mixer/${f.replace(/\.wav$/, '.m4a')}`);
    bytes += statSync(dst).size;
  }

  for (const f of generated) {
    // kick-080-bpm-2147.wav -> kick-080.m4a
    const name = f.replace(/-bpm-\d+\.wav$/, '.m4a');
    const dst = join(OUT_DIR, name);
    transcode(join(PERCUSSION_DIR, f), dst);
    samples.push(`audio/the-induction-mixer/${name}`);
    bytes += statSync(dst).size;
  }

  const unique = [...new Set(samples)];
  if (unique.length !== samples.length) throw new Error('duplicate sample URL');

  const manifest = {
    count: samples.length,
    samples,
  };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`samples: ${samples.length} (${recorded.length} recorded + ${generated.length} percussion)`);
  console.log(`audio:   ${(bytes / 1024 / 1024).toFixed(2)} MiB in audio/the-induction-mixer/`);
  console.log(`manifest: data/the-induction-mixer/samples.json`);
}

main();
