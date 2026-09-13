import { StyleSheet, View } from 'react-native';

/** Soft contact shadow under Nestor. No room set — works on the cream session and charcoal board. */
export function NestGround() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.shadowWide} />
      <View style={styles.shadowCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 54,
    width: 220,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowWide: {
    position: 'absolute',
    width: 168,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(63, 42, 29, 0.1)',
  },
  shadowCore: {
    position: 'absolute',
    width: 92,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(63, 42, 29, 0.12)',
  },
});
