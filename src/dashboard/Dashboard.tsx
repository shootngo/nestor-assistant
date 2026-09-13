import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { HatchShowpiece } from './cards/HatchShowpiece';
import { PLAYLIST_REFRESH_MS } from '../config';
import { getShowpieceFrame, getStartAtBranding } from '../preview';
import { colors } from '../theme';
import type { DashboardCard } from '../types';
import { loadPlaylist } from './buildPlaylist';
import { CardCarousel } from './CardCarousel';

type Props = {
  paused?: boolean;
  onSimulateWake?: () => void;
  onReady?: () => void;
};

export function Dashboard({ paused = false, onSimulateWake, onReady }: Props) {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [ready, setReady] = useState(false);
  const frozenFrame = getShowpieceFrame();
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const notifiedReady = useRef(false);

  const markReady = useCallback(() => {
    setReady(true);
    if (!notifiedReady.current) {
      notifiedReady.current = true;
      onReadyRef.current?.();
    }
  }, []);

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
      markReady();
    }
  }, [markReady]);

  useEffect(() => {
    if (frozenFrame) {
      markReady();
      return;
    }
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, PLAYLIST_REFRESH_MS);
    return () => clearInterval(timer);
  }, [frozenFrame, markReady, refresh]);

  if (frozenFrame) {
    return (
      <View style={styles.screen}>
        <HatchShowpiece frame={frozenFrame} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {ready ? (
        <ErrorBoundary
          fallback={
            <View style={styles.loading}>
              <Text style={styles.loadingLabel}>Kitchen board</Text>
            </View>
          }
        >
          <CardCarousel cards={cards} paused={paused} onSimulateWake={onSimulateWake} />
        </ErrorBoundary>
      ) : (
        <View style={styles.loading}>
          {getStartAtBranding() ? null : <Text style={styles.loadingLabel}>Kitchen board</Text>}
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
