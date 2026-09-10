import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

const CHARCOAL = '#161616';

export default function App() {
  useKeepAwake();

  useEffect(() => {
    void applyKioskChrome();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar hidden style="light" />
      {Platform.OS === 'android' ? <NavigationBar hidden /> : null}
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Nestor
        </Text>
        <View style={styles.rule} />
        <Text style={styles.subtitle}>Kitchen assistant — Phase 1</Text>
        <Text style={styles.shell}>This is the fridge tablet shell.</Text>
      </View>
    </View>
  );
}

async function applyKioskChrome() {
  try {
    await SystemUI.setBackgroundColorAsync(CHARCOAL);
  } catch {
    // Some runtimes (including web) do not expose this.
  }

  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch {
    // Orientation lock is best-effort outside a native Android build.
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CHARCOAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 48,
    maxWidth: 720,
  },
  title: {
    color: '#E8E4DC',
    fontSize: 72,
    fontWeight: '300',
    letterSpacing: 6,
  },
  rule: {
    width: 56,
    height: 2,
    backgroundColor: '#C9A46C',
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 1,
  },
  subtitle: {
    color: '#C9C4BB',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  shell: {
    color: '#8A8680',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
