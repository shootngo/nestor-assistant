/**
 * Phase 1 kiosk native bits for the fridge tablet:
 * FLAG_KEEP_SCREEN_ON before JS loads, immersive-sticky system bars,
 * and a charcoal fullscreen window theme.
 */
const { withAndroidManifest, withAndroidStyles, withMainActivity } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const IMPORTS = [
  'import android.os.Build',
  'import android.view.View',
  'import android.view.WindowInsets',
  'import android.view.WindowInsetsController',
  'import android.view.WindowManager',
];

const HIDE_SYSTEM_UI_METHOD = `
  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      hideSystemUi()
    }
  }

  private fun hideSystemUi() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.setDecorFitsSystemWindows(false)
      window.insetsController?.let { controller ->
        controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
        controller.systemBarsBehavior =
          WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = (
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }
  }
`;

function addMissingImports(contents) {
  let next = contents;
  for (const statement of IMPORTS) {
    if (!next.includes(statement)) {
      next = next.replace(/^(package .+$)/m, `$1\n${statement}`);
    }
  }
  return next;
}

function withKioskMainActivity(config) {
  return withMainActivity(config, (modConfig) => {
    if (modConfig.modResults.language !== 'kt') {
      throw new Error('withAndroidKiosk expects a Kotlin MainActivity (Expo default).');
    }

    let contents = addMissingImports(modConfig.modResults.contents);

    const keepAwake = mergeContents({
      src: contents,
      newSrc: '    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)\n    hideSystemUi()',
      tag: 'nestor-kiosk-keep-awake',
      anchor: /super\.onCreate\(.+\)/,
      offset: 1,
      comment: '//',
    });
    contents = keepAwake.contents;

    if (!contents.includes('private fun hideSystemUi()')) {
      const lastBrace = contents.lastIndexOf('}');
      if (lastBrace === -1) {
        throw new Error('withAndroidKiosk: could not find MainActivity class closing brace.');
      }
      contents = `${contents.slice(0, lastBrace)}${HIDE_SYSTEM_UI_METHOD}\n${contents.slice(lastBrace)}`;
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

function upsertStyleItem(style, name, value) {
  style.item = style.item || [];
  const existing = style.item.find((entry) => entry.$?.name === name);
  if (existing) {
    existing._ = value;
  } else {
    style.item.push({ $: { name }, _: value });
  }
}

function withKioskStyles(config) {
  return withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults.resources.style || [];
    const appTheme = styles.find((style) => style.$?.name === 'AppTheme');
    if (appTheme) {
      upsertStyleItem(appTheme, 'android:windowFullscreen', 'true');
      upsertStyleItem(appTheme, 'android:windowBackground', '#161616');
      upsertStyleItem(appTheme, 'android:windowLayoutInDisplayCutoutMode', 'shortEdges');
    }
    return modConfig;
  });
}

function hasPermission(modResults, name) {
  const permissions = modResults.manifest['uses-permission'] || [];
  return permissions.some((entry) => entry.$?.['android:name'] === name);
}

function withRecordAudio(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    if (!hasPermission(modConfig.modResults, 'android.permission.RECORD_AUDIO')) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.RECORD_AUDIO' },
      });
    }
    return modConfig;
  });
}

module.exports = function withAndroidKiosk(config) {
  config = withKioskStyles(config);
  config = withKioskMainActivity(config);
  config = withRecordAudio(config);
  return config;
};
