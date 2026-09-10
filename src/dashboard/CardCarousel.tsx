import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { consumeBrandingPass } from '../branding/gate';
import { BRANDING_SHOWPIECE_MS, CARD_FADE_MS, CARD_INTERVAL_MS } from '../config';
import { getForceShowpiece, getStartAtBranding } from '../preview';
import { colors } from '../theme';
import type { BrandingMode, DashboardCard } from '../types';
import { DashboardCardView } from './cards/DashboardCardView';

export type ActiveCardInfo = {
  kind: DashboardCard['kind'];
  showpiece: boolean;
};

type Props = {
  cards: DashboardCard[];
  onActive?: (info: ActiveCardInfo) => void;
};

function firstIndex(cards: DashboardCard[]): number {
  if (getStartAtBranding()) {
    const brandingAt = cards.findIndex((card) => card.kind === 'branding');
    if (brandingAt >= 0) {
      return brandingAt;
    }
  }
  return 0;
}

function resolveBrandingMode(card: DashboardCard | undefined): BrandingMode {
  if (card?.kind !== 'branding') {
    return 'simple';
  }
  if (getForceShowpiece()) {
    return 'showpiece';
  }
  return consumeBrandingPass();
}

export function CardCarousel({ cards, onActive }: Props) {
  const [index, setIndex] = useState(() => firstIndex(cards));
  const [brandingMode, setBrandingMode] = useState<BrandingMode>('simple');
  const opacity = useRef(new Animated.Value(1)).current;
  const fading = useRef(false);
  const indexRef = useRef(index);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

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
        const nextCard = cardsRef.current[nextIndex];
        if (nextCard?.kind === 'branding') {
          setBrandingMode(resolveBrandingMode(nextCard));
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
    const start = firstIndex(cards);
    indexRef.current = start;
    setIndex(start);
    opacity.setValue(1);
    fading.current = false;
    setBrandingMode(resolveBrandingMode(cards[start]));
  }, [cards, opacity]);

  const card = cards[index] ?? cards[0];
  const showpiece = card?.kind === 'branding' && brandingMode === 'showpiece';
  const displayCard =
    card?.kind === 'branding' ? { ...card, mode: brandingMode } : card;

  useEffect(() => {
    if (cards.length < 2) {
      return;
    }
    const dwell = showpiece ? BRANDING_SHOWPIECE_MS : CARD_INTERVAL_MS;
    const timer = setTimeout(advance, dwell);
    return () => clearTimeout(timer);
  }, [advance, cards.length, index, showpiece]);

  useEffect(() => {
    if (!card) {
      return;
    }
    onActive?.({ kind: card.kind, showpiece });
  }, [card, onActive, showpiece]);

  if (!displayCard) {
    return null;
  }

  return (
    <Pressable style={styles.press} onPress={advance} accessibilityRole="button" accessibilityLabel="Show next card">
      <Animated.View style={[styles.card, { opacity }]}>
        <DashboardCardView card={displayCard} />
      </Animated.View>
      {cards.length > 1 && !showpiece ? (
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
