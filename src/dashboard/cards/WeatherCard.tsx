import { StyleSheet, Text, View } from 'react-native';
import type { WeatherCardData } from '../../types';
import { colors, type } from '../../theme';

export function WeatherCard({ card }: { card: WeatherCardData }) {
  return (
    <View style={styles.wrap} testID="nestor-card-weather" accessibilityLabel={`${card.location}, ${card.temperatureF} degrees, ${card.condition}`}>
      <Text style={styles.kicker}>{card.location}</Text>
      <Text style={styles.temp}>{card.temperatureF}°</Text>
      <Text style={styles.condition}>{card.condition}</Text>
      <View style={styles.rule} />
      <View style={styles.row}>
        <Text style={styles.meta}>High {card.highF}°</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>Low {card.lowF}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  kicker: {
    color: colors.gold,
    fontSize: type.kicker,
    fontWeight: '500',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  temp: {
    color: colors.ivory,
    fontSize: type.weatherTemp,
    fontWeight: '200',
    letterSpacing: -2,
    lineHeight: 128,
    marginTop: 8,
  },
  condition: {
    color: colors.ivoryMuted,
    fontSize: type.weatherMeta,
    fontWeight: '400',
    marginTop: 4,
  },
  rule: {
    width: 48,
    height: 2,
    backgroundColor: colors.gold,
    marginTop: 22,
    marginBottom: 18,
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  meta: {
    color: colors.ivoryMuted,
    fontSize: type.meta,
    letterSpacing: 0.6,
  },
  dot: {
    color: colors.stone,
    fontSize: type.meta,
  },
});
