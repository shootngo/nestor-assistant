import { StyleSheet, View } from 'react-native';

/**
 * Stage marker only. The walking egg carries its own contact shadow
 * so a leftover bar does not sit in the nest after he walks off.
 */
export function NestGround() {
  return <View style={styles.wrap} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 54,
    width: 1,
    height: 1,
  },
});
