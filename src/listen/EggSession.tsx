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
        style={[styles.row, split ? styles.rowSplit : styles.rowCenter]}
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
            <Text style={styles.answer} numberOfLines={8}>
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
    paddingHorizontal: 28,
  },
  row: {
    width: '100%',
    maxWidth: 1100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCenter: {
    flexDirection: 'column',
  },
  rowSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingRight: 8,
  },
  persona: {
    alignItems: 'center',
  },
  stage: {
    width: 320,
    height: 300,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  stageSplit: {
    width: 280,
    transform: [{ scale: 0.92 }],
    marginBottom: 0,
  },
  answerWrap: {
    flex: 1,
    minWidth: 280,
    maxWidth: 640,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  answer: {
    color: colors.bark,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '400',
    ...serif,
  },
  mark: {
    color: colors.bark,
    fontSize: 34,
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
    fontSize: 18,
    marginTop: 8,
    letterSpacing: 0.2,
  },
});
