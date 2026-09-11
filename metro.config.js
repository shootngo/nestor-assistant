const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

for (const ext of ['onnx', 'txt']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext: string) => ext !== 'txt');

module.exports = config;
