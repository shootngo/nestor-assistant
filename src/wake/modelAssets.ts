/** Bundled English int8 KWS graph + tokens. Copied to the document directory on first run. */
export const kwsModelAssets = {
  encoder: require('../../assets/kws/encoder.int8.onnx'),
  decoder: require('../../assets/kws/decoder.int8.onnx'),
  joiner: require('../../assets/kws/joiner.int8.onnx'),
  tokens: require('../../assets/kws/tokens.txt'),
} as const;
