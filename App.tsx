import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Dashboard } from './src/dashboard/Dashboard';
import { applyKioskChrome } from './src/kiosk';
import { colors } from './src/theme';
import { EggExit, EggListening, MicNeededCard, useWakeSession } from './src/wake';

export default function App() {
  useKeepAwake();
  const session = useWakeSession();
  const paused = session.phase !== 'idle';

  useEffect(() => {
    void applyKioskChrome();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar hidden style="light" />
      {Platform.OS === 'android' ? <NavigationBar hidden /> : null}
      <Dashboard paused={paused} onSimulateWake={session.simulateWake} />
      {session.phase === 'listening' ? <EggListening onSimulateSleep={session.simulateSleep} /> : null}
      {session.phase === 'exiting' ? <EggExit onDone={session.finishExit} /> : null}
      {session.phase === 'mic-needed' ? (
        <MicNeededCard onRetry={session.retryMic} onContinue={session.dismissMicCard} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
});
