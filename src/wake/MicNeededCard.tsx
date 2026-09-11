import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, serif, type } from '../theme';
import { MIC_BODY, MIC_CONTINUE, MIC_RETRY, MIC_TITLE } from './copy';

type Props = {
  onRetry: () => void;
  onContinue: () => void;
};

export function MicNeededCard({ onRetry, onContinue }: Props) {
  return (
    <View style={styles.screen} testID="nestor-mic-needed" accessibilityLabel={MIC_TITLE}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Nestor</Text>
        <View style={styles.rule} />
        <Text style={styles.title}>{MIC_TITLE}</Text>
        <Text style={styles.body}>{MIC_BODY}</Text>
        <Pressable style={styles.primary} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.primaryLabel}>{MIC_RETRY}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onContinue} accessibilityRole="button">
          <Text style={styles.secondaryLabel}>{MIC_CONTINUE}</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 48,
  },
  card: {
    maxWidth: 640,
    alignItems: 'center',
  },
  kicker: {
    color: colors.sageDeep,
    fontSize: type.kicker,
    fontWeight: '500',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  rule: {
    width: 48,
    height: 2,
    backgroundColor: colors.sage,
    marginTop: 14,
    marginBottom: 22,
    borderRadius: 1,
  },
  title: {
    color: colors.bark,
    fontSize: 32,
    textAlign: 'center',
    ...serif,
  },
  body: {
    color: colors.mutedNest,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 28,
  },
  primary: {
    marginTop: 28,
    backgroundColor: colors.bark,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  primaryLabel: {
    color: colors.cream,
    fontSize: 18,
  },
  secondary: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryLabel: {
    color: colors.sageDeep,
    fontSize: 16,
  },
});
