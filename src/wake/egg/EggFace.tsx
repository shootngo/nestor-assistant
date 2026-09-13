import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

const nativeDriver = Platform.OS !== 'web';

type Props = {
  walking?: boolean;
  talking?: boolean;
  holdTalking?: boolean;
  attentive?: boolean;
  walk: Animated.Value;
};

function Eye({ blink }: { blink: Animated.Value }) {
  return (
    <View style={styles.eyeSocket}>
      <Animated.View style={[styles.eyeCut, { transform: [{ scaleY: blink }] }]}>
        <View style={styles.eyeWhite}>
          <View style={styles.iris}>
            <View style={styles.irisShade} />
            <View style={styles.pupil} />
            <View style={styles.catchHi} />
            <View style={styles.catchLo} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function EggFace({
  walking = false,
  talking = false,
  holdTalking = false,
  attentive = false,
  walk,
}: Props) {
  const blink = useRef(new Animated.Value(1)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(0)).current;
  const leftStep = useRef(new Animated.Value(0)).current;
  const rightStep = useRef(new Animated.Value(0)).current;
  const lean = useRef(new Animated.Value(0)).current;

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
    Animated.timing(lean, {
      toValue: attentive && !talking && !walking ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: nativeDriver,
    }).start();
  }, [attentive, lean, talking, walking]);

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
    outputRange: [1, 1.028],
  });
  const hop = walk.interpolate({
    inputRange: [0, 0.2, 0.45, 0.7, 1],
    outputRange: [0, -10, 4, -8, 16],
  });
  const slide = walk.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 640],
  });
  const tilt = lean.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-4deg'],
  });
  const open = talking || holdTalking;

  return (
    <Animated.View
      style={[
        styles.actor,
        {
          transform: [{ translateX: slide }, { translateY: hop }, { rotate: tilt }, { scale }],
        },
      ]}
    >
      <View style={styles.figure}>
        <Animated.View
          style={[
            styles.arm,
            styles.armLeft,
            {
              transform: [
                {
                  rotate: walking
                    ? leftStep.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['16deg', '32deg'],
                      })
                    : '18deg',
                },
                {
                  translateY: mouth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 3],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.arm,
            styles.armRight,
            {
              transform: [
                {
                  rotate: walking
                    ? rightStep.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-16deg', '-32deg'],
                      })
                    : '-18deg',
                },
                {
                  translateY: mouth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -2],
                  }),
                },
              ],
            },
          ]}
        />

        <View style={styles.shell}>
          <View style={styles.shadeBelly} />
          <View style={styles.shadeRight} />
          <View style={styles.rim} />
          <View style={styles.shine} />
          <View style={styles.shineSoft} />
          <View style={[styles.blush, styles.blushLeft]} />
          <View style={[styles.blush, styles.blushRight]} />

          <View style={styles.brows}>
            <View style={[styles.brow, styles.browLeft]} />
            <View style={[styles.brow, styles.browRight]} />
          </View>

          <View style={styles.eyes}>
            <Eye blink={blink} />
            <Eye blink={blink} />
          </View>

          {open ? (
            <Animated.View
              style={[
                styles.mouthOpen,
                {
                  transform: [
                    {
                      scaleY: mouth.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.28, 1],
                      }),
                    },
                    {
                      scaleX: mouth.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.82, 1.06],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.mouthWell} />
              <View style={styles.tongue} />
            </Animated.View>
          ) : (
            <View style={styles.smile} />
          )}
        </View>

        <View style={styles.legs}>
          <Animated.View
            style={[
              styles.leg,
              {
                transform: [
                  {
                    rotate: leftStep.interpolate({
                      inputRange: [0, 1],
                      outputRange: walking ? ['-16deg', '20deg'] : ['-6deg', '-6deg'],
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
                      outputRange: walking ? ['20deg', '-16deg'] : ['6deg', '6deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.foot} />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actor: {
    width: 236,
    height: 300,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  figure: {
    width: 236,
    height: 300,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shell: {
    width: 168,
    height: 214,
    borderTopLeftRadius: 84,
    borderTopRightRadius: 84,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.shellRim,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
    boxShadow: '0 10px 22px rgba(63, 42, 29, 0.16)',
  },
  shadeBelly: {
    position: 'absolute',
    left: 14,
    right: 18,
    bottom: 8,
    height: 86,
    borderRadius: 70,
    backgroundColor: colors.shellShade,
    opacity: 0.38,
  },
  shadeRight: {
    position: 'absolute',
    top: 28,
    right: 6,
    width: 42,
    height: 150,
    borderRadius: 40,
    backgroundColor: colors.shellMid,
    opacity: 0.45,
  },
  rim: {
    position: 'absolute',
    top: 22,
    left: 8,
    width: 16,
    height: 130,
    borderRadius: 12,
    backgroundColor: colors.shellHi,
    opacity: 0.42,
  },
  shine: {
    position: 'absolute',
    top: 26,
    left: 36,
    width: 42,
    height: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    transform: [{ rotate: '-18deg' }],
  },
  shineSoft: {
    position: 'absolute',
    top: 48,
    left: 48,
    width: 18,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-16deg' }],
  },
  blush: {
    position: 'absolute',
    top: 118,
    width: 28,
    height: 16,
    borderRadius: 10,
    backgroundColor: colors.blush,
  },
  blushLeft: {
    left: 28,
  },
  blushRight: {
    right: 28,
  },
  brows: {
    flexDirection: 'row',
    gap: 38,
    marginTop: 8,
    zIndex: 3,
  },
  brow: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brow,
  },
  browLeft: {
    transform: [{ rotate: '-12deg' }],
  },
  browRight: {
    transform: [{ rotate: '12deg' }],
  },
  eyes: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 8,
    zIndex: 3,
  },
  eyeSocket: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeCut: {
    width: 36,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFDF8',
  },
  eyeWhite: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
  },
  iris: {
    width: 24,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.iris,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  irisShade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.irisDeep,
    opacity: 0.45,
  },
  pupil: {
    width: 10,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.pupil,
  },
  catchHi: {
    position: 'absolute',
    top: 4,
    left: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  catchLo: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  smile: {
    marginTop: 14,
    width: 24,
    height: 13,
    borderColor: colors.brow,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: 'transparent',
  },
  mouthOpen: {
    marginTop: 12,
    width: 28,
    height: 22,
    borderRadius: 14,
    backgroundColor: colors.mouthOpen,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mouthWell: {
    position: 'absolute',
    top: 2,
    left: 5,
    right: 5,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(80, 28, 24, 0.28)',
  },
  tongue: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: colors.tongue,
    marginBottom: 1,
  },
  arm: {
    position: 'absolute',
    width: 26,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.shellRim,
    zIndex: 1,
    boxShadow: '0 4px 8px rgba(63, 42, 29, 0.1)',
  },
  armLeft: {
    left: 18,
    bottom: 86,
  },
  armRight: {
    right: 18,
    bottom: 86,
  },
  legs: {
    flexDirection: 'row',
    gap: 22,
    marginTop: -4,
    height: 40,
    alignItems: 'flex-start',
    zIndex: 3,
  },
  leg: {
    width: 16,
    height: 24,
    borderRadius: 10,
    backgroundColor: colors.shellMid,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.shellRim,
  },
  legRight: {
    marginTop: 1,
  },
  foot: {
    width: 28,
    height: 14,
    borderRadius: 8,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.shellRim,
    marginBottom: -4,
  },
});
