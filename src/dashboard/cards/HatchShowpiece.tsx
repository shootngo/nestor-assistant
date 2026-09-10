import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { brandingImages } from '../../branding/assets';
import { SHOWPIECE_GREETING, SHOWPIECE_MARK, SHOWPIECE_TAGLINE } from '../../branding/copy';
import type { ShowpieceFrame } from '../../preview';
import { colors, serif, type } from '../../theme';

const nativeDriver = Platform.OS !== 'web';

/** ~5s motion, matching Frank’s reference clip. Visual only — no audio. */
const TIMING = {
  openIn: 500,
  openHold: 700,
  crackIn: 900,
  shatterIn: 1100,
  revealIn: 1000,
  lockupIn: 700,
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
  const crack = useRef(new Animated.Value(0)).current;
  const shatter = useRef(new Animated.Value(0)).current;
  const revealed = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  const openingCopy = useRef(new Animated.Value(0)).current;
  const lockup = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const freeze = (stage: ShowpieceFrame) => {
      start.setValue(1);
      crack.setValue(stage === 'hatch' || stage === 'house' ? 1 : 0);
      shatter.setValue(stage === 'hatch' || stage === 'house' ? 1 : 0);
      revealed.setValue(stage === 'house' ? 1 : 0);
      zoom.setValue(stage === 'hatch' ? 1.04 : stage === 'house' ? 1.08 : 1);
      openingCopy.setValue(stage === 'nest' || stage === 'egg' ? 1 : 0);
      lockup.setValue(stage === 'house' ? 1 : 0);
    };

    if (frame) {
      freeze(frame);
      return;
    }

    start.setValue(0);
    crack.setValue(0);
    shatter.setValue(0);
    revealed.setValue(0);
    zoom.setValue(1);
    openingCopy.setValue(0);
    lockup.setValue(0);

    const animation = Animated.sequence([
      Animated.parallel([fade(start, 1, TIMING.openIn), fade(openingCopy, 1, TIMING.openIn)]),
      Animated.delay(TIMING.openHold),
      Animated.parallel([fade(crack, 1, TIMING.crackIn), fade(zoom, 1.03, TIMING.crackIn)]),
      Animated.parallel([fade(shatter, 1, TIMING.shatterIn), fade(zoom, 1.06, TIMING.shatterIn)]),
      Animated.parallel([
        fade(revealed, 1, TIMING.revealIn),
        fade(zoom, 1.08, TIMING.revealIn),
        fade(openingCopy, 0, TIMING.lockupIn),
        fade(lockup, 1, TIMING.lockupIn),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [crack, frame, lockup, openingCopy, revealed, shatter, start, zoom]);

  return (
    <View style={styles.wrap} testID="nestor-card-showpiece" accessibilityLabel={SHOWPIECE_GREETING}>
      <Animated.View style={[styles.lockup, { opacity: lockup }]} pointerEvents="none">
        <Animated.Text style={styles.mark}>{SHOWPIECE_MARK}</Animated.Text>
        <Animated.Text style={styles.greeting}>{SHOWPIECE_GREETING}</Animated.Text>
      </Animated.View>
      <View style={styles.stageClip}>
        <Animated.View style={[styles.stage, { transform: [{ scale: zoom }] }]}>
          <Animated.Image source={brandingImages.hatchStart} style={[styles.art, { opacity: start }]} resizeMode="contain" />
          <Animated.Image source={brandingImages.hatchCrack} style={[styles.art, { opacity: crack }]} resizeMode="contain" />
          <Animated.Image
            source={brandingImages.hatchShatter}
            style={[styles.art, { opacity: shatter }]}
            resizeMode="contain"
          />
          <Animated.Image
            source={brandingImages.hatchRevealed}
            style={[styles.art, { opacity: revealed }]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      <Animated.View style={[styles.opening, { opacity: openingCopy }]} pointerEvents="none">
        <Animated.Text style={styles.smallMark}>{SHOWPIECE_MARK}</Animated.Text>
        <Animated.Text style={styles.tagline}>{SHOWPIECE_TAGLINE}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: 36,
  },
  lockup: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    zIndex: 2,
    alignItems: 'center',
  },
  mark: {
    color: colors.bark,
    fontSize: type.serifMark,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    ...serif,
  },
  greeting: {
    color: colors.bark,
    fontSize: type.greeting,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 4,
    ...serif,
  },
  stageClip: {
    width: 520,
    height: 520,
    maxWidth: '54%',
    maxHeight: '66%',
    overflow: 'hidden',
  },
  stage: {
    width: '100%',
    height: '100%',
  },
  art: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  opening: {
    position: 'absolute',
    bottom: 22,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  smallMark: {
    color: colors.bark,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    ...serif,
  },
  tagline: {
    color: colors.mutedNest,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 2,
  },
});
