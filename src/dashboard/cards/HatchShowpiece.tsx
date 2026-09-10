import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { brandingImages } from '../../branding/assets';
import { SHOWPIECE_GREETING, SHOWPIECE_MARK, SHOWPIECE_TAGLINE } from '../../branding/copy';
import type { ShowpieceFrame } from '../../preview';
import { colors, serif, type } from '../../theme';

const nativeDriver = Platform.OS !== 'web';

/** Motion follows Frank’s ~5s reference; dwell after that is BRANDING_SHOWPIECE_MS. */
const TIMING = {
  startIn: 600,
  startHold: 700,
  shatterIn: 1200,
  revealedIn: 1200,
  markIn: 800,
  greetingIn: 700,
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
  const shatter = useRef(new Animated.Value(0)).current;
  const revealed = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(0)).current;
  const greeting = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const freeze = (stage: ShowpieceFrame) => {
      start.setValue(1);
      shatter.setValue(stage === 'hatch' || stage === 'house' ? 1 : 0);
      revealed.setValue(stage === 'house' ? 1 : 0);
      zoom.setValue(stage === 'hatch' ? 1.04 : stage === 'house' ? 1.08 : 1);
      tagline.setValue(stage === 'egg' ? 1 : 0);
      mark.setValue(stage === 'house' ? 1 : 0);
      greeting.setValue(stage === 'house' ? 1 : 0);
    };

    if (frame) {
      freeze(frame);
      return;
    }

    start.setValue(0);
    shatter.setValue(0);
    revealed.setValue(0);
    zoom.setValue(1);
    tagline.setValue(0);
    mark.setValue(0);
    greeting.setValue(0);

    const animation = Animated.sequence([
      Animated.parallel([fade(start, 1, TIMING.startIn), fade(tagline, 1, TIMING.startIn)]),
      Animated.delay(TIMING.startHold),
      Animated.parallel([fade(shatter, 1, TIMING.shatterIn), fade(zoom, 1.04, TIMING.shatterIn)]),
      Animated.parallel([
        fade(revealed, 1, TIMING.revealedIn),
        fade(zoom, 1.08, TIMING.revealedIn),
        fade(tagline, 0, TIMING.markIn),
        fade(mark, 1, TIMING.markIn),
      ]),
      fade(greeting, 1, TIMING.greetingIn),
    ]);

    animation.start();
    return () => animation.stop();
  }, [frame, greeting, mark, revealed, shatter, start, tagline, zoom]);

  return (
    <View style={styles.wrap} testID="nestor-card-showpiece" accessibilityLabel={SHOWPIECE_GREETING}>
      <Animated.Text style={[styles.mark, { opacity: mark }]}>{SHOWPIECE_MARK}</Animated.Text>
      <View style={styles.stageClip}>
        <Animated.View style={[styles.stage, { transform: [{ scale: zoom }] }]}>
          <Animated.Image source={brandingImages.hatchStart} style={[styles.art, { opacity: start }]} resizeMode="contain" />
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
      <View style={styles.footer}>
        <Animated.Text style={[styles.tagline, { opacity: tagline }]}>{SHOWPIECE_TAGLINE}</Animated.Text>
        <Animated.Text style={[styles.greeting, { opacity: greeting }]}>{SHOWPIECE_GREETING}</Animated.Text>
      </View>
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
  mark: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    zIndex: 2,
    textAlign: 'center',
    color: colors.bark,
    fontSize: type.serifMark,
    fontWeight: '700',
    letterSpacing: 0.4,
    ...serif,
  },
  stageClip: {
    width: 500,
    height: 500,
    maxWidth: '52%',
    maxHeight: '64%',
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
  footer: {
    height: 72,
    width: '100%',
    maxWidth: 760,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  tagline: {
    position: 'absolute',
    color: colors.mutedNest,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  greeting: {
    position: 'absolute',
    color: colors.bark,
    fontSize: type.greeting,
    fontWeight: '400',
    letterSpacing: 0.3,
    textAlign: 'center',
    ...serif,
  },
});
