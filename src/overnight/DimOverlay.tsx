import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { OVERNIGHT_DIM_MS } from '../config';
import { colors, serif } from '../theme';
import { clockAccessibilityLabel, splitClockTime, type OvernightClock } from './clock';

type Props = {
  dimmed: boolean;
  clock: OvernightClock;
};

const nativeDriver = Platform.OS !== 'web';

export function DimOverlay({ dimmed, clock }: Props) {
  const [visible, setVisible] = useState(dimmed);
  const veil = useRef(new Animated.Value(dimmed ? 1 : 0)).current;

  useEffect(() => {
    if (dimmed) {
      setVisible(true);
    }
    const motion = Animated.timing(veil, {
      toValue: dimmed ? 1 : 0,
      duration: OVERNIGHT_DIM_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: nativeDriver,
    });
    motion.start(({ finished }) => {
      if (finished && !dimmed) {
        setVisible(false);
      }
    });
    return () => motion.stop();
  }, [dimmed, veil]);

  if (!visible) {
    return null;
  }

  const label = clockAccessibilityLabel(clock);
  const { hour, minute } = splitClockTime(clock.time);

  return (
    <Animated.View
      style={[styles.veil, { opacity: veil }]}
      testID="nestor-overnight-dim"
      accessibilityLabel={`Nestor overnight, ${label}`}
    >
      <View style={styles.clockWrap}>
        <View style={styles.plate}>
          <View style={styles.digits} testID="nestor-overnight-clock">
            <Text style={styles.time} allowFontScaling={false}>
              {hour}
            </Text>
            <Text style={styles.colon} allowFontScaling={false}>
              :
            </Text>
            <Text style={styles.time} allowFontScaling={false}>
              {minute}
            </Text>
          </View>
          {clock.period ? (
            <Text style={styles.period} allowFontScaling={false}>
              {clock.period}
            </Text>
          ) : null}
        </View>
        <Text style={styles.mark} allowFontScaling={false}>
          Nestor
        </Text>
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
    pointerEvents: 'none',
  },
  clockWrap: {
    alignItems: 'center',
    marginTop: -12,
  },
  plate: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: colors.nightPlate,
  },
  digits: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  time: {
    color: colors.nightClock,
    fontSize: 120,
    fontWeight: '300',
    letterSpacing: 1,
    lineHeight: 128,
    ...serif,
  },
  colon: {
    color: colors.nightClock,
    fontSize: 104,
    fontWeight: '200',
    lineHeight: 120,
    marginHorizontal: 6,
    ...serif,
  },
  period: {
    color: colors.nightPeriod,
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 6,
    marginTop: -4,
    ...serif,
  },
  mark: {
    color: colors.nightMark,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 5,
    marginTop: 18,
    textTransform: 'uppercase',
  },
});
