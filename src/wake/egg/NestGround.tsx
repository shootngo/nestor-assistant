import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

export function NestGround() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.twig, styles.t1]} />
      <View style={[styles.twig, styles.t2]} />
      <View style={[styles.twig, styles.t3]} />
      <View style={[styles.twig, styles.t4]} />
      <View style={styles.leaf} />
      <View style={[styles.leaf, styles.leafRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 78,
    width: 280,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twig: {
    position: 'absolute',
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.twig,
    opacity: 0.7,
  },
  t1: {
    width: 210,
    bottom: 18,
    transform: [{ rotate: '-8deg' }],
  },
  t2: {
    width: 190,
    bottom: 28,
    transform: [{ rotate: '7deg' }],
  },
  t3: {
    width: 150,
    bottom: 10,
    transform: [{ rotate: '4deg' }],
    opacity: 0.4,
  },
  t4: {
    width: 120,
    bottom: 36,
    transform: [{ rotate: '-12deg' }],
    opacity: 0.35,
  },
  leaf: {
    position: 'absolute',
    left: 36,
    bottom: 22,
    width: 18,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.sage,
    transform: [{ rotate: '-28deg' }],
    opacity: 0.7,
  },
  leafRight: {
    left: undefined,
    right: 40,
    transform: [{ rotate: '24deg' }],
    backgroundColor: colors.sageDeep,
  },
});
