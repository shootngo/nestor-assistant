import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, serif } from '../theme';
import { TAP_TO_WAKE_HINT, TAP_TO_WAKE_LABEL } from './copy';

type Props = {
  onPress: () => void;
};

/** Large always-visible kitchen fallback. Voice wake stays on. */
export function TapToWakeButton({ onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={TAP_TO_WAKE_LABEL}
        testID="nestor-tap-to-wake"
      >
        <Text style={styles.label} allowFontScaling={false}>
          {TAP_TO_WAKE_LABEL}
        </Text>
        <Text style={styles.hint} allowFontScaling={false}>
          {TAP_TO_WAKE_HINT}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
    zIndex: 13,
    pointerEvents: 'box-none',
  },
  button: {
    minWidth: 280,
    minHeight: 72,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 36,
    backgroundColor: colors.bark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    color: colors.cream,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.3,
    ...serif,
  },
  hint: {
    color: colors.creamDeep,
    fontSize: 15,
    marginTop: 2,
  },
});
