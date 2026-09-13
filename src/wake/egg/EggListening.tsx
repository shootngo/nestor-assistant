import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ALLOW_WAKE_SIMULATE } from '../../config';
import { colors, serif, type } from '../../theme';
import { DISMISS_LINE, LISTENING_LINE } from '../copy';
import { EggFace } from './EggFace';
import { NestGround } from './NestGround';

type Props = {
  onSimulateSleep?: () => void;
};

export function EggListening({ onSimulateSleep }: Props) {
  const walk = useRef(new Animated.Value(0)).current;

  return (
    <Pressable
      style={styles.screen}
      onPress={ALLOW_WAKE_SIMULATE ? onSimulateSleep : undefined}
      onLongPress={ALLOW_WAKE_SIMULATE ? onSimulateSleep : undefined}
      delayLongPress={700}
      accessibilityRole="button"
      accessibilityLabel={`${LISTENING_LINE}. ${DISMISS_LINE}`}
      testID="nestor-egg-listening"
    >
      <View style={styles.stage}>
        <NestGround />
        <EggFace walk={walk} attentive />
      </View>
      <Text style={styles.mark}>Nestor</Text>
      <Text style={styles.line}>{LISTENING_LINE}</Text>
      <Text style={styles.hint}>{DISMISS_LINE}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  stage: {
    width: 340,
    height: 320,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  mark: {
    color: colors.bark,
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 10,
    ...serif,
  },
  line: {
    color: colors.bark,
    fontSize: type.greeting,
    fontWeight: '400',
    marginTop: 6,
    ...serif,
  },
  hint: {
    color: colors.mutedNest,
    fontSize: 18,
    marginTop: 8,
    letterSpacing: 0.2,
  },
});
