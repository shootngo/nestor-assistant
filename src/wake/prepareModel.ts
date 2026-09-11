import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { WAKE_PHRASE } from '../config';
import { keywordsFileContents } from './keywords';
import { kwsModelAssets } from './modelAssets';

export type PreparedKwsModel = {
  encoder: string;
  decoder: string;
  joiner: string;
  tokens: string;
  keywords: string;
};

function filePath(file: File): string {
  const raw = file.uri;
  return raw.startsWith('file://') ? raw.slice('file://'.length) : raw;
}

async function copyAsset(moduleId: number, dest: File): Promise<void> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const from = asset.localUri ?? asset.uri;
  if (!from) {
    throw new Error('KWS asset did not resolve to a local file.');
  }
  if (dest.exists) {
    dest.delete();
  }
  await new File(from).copy(dest);
}

/**
 * Materialize bundled ONNX + tokens + the active keywords file onto disk.
 * Native sherpa-onnx reads filesystem paths, not Metro asset IDs.
 */
export async function prepareKwsModel(): Promise<PreparedKwsModel | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  const dir = new Directory(Paths.document, 'kws');
  if (!dir.exists) {
    dir.create();
  }

  const encoder = new File(dir, 'encoder.int8.onnx');
  const decoder = new File(dir, 'decoder.int8.onnx');
  const joiner = new File(dir, 'joiner.int8.onnx');
  const tokens = new File(dir, 'tokens.txt');
  const keywords = new File(dir, 'keywords.txt');

  await copyAsset(kwsModelAssets.encoder, encoder);
  await copyAsset(kwsModelAssets.decoder, decoder);
  await copyAsset(kwsModelAssets.joiner, joiner);
  await copyAsset(kwsModelAssets.tokens, tokens);

  keywords.write(keywordsFileContents(WAKE_PHRASE));

  return {
    encoder: filePath(encoder),
    decoder: filePath(decoder),
    joiner: filePath(joiner),
    tokens: filePath(tokens),
    keywords: filePath(keywords),
  };
}
