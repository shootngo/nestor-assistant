import { StyleSheet, Text, View } from 'react-native';
import type { UnavailableCardData } from '../../types';
import { colors, type } from '../../theme';

const COPY: Record<string, string> = {
  weather: "Couldn't load the weather.",
  news: "Couldn't load the news.",
  history: "Couldn't load today's history.",
  board: "Couldn't load the kitchen board.",
};

export function UnavailableCard({ card }: { card: UnavailableCardData }) {
  const message = COPY[card.topic] ?? "Couldn't load this card.";

  return (
    <View style={styles.wrap} accessibilityLabel={message}>
      <Text style={styles.kicker}>Nestor</Text>
      <View style={styles.rule} />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Trying again on the next refresh.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  kicker: {
    color: colors.gold,
    fontSize: type.kicker,
    fontWeight: '500',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  rule: {
    width: 48,
    height: 2,
    backgroundColor: colors.gold,
    marginTop: 16,
    marginBottom: 22,
    borderRadius: 1,
  },
  message: {
    color: colors.ivoryMuted,
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '300',
  },
  hint: {
    color: colors.stone,
    fontSize: 16,
    marginTop: 14,
  },
});
