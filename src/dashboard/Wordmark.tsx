import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';

export function Wordmark({ hidden = false }: { hidden?: boolean }) {
  if (hidden) {
    return null;
  }

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={styles.mark}>Nestor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 22,
    left: 28,
    zIndex: 4,
    pointerEvents: 'none',
  },
  mark: {
    color: colors.ivoryMuted,
    fontSize: type.wordmark,
    fontWeight: '300',
    letterSpacing: 4,
  },
});
