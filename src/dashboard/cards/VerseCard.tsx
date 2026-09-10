import { StyleSheet, Text, View } from 'react-native';
import type { VerseCardData } from '../../types';
import { colors, type } from '../../theme';

export function VerseCard({ card }: { card: VerseCardData }) {
  return (
    <View style={styles.wrap} testID="nestor-card-verse" accessibilityLabel={`${card.reference}. ${card.text}`}>
      <Text style={styles.kicker}>Verse of the day</Text>
      <View style={styles.rule} />
      <Text style={styles.verse}>“{card.text}”</Text>
      <Text style={styles.reference}>
        {card.reference}
        {card.version ? `  ·  ${card.version}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 80,
    maxWidth: 980,
    alignSelf: 'center',
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
  verse: {
    color: colors.ivory,
    fontSize: type.verse,
    lineHeight: 44,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  reference: {
    color: colors.ivoryMuted,
    fontSize: 20,
    marginTop: 28,
    letterSpacing: 0.6,
  },
});
