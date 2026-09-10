import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HatchShowpiece } from './cards/HatchShowpiece';
import { PLAYLIST_REFRESH_MS } from '../config';
import { getShowpieceFrame } from '../preview';
import { colors } from '../theme';
import type { DashboardCard } from '../types';
import { loadPlaylist } from './buildPlaylist';
import { CardCarousel, type ActiveCardInfo } from './CardCarousel';
import { Wordmark } from './Wordmark';

export function Dashboard() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<ActiveCardInfo | null>(null);
  const frozenFrame = getShowpieceFrame();

  const refresh = useCallback(async () => {
    try {
      const next = await loadPlaylist();
      setCards(next);
    } catch {
      setCards([
        {
          kind: 'unavailable',
          id: 'unavailable-board',
          topic: 'board',
        },
      ]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (frozenFrame) {
      setReady(true);
      return;
    }
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, PLAYLIST_REFRESH_MS);
    return () => clearInterval(timer);
  }, [frozenFrame, refresh]);

  if (frozenFrame) {
    return (
      <View style={styles.screen}>
        <HatchShowpiece frame={frozenFrame} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Wordmark hidden={active?.showpiece === true} />
      {ready ? (
        <CardCarousel cards={cards} onActive={setActive} />
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingLabel}>Kitchen board</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLabel: {
    color: colors.stone,
    fontSize: 18,
    letterSpacing: 1.6,
  },
});
