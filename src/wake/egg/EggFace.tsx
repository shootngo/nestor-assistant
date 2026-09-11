import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

const nativeDriver = Platform.OS !== 'web';

type Props = {
  walking?: boolean;
  talking?: boolean;
  holdTalking?: boolean;
  walk: Animated.Value;
};

export function EggFace({ walking = false, talking = false, holdTalking = false, walk }: Props) {
  const blink = useRef(new Animated.Value(1)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(0)).current;
  const leftStep = useRef(new Animated.Value(0)).current;
  const rightStep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idle = Animated.loop(
      Animated.sequence([
        Animated.delay(3200),
        Animated.timing(blink, {
          toValue: 0.08,
          duration: 90,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
        Animated.delay(2400),
        Animated.timing(blink, {
          toValue: 0.08,
          duration: 80,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 100,
          useNativeDriver: nativeDriver,
        }),
      ]),
    );
    idle.start();
    return () => idle.stop();
  }, [blink]);

  useEffect(() => {
    const inhale = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativeDriver,
        }),
      ]),
    );
    inhale.start();
    return () => inhale.stop();
  }, [breath]);

  useEffect(() => {
    if (holdTalking) {
      mouth.setValue(1);
      return;
    }
    if (!talking) {
      mouth.setValue(0);
      return;
    }
    const chatter = Animated.loop(
      Animated.sequence([
        Animated.timing(mouth, {
          toValue: 1,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(mouth, {
          toValue: 0.15,
          duration: 80,
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(mouth, {
          toValue: 0.85,
          duration: 90,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(mouth, {
          toValue: 0.05,
          duration: 70,
          useNativeDriver: nativeDriver,
        }),
      ]),
    );
    chatter.start();
    return () => chatter.stop();
  }, [holdTalking, mouth, talking]);

  useEffect(() => {
    if (!walking) {
      leftStep.setValue(0);
      rightStep.setValue(0);
      return;
    }
    const stride = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(leftStep, {
            toValue: 1,
            duration: 280,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(leftStep, {
            toValue: 0,
            duration: 280,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativeDriver,
          }),
        ]),
        Animated.sequence([
          Animated.timing(rightStep, {
            toValue: 0,
            duration: 280,
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(rightStep, {
            toValue: 1,
            duration: 280,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativeDriver,
          }),
        ]),
      ]),
    );
    stride.start();
    return () => stride.stop();
  }, [leftStep, rightStep, walking]);

  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });
  const hop = walk.interpolate({
    inputRange: [0, 0.2, 0.45, 0.7, 1],
    outputRange: [0, -10, 4, -8, 16],
  });
  const slide = walk.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 640],
  });

  return (
    <Animated.View
      style={[
        styles.actor,
        {
          transform: [{ translateX: slide }, { translateY: hop }, { scale }],
        },
      ]}
    >
      <View style={styles.shell}>
        <View style={styles.shine} />
        <View style={styles.eyes}>
          <Animated.View style={[styles.eye, { transform: [{ scaleY: blink }] }]} />
          <Animated.View style={[styles.eye, { transform: [{ scaleY: blink }] }]} />
        </View>
        <Animated.View
          style={[
            styles.mouth,
            {
              transform: [
                {
                  scaleY: mouth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.22, 1],
                  }),
                },
                {
                  scaleX: mouth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1.08],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      {walking ? (
        <View style={styles.legs}>
          <Animated.View
            style={[
              styles.leg,
              {
                transform: [
                  {
                    rotate: leftStep.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-18deg', '22deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.foot} />
          </Animated.View>
          <Animated.View
            style={[
              styles.leg,
              styles.legRight,
              {
                transform: [
                  {
                    rotate: rightStep.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['22deg', '-18deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.foot} />
          </Animated.View>
        </View>
      ) : (
        <View style={styles.rest} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actor: {
    width: 220,
    height: 280,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shell: {
    width: 168,
    height: 210,
    borderRadius: 84,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(63, 42, 29, 0.14)',
  },
  shine: {
    position: 'absolute',
    top: 28,
    left: 38,
    width: 36,
    height: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-18deg' }],
  },
  eyes: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 18,
  },
  eye: {
    width: 14,
    height: 18,
    borderRadius: 8,
    backgroundColor: colors.bark,
  },
  mouth: {
    marginTop: 18,
    width: 28,
    height: 18,
    borderRadius: 12,
    backgroundColor: colors.bark,
    opacity: 0.85,
  },
  rest: {
    width: 36,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.creamDeep,
    marginTop: 6,
  },
  legs: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 2,
    height: 42,
    alignItems: 'flex-start',
  },
  leg: {
    width: 7,
    height: 34,
    borderRadius: 4,
    backgroundColor: colors.twig,
    alignItems: 'center',
  },
  legRight: {
    marginTop: 2,
  },
  foot: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.twig,
  },
});
