/**
 * expo-sherpa-onnx 0.0.8 compiles a libarchive JNI helper with CMake/NDK
 * and also copies those same .so files into jniLibs. EAS then dies in
 * Run gradlew (duplicate native libs / CMake). Nestor only uses keyword
 * spotting with vendored ONNX files in assets/kws/, so turn the helper off.
 */
const { withGradleProperties } = require('@expo/config-plugins');

function upsertProperty(properties, key, value) {
  const next = properties.filter((item) => item.key !== key);
  next.push({ type: 'property', key, value });
  return next;
}

module.exports = function withSherpaOnnxAndroid(config) {
  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = upsertProperty(
      modConfig.modResults,
      'sherpaOnnxDisableLibarchive',
      'true',
    );
    return modConfig;
  });
};
