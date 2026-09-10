import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Dashboard } from './src/dashboard/Dashboard';
import { applyKioskChrome } from './src/kiosk';
import { colors } from './src/theme';

export default function App() {
  useKeepAwake();

  useEffect(() => {
    void applyKioskChrome();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar hidden style="light" />
      {Platform.OS === 'android' ? <NavigationBar hidden /> : null}
      <Dashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
});
