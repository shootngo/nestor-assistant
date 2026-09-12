import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ALLOW_WAKE_SIMULATE } from '../config';
import { getHoldTalking } from '../preview';
import { colors, serif, type } from '../theme';
import { DISMISS_LINE } from '../wake/copy';
import { EggFace } from '../wake/egg/EggFace';
import { NestGround } from '../wake/egg/NestGround';
import { MuteBar } from './MuteBar';
import { LISTENING_LINE, THINKING_LINE } from './copy';
import type { ListenMode } from './types';

type Props = {
  mode: ListenMode;
  answer: string;
  muted: boolean;
  talkingMouth: boolean;
  onSimulateSleep?: () => void;
  onToggleMute: () => void;
  onVolumeDown: () => void;
  onVolumeUp: () => void;
};

export function EggSession({
  mode,
  answer,
  muted,
  talkingMouth,
  onSimulateSleep,
  onToggleMute,
  onVolumeDown,
  onVolumeUp,
}: Props) {
  const walk = useRef(new Animated.Value(0)).current;
  const split = Boolean(answer);
  const status = mode === 'thinking' ? THINKING_LINE : LISTENING_LINE;
  const showStatus = mode !== 'talking' || !answer;

  return (
    <View style={styles.screen} testID={answer ? 'nestor-egg-talking' : 'nestor-egg-listening'}>
      <MuteBar
        muted={muted}
        onToggleMute={onToggleMute}
        onVolumeDown={onVolumeDown}
        onVolumeUp={onVolumeUp}
      />
      <Pressable
        style={[styles.column, split ? styles.columnSplit : styles.columnCenter]}
        onPress={ALLOW_WAKE_SIMULATE ? onSimulateSleep : undefined}
        onLongPress={ALLOW_WAKE_SIMULATE ? onSimulateSleep : undefined}
        delayLongPress={700}
        accessibilityRole="button"
        accessibilityLabel={`${status}. ${DISMISS_LINE}`}
      >
        <View style={styles.persona}>
          <View style={[styles.stage, split ? styles.stageSplit : null]}>
            <NestGround />
            <EggFace walk={walk} talking={talkingMouth} holdTalking={talkingMouth && getHoldTalking()} />
          </View>
          <Text style={styles.mark}>Nestor</Text>
          {showStatus ? <Text style={styles.line}>{status}</Text> : null}
          {split ? null : <Text style={styles.hint}>{DISMISS_LINE}</Text>}
        </View>
        {split ? (
          <View style={styles.answerWrap}>
            <Text style={styles.answer} numberOfLines={10} allowFontScaling={false}>
              {answer}
            </Text>
            <Text style={styles.hint}>{DISMISS_LINE}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    paddingHorizontal: 22,
    paddingTop: 72,
  },
  column: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  columnCenter: {
    gap: 4,
  },
  columnSplit: {
    gap: 18,
    paddingBottom: 12,
  },
  persona: {
    alignItems: 'center',
  },
  stage: {
    width: 280,
    height: 270,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  stageSplit: {
    width: 240,
    height: 230,
    transform: [{ scale: 0.9 }],
    marginBottom: 0,
  },
  answerWrap: {
    width: '100%',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  answer: {
    color: colors.bark,
    fontSize: type.answer,
    lineHeight: 44,
    fontWeight: '400',
    textAlign: 'center',
    ...serif,
  },
  mark: {
    color: colors.bark,
    fontSize: type.answer,
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
    fontSize: type.hint,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.2,
  },
});
