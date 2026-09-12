import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import {
  MUTE_LABEL,
  UNMUTE_LABEL,
  VOLUME_DOWN_LABEL,
  VOLUME_UP_LABEL,
} from './copy';

type Props = {
  muted: boolean;
  onToggleMute: () => void;
  onVolumeDown: () => void;
  onVolumeUp: () => void;
};

export function MuteBar({ muted, onToggleMute, onVolumeDown, onVolumeUp }: Props) {
  return (
    <View style={styles.bar} pointerEvents="box-none">
      <Pressable
        onPress={onToggleMute}
        style={[styles.btn, muted ? styles.btnMuted : styles.btnLive]}
        accessibilityRole="button"
        accessibilityLabel={muted ? UNMUTE_LABEL : MUTE_LABEL}
        testID="nestor-mute"
      >
        <Text style={[styles.glyph, muted ? styles.glyphMuted : styles.glyphLive]}>
          {muted ? 'Muted' : 'Mute'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onVolumeDown}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={VOLUME_DOWN_LABEL}
        testID="nestor-volume-down"
      >
        <Text style={styles.glyph}>–</Text>
      </Pressable>
      <Pressable
        onPress={onVolumeUp}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={VOLUME_UP_LABEL}
        testID="nestor-volume-up"
      >
        <Text style={styles.glyph}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 18,
    right: 22,
    zIndex: 24,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    minWidth: 68,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(63, 42, 29, 0.12)',
  },
  btnLive: {
    backgroundColor: colors.creamDeep,
  },
  btnMuted: {
    backgroundColor: colors.bark,
  },
  glyph: {
    color: colors.bark,
    fontSize: type.hint,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  glyphLive: {
    color: colors.bark,
  },
  glyphMuted: {
    color: colors.cream,
  },
});
