import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { EGG_EXIT_MS } from '../../config';
import { getHoldExit } from '../../preview';
import { colors, serif } from '../../theme';
import { EggFace } from './EggFace';
import { NestGround } from './NestGround';

const nativeDriver = Platform.OS !== 'web';

type Props = {
  onDone: () => void;
};

export function EggExit({ onDone }: Props) {
  const walk = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (getHoldExit()) {
      walk.setValue(0.42);
      fade.setValue(1);
      return;
    }
    const motion = Animated.parallel([
      Animated.timing(walk, {
        toValue: 1,
        duration: EGG_EXIT_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 420,
        delay: EGG_EXIT_MS - 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: nativeDriver,
      }),
    ]);
    motion.start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
    return () => motion.stop();
  }, [fade, onDone, walk]);

  return (
    <View style={styles.screen} testID="nestor-egg-exit" accessibilityLabel="Nestor is heading back to the nest">
      <View style={styles.stage}>
        <NestGround />
        <EggFace walking walk={walk} />
      </View>
      <Animated.Text style={[styles.line, { opacity: fade }]}>Back in a bit</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 20,
  },
  stage: {
    width: 280,
    height: 270,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  line: {
    color: colors.mutedNest,
    fontSize: 20,
    marginTop: 16,
    ...serif,
  },
});
