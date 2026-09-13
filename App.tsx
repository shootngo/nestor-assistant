import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/ErrorBoundary';
import { Dashboard } from './src/dashboard/Dashboard';
import { ensureTabletAuth } from './src/household/auth';
import { applyKioskChrome } from './src/kiosk';
import { EggSession } from './src/listen/EggSession';
import { DimOverlay } from './src/overnight';
import { colors } from './src/theme';
import { EggExit, MicNeededCard, TapToWakeButton, useWakeSession } from './src/wake';

export default function App() {
  useKeepAwake();
  const [boardReady, setBoardReady] = useState(false);
  const session = useWakeSession({ boardReady });
  const paused = session.phase !== 'idle';
  const talkingMouth = session.mode === 'talking' && !session.muted;

  useEffect(() => {
    void applyKioskChrome();
  }, []);

  useEffect(() => {
    void ensureTabletAuth();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar hidden style="light" />
      {Platform.OS === 'android' ? <NavigationBar hidden /> : null}
      <Dashboard
        paused={paused}
        onSimulateWake={session.simulateWake}
        onReady={() => setBoardReady(true)}
      />
      <ErrorBoundary>
        <DimOverlay dimmed={session.overnight.dimmed} clock={session.overnight.clock} />
      </ErrorBoundary>
      {session.phase === 'idle' ? (
        <ErrorBoundary>
          <TapToWakeButton onPress={session.tapToWake} />
        </ErrorBoundary>
      ) : null}
      <ErrorBoundary>
        {session.phase === 'listening' ? (
          <EggSession
            mode={session.mode}
            answer={session.answer}
            muted={session.muted}
            talkingMouth={talkingMouth}
            onSimulateSleep={session.simulateSleep}
            onToggleMute={session.toggleMute}
            onVolumeDown={session.volumeDown}
            onVolumeUp={session.volumeUp}
          />
        ) : null}
        {session.phase === 'exiting' ? <EggExit onDone={session.finishExit} /> : null}
        {session.phase === 'mic-needed' ? (
          <MicNeededCard onRetry={session.retryMic} onContinue={session.dismissMicCard} />
        ) : null}
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
});
