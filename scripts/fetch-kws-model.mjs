#!/usr/bin/env node
/**
 * Re-vendor the English sherpa-onnx KWS int8 graph into assets/kws/.
 * The repo already ships these files; run this only if you need to refresh them.
 */
import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'assets', 'kws');
const url =
  'https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01.tar.bz2';
const archive = path.join(root, '.tmp-kws-model.tar.bz2');
const unpacked = 'sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01';

async function main() {
  await mkdir(dest, { recursive: true });
  console.log('Downloading', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  await pipeline(response.body, createWriteStream(archive));
  await exec('tar', ['-xjf', archive, '-C', root]);
  const src = path.join(root, unpacked);
  await copyFile(path.join(src, 'encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx'), path.join(dest, 'encoder.int8.onnx'));
  await copyFile(path.join(src, 'decoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx'), path.join(dest, 'decoder.int8.onnx'));
  await copyFile(path.join(src, 'joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx'), path.join(dest, 'joiner.int8.onnx'));
  await copyFile(path.join(src, 'tokens.txt'), path.join(dest, 'tokens.txt'));
  await copyFile(path.join(src, 'bpe.model'), path.join(dest, 'bpe.model'));
  await rm(archive, { force: true });
  await rm(src, { recursive: true, force: true });
  console.log('Wrote int8 KWS model into assets/kws/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
