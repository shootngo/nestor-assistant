import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { OVERNIGHT_DIM_MS } from '../config';
import { colors, serif } from '../theme';
import { clockAccessibilityLabel, type OvernightClock } from './clock';

type Props = {
  dimmed: boolean;
  clock: OvernightClock;
};

const nativeDriver = Platform.OS !== 'web';

export function DimOverlay({ dimmed, clock }: Props) {
  const veil = useRef(new Animated.Value(dimmed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(veil, {
      toValue: dimmed ? 1 : 0,
      duration: OVERNIGHT_DIM_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: nativeDriver,
    }).start();
  }, [dimmed, veil]);

  const label = clockAccessibilityLabel(clock);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.veil, { opacity: veil }]}
      testID="nestor-overnight-dim"
      accessibilityElementsHidden={!dimmed}
      importantForAccessibility={dimmed ? 'yes' : 'no-hide-descendants'}
      accessibilityLabel={dimmed ? `Nestor overnight, ${label}` : undefined}
    >
      <View style={styles.clockWrap}>
        <Text style={styles.time} testID="nestor-overnight-clock">
          {clock.time}
        </Text>
        {clock.period ? <Text style={styles.period}>{clock.period}</Text> : null}
        <Text style={styles.mark}>Nestor</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.nightVeil,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  clockWrap: {
    alignItems: 'center',
    marginTop: -12,
  },
  time: {
    color: colors.nightClock,
    fontSize: 128,
    fontWeight: '200',
    letterSpacing: -2,
    lineHeight: 136,
    ...serif,
  },
  period: {
    color: colors.nightPeriod,
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 6,
    marginTop: -4,
    ...serif,
  },
  mark: {
    color: colors.nightMark,
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 5,
    marginTop: 18,
    textTransform: 'uppercase',
  },
});
