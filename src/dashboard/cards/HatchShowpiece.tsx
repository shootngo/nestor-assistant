import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { brandingImages } from '../../branding/assets';
import { SHOWPIECE_GREETING } from '../../branding/copy';
import type { ShowpieceFrame } from '../../preview';
import { colors, type } from '../../theme';

const nativeDriver = Platform.OS !== 'web';

const TIMING = {
  nestIn: 1600,
  nestHold: 800,
  eggIn: 1700,
  eggHold: 900,
  hatchIn: 2200,
  hatchHold: 700,
  houseIn: 2000,
  greetingIn: 1400,
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
  const nest = useRef(new Animated.Value(0)).current;
  const egg = useRef(new Animated.Value(0)).current;
  const hatch = useRef(new Animated.Value(0)).current;
  const house = useRef(new Animated.Value(0)).current;
  const greeting = useRef(new Animated.Value(0)).current;
  const nestScale = useRef(new Animated.Value(0.94)).current;
  const eggY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const freeze = (stage: ShowpieceFrame) => {
      nest.setValue(1);
      nestScale.setValue(1);
      eggY.setValue(0);
      egg.setValue(stage === 'nest' ? 0 : 1);
      hatch.setValue(stage === 'hatch' || stage === 'house' ? 1 : 0);
      house.setValue(stage === 'house' ? 1 : 0);
      greeting.setValue(stage === 'house' ? 1 : 0);
    };

    if (frame) {
      freeze(frame);
      return;
    }

    nest.setValue(0);
    egg.setValue(0);
    hatch.setValue(0);
    house.setValue(0);
    greeting.setValue(0);
    nestScale.setValue(0.94);
    eggY.setValue(16);

    const animation = Animated.sequence([
      Animated.parallel([fade(nest, 1, TIMING.nestIn), fade(nestScale, 1, TIMING.nestIn)]),
      Animated.delay(TIMING.nestHold),
      Animated.parallel([fade(egg, 1, TIMING.eggIn), fade(eggY, 0, TIMING.eggIn)]),
      Animated.delay(TIMING.eggHold),
      fade(hatch, 1, TIMING.hatchIn),
      Animated.delay(TIMING.hatchHold),
      fade(house, 1, TIMING.houseIn),
      fade(greeting, 1, TIMING.greetingIn),
    ]);

    animation.start();
    return () => animation.stop();
  }, [egg, eggY, frame, greeting, hatch, house, nest, nestScale]);

  return (
    <View style={styles.wrap} testID="nestor-card-showpiece" accessibilityLabel={SHOWPIECE_GREETING}>
      <View style={styles.stage}>
        <Animated.Image
          source={brandingImages.nest}
          style={[styles.art, { opacity: nest, transform: [{ scale: nestScale }] }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={brandingImages.egg}
          style={[styles.art, { opacity: egg, transform: [{ translateY: eggY }] }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={brandingImages.hatch}
          style={[styles.art, { opacity: hatch }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={brandingImages.house}
          style={[styles.art, { opacity: house }]}
          resizeMode="contain"
        />
      </View>
      <Animated.Text style={[styles.greeting, { opacity: greeting }]}>{SHOWPIECE_GREETING}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingBottom: 28,
  },
  stage: {
    width: 360,
    height: 360,
    maxWidth: '34%',
    maxHeight: '52%',
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
  greeting: {
    color: colors.ivory,
    fontSize: type.greeting,
    fontWeight: '300',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 28,
    maxWidth: 720,
  },
});
