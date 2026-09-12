import { Pressable, StyleSheet, Text } from 'react-native';
import { ALLOW_WAKE_SIMULATE } from '../config';
import { colors, type } from '../theme';

export function Wordmark({
  hidden = false,
  onLongPress,
}: {
  hidden?: boolean;
  onLongPress?: () => void;
}) {
  if (hidden) {
    return null;
  }

  return (
    <Pressable
      style={styles.wrap}
      accessibilityRole="header"
      onLongPress={ALLOW_WAKE_SIMULATE ? onLongPress : undefined}
      delayLongPress={800}
    >
      <Text style={styles.mark}>Nestor</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 4,
  },
  mark: {
    color: colors.ivoryMuted,
    fontSize: type.wordmark,
    fontWeight: '300',
    letterSpacing: 4,
  },
});
