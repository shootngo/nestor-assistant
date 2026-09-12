import { Image, StyleSheet, Text, View } from 'react-native';
import { brandingImages } from '../../branding/assets';
import type { BrandingCardData } from '../../types';
import { colors, type } from '../../theme';
import { HatchShowpiece } from './HatchShowpiece';

/** Frequent house-in-the-nest still. Silent — no music or TTS. */
export function BrandingCard({ card }: { card: BrandingCardData }) {
  if (card.mode === 'showpiece') {
    return <HatchShowpiece />;
  }

  return (
    <View style={styles.wrap} testID="nestor-card-branding" accessibilityLabel={card.line}>
      <Image source={brandingImages.houseInNest} style={styles.art} resizeMode="cover" />
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
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  art: {
    width: '78%',
    aspectRatio: 1,
    maxWidth: 360,
    maxHeight: '52%',
    borderRadius: 40,
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
