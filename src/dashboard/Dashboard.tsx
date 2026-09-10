import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PLAYLIST_REFRESH_MS } from '../config';
import { colors } from '../theme';
import type { DashboardCard } from '../types';
import { loadPlaylist } from './buildPlaylist';
import { CardCarousel } from './CardCarousel';
import { Wordmark } from './Wordmark';

export function Dashboard() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [ready, setReady] = useState(false);

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
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, PLAYLIST_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <View style={styles.screen}>
      <Wordmark />
      {ready ? (
        <CardCarousel cards={cards} />
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
