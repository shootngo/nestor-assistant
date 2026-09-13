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
    outputRange: [1, 1.024],
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
    outputRange: ['0deg', '-3deg'],
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
      <View style={styles.contact} />
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
                        outputRange: ['22deg', '38deg'],
                      })
                    : '28deg',
                },
                {
                  translateY: mouth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
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
                        outputRange: ['-22deg', '-38deg'],
                      })
                    : '-28deg',
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
                      outputRange: walking ? ['-14deg', '18deg'] : ['-8deg', '-8deg'],
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
                      outputRange: walking ? ['18deg', '-14deg'] : ['8deg', '8deg'],
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
    width: 240,
    height: 304,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  contact: {
    position: 'absolute',
    bottom: 8,
    width: 96,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(63, 42, 29, 0.08)',
  },
  figure: {
    width: 240,
    height: 304,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shell: {
    width: 158,
    height: 212,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    borderBottomLeftRadius: 74,
    borderBottomRightRadius: 74,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.shellRim,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
    boxShadow: '0 12px 24px rgba(63, 42, 29, 0.18)',
  },
  shadeBelly: {
    position: 'absolute',
    left: 18,
    right: 22,
    bottom: 6,
    height: 92,
    borderRadius: 70,
    backgroundColor: colors.shellShade,
    opacity: 0.5,
  },
  shadeRight: {
    position: 'absolute',
    top: 36,
    right: 4,
    width: 46,
    height: 148,
    borderRadius: 40,
    backgroundColor: colors.shellMid,
    opacity: 0.55,
  },
  rim: {
    position: 'absolute',
    top: 24,
    left: 7,
    width: 14,
    height: 124,
    borderRadius: 12,
    backgroundColor: colors.shellHi,
    opacity: 0.55,
  },
  shine: {
    position: 'absolute',
    top: 24,
    left: 32,
    width: 46,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.82)',
    transform: [{ rotate: '-20deg' }],
  },
  shineSoft: {
    position: 'absolute',
    top: 46,
    left: 46,
    width: 16,
    height: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.46)',
    transform: [{ rotate: '-16deg' }],
  },
  blush: {
    position: 'absolute',
    top: 124,
    width: 26,
    height: 14,
    borderRadius: 10,
    backgroundColor: colors.blush,
  },
  blushLeft: {
    left: 22,
  },
  blushRight: {
    right: 22,
  },
  brows: {
    flexDirection: 'row',
    gap: 48,
    marginTop: 12,
    zIndex: 3,
  },
  brow: {
    width: 15,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(58, 38, 24, 0.72)',
  },
  browLeft: {
    transform: [{ rotate: '-18deg' }],
  },
  browRight: {
    transform: [{ rotate: '18deg' }],
  },
  eyes: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
    zIndex: 3,
  },
  eyeSocket: {
    width: 42,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeCut: {
    width: 40,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(63, 42, 29, 0.06)',
  },
  eyeWhite: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
  },
  iris: {
    width: 28,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.iris,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  irisShade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.irisDeep,
    opacity: 0.5,
  },
  pupil: {
    width: 11,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.pupil,
  },
  catchHi: {
    position: 'absolute',
    top: 5,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  catchLo: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  smile: {
    marginTop: 12,
    width: 22,
    height: 12,
    borderColor: colors.brow,
    borderBottomWidth: 2.2,
    borderLeftWidth: 2.2,
    borderRightWidth: 2.2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    backgroundColor: 'transparent',
  },
  mouthOpen: {
    marginTop: 10,
    width: 30,
    height: 24,
    borderRadius: 15,
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
    height: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(80, 28, 24, 0.3)',
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
    width: 22,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.shellRim,
    zIndex: 1,
    boxShadow: '0 4px 8px rgba(63, 42, 29, 0.12)',
  },
  armLeft: {
    left: 32,
    bottom: 78,
  },
  armRight: {
    right: 32,
    bottom: 78,
  },
  legs: {
    flexDirection: 'row',
    gap: 18,
    marginTop: -2,
    height: 36,
    alignItems: 'flex-start',
    zIndex: 3,
  },
  leg: {
    width: 18,
    height: 20,
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
    width: 26,
    height: 13,
    borderRadius: 8,
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: colors.shellRim,
    marginBottom: -3,
  },
});
