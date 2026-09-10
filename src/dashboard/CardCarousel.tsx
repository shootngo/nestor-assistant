import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { CARD_FADE_MS, CARD_INTERVAL_MS } from '../config';
import { colors } from '../theme';
import type { DashboardCard } from '../types';
import { DashboardCardView } from './cards/DashboardCardView';

type Props = {
  cards: DashboardCard[];
};

export function CardCarousel({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const fading = useRef(false);
  const indexRef = useRef(0);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (fading.current || cards.length === 0) {
        return;
      }
      fading.current = true;
      Animated.timing(opacity, {
        toValue: 0,
        duration: CARD_FADE_MS,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (!finished) {
          fading.current = false;
          return;
        }
        indexRef.current = nextIndex;
        setIndex(nextIndex);
        Animated.timing(opacity, {
          toValue: 1,
          duration: CARD_FADE_MS,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          fading.current = false;
        });
      });
    },
    [cards.length, opacity],
  );

  const advance = useCallback(() => {
    if (cards.length < 2) {
      return;
    }
    const next = (indexRef.current + 1) % cards.length;
    goTo(next);
  }, [cards.length, goTo]);

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    opacity.setValue(1);
    fading.current = false;
  }, [cards, opacity]);

  useEffect(() => {
    if (cards.length < 2) {
      return;
    }
    const timer = setInterval(advance, CARD_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [advance, cards.length, index]);

  const card = cards[index] ?? cards[0];
  if (!card) {
    return null;
  }

  return (
    <Pressable style={styles.press} onPress={advance} accessibilityRole="button" accessibilityLabel="Show next card">
      <Animated.View style={[styles.card, { opacity }]}>
        <DashboardCardView card={card} />
      </Animated.View>
      {cards.length > 1 ? (
        <View style={styles.dots}>
          {cards.map((entry, dotIndex) => (
            <View
              key={entry.id}
              style={[styles.dot, dotIndex === index ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  dots: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    pointerEvents: 'none',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  dotIdle: {
    backgroundColor: colors.stone,
    opacity: 0.45,
  },
});
