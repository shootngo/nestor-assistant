import { Image, StyleSheet, Text, View } from 'react-native';
import { brandingImages } from '../../branding/assets';
import type { BrandingCardData } from '../../types';
import { colors, type } from '../../theme';
import { HatchShowpiece } from './HatchShowpiece';

export function BrandingCard({ card }: { card: BrandingCardData }) {
  if (card.mode === 'showpiece') {
    return <HatchShowpiece />;
  }

  return (
    <View style={styles.wrap} testID="nestor-card-branding" accessibilityLabel={card.line}>
      <Image source={brandingImages.houseInNest} style={styles.art} resizeMode="contain" />
      <View style={styles.rule} />
      <Text style={styles.line}>{card.line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingBottom: 20,
  },
  art: {
    width: 240,
    height: 240,
    maxWidth: '28%',
    maxHeight: '44%',
    borderRadius: 36,
  },
  rule: {
    width: 48,
    height: 2,
    backgroundColor: colors.gold,
    marginTop: 18,
    marginBottom: 16,
    borderRadius: 1,
  },
  line: {
    color: colors.ivory,
    fontSize: type.branding,
    fontWeight: '300',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
