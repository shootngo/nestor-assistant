import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { brandingImages } from '../../branding/assets';
import { SHOWPIECE_GREETING, SHOWPIECE_MARK, SHOWPIECE_TAGLINE } from '../../branding/copy';
import type { ShowpieceFrame } from '../../preview';
import { colors, serif, type } from '../../theme';

const nativeDriver = Platform.OS !== 'web';

/** ~5s, matching Frank’s three reference stills. Visual only — never play music or TTS. */
const TIMING = {
  openIn: 450,
  openHold: 900,
  midIn: 1400,
  midHold: 400,
  endIn: 1400,
  lockupIn: 750,
} as const;

function fade(value: Animated.Value, toValue: number, duration: number) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.cubic),
    useNativeDriver: nativeDriver,
  });
}

type Props = {
  frame?: ShowpieceFrame | null;
};

export function HatchShowpiece({ frame = null }: Props) {
  const start = useRef(new Animated.Value(0)).current;
  const mid = useRef(new Animated.Value(0)).current;
  const end = useRef(new Animated.Value(0)).current;
  const openingCopy = useRef(new Animated.Value(0)).current;
  const lockup = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const freeze = (stage: ShowpieceFrame) => {
      start.setValue(1);
      mid.setValue(stage === 'hatch' || stage === 'house' ? 1 : 0);
      end.setValue(stage === 'house' ? 1 : 0);
      openingCopy.setValue(stage === 'house' ? 0 : 1);
      lockup.setValue(stage === 'house' ? 1 : 0);
    };

    if (frame) {
      freeze(frame);
      return;
    }

    start.setValue(0);
    mid.setValue(0);
    end.setValue(0);
    openingCopy.setValue(0);
    lockup.setValue(0);

    const animation = Animated.sequence([
      Animated.parallel([fade(start, 1, TIMING.openIn), fade(openingCopy, 1, TIMING.openIn)]),
      Animated.delay(TIMING.openHold),
      fade(mid, 1, TIMING.midIn),
      Animated.delay(TIMING.midHold),
      Animated.parallel([
        fade(end, 1, TIMING.endIn),
        fade(openingCopy, 0, TIMING.lockupIn),
        fade(lockup, 1, TIMING.lockupIn),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [end, frame, lockup, mid, openingCopy, start]);

  return (
    <View style={styles.wrap} testID="nestor-card-showpiece" accessibilityLabel={SHOWPIECE_GREETING}>
      <Animated.View style={styles.stage}>
        <Animated.Image source={brandingImages.hatchStart} style={[styles.art, { opacity: start }]} resizeMode="cover" />
        <Animated.Image source={brandingImages.hatchMid} style={[styles.art, { opacity: mid }]} resizeMode="cover" />
        <Animated.Image source={brandingImages.hatchEnd} style={[styles.art, { opacity: end }]} resizeMode="cover" />
      </Animated.View>
      <Animated.View style={[styles.opening, { opacity: openingCopy }]}>
        <Animated.Text style={styles.smallMark}>{SHOWPIECE_MARK}</Animated.Text>
        <Animated.Text style={styles.tagline}>{SHOWPIECE_TAGLINE}</Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.lockup, { opacity: lockup }]}>
        <Animated.Text style={styles.mark}>{SHOWPIECE_MARK}</Animated.Text>
        <Animated.Text style={styles.greeting}>{SHOWPIECE_GREETING}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  stage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  art: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.12 }],
  },
  opening: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  smallMark: {
    color: colors.bark,
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    ...serif,
  },
  tagline: {
    color: colors.mutedNest,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 2,
  },
  lockup: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  mark: {
    color: colors.bark,
    fontSize: type.serifMark,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
    ...serif,
  },
  greeting: {
    color: colors.bark,
    fontSize: type.greeting,
    fontWeight: '400',
    letterSpacing: 0.15,
    textAlign: 'center',
    marginTop: 6,
    ...serif,
  },
});
