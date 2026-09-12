import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  ALLOW_WAKE_SIMULATE,
  LISTENING_SILENCE_MS,
  LISTENING_VOICE_RMS,
  WAKE_PHRASE,
} from '../config';
import { useListenLoop } from '../listen/useListenLoop';
import { useOvernight } from '../overnight/useOvernight';
import { getPreviewAnswer, getPreviewMuted, getPreviewSession, getPreviewTalking, getWakeTapEnabled } from '../preview';
import { acceptKwsSamples, startKeywordSpotter, stopKeywordSpotter } from './kwsEngine';
import { pcmRms, startMicrophone, stopMicrophone } from './microphone';
import { getMicPermission, requestMicPermission } from './permissions';
import { prepareKwsModel } from './prepareModel';
import type { MicPermission, WakeKeywordId, WakePhase } from './types';

export function useWakeSession() {
  const preview = getPreviewSession();
  const previewTalking = getPreviewTalking();
  const previewMuted = getPreviewMuted();
  const [phase, setPhase] = useState<WakePhase>(preview ?? 'idle');
  const [permission, setPermission] = useState<MicPermission>('unknown');
  const [kwsReady, setKwsReady] = useState(false);
  const [keepKwsMic, setKeepKwsMic] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const silenceAt = useRef(preview === 'listening' ? Number.POSITIVE_INFINITY : 0);
  const engineReady = useRef(false);
  const starting = useRef(false);
  const keepKwsMicRef = useRef(false);
  keepKwsMicRef.current = keepKwsMic;

  const goIdle = useCallback(() => {
    setKeepKwsMic(false);
    setPhase('idle');
  }, []);

  const goListening = useCallback(() => {
    silenceAt.current = Date.now() + LISTENING_SILENCE_MS;
    setKeepKwsMic(false);
    setPhase('listening');
  }, []);

  const goExiting = useCallback(() => {
    setKeepKwsMic(false);
    setPhase('exiting');
  }, []);

  const bumpIdleTimer = useCallback(() => {
    silenceAt.current = Date.now() + LISTENING_SILENCE_MS;
  }, []);

  const holdIdleTimer = useCallback(() => {
    silenceAt.current = Number.POSITIVE_INFINITY;
  }, []);

  const handleKeyword = useCallback(
    (keyword: WakeKeywordId) => {
      const current = phaseRef.current;
      if (keyword === 'goodbye_nestor' && current === 'listening') {
        goExiting();
        return;
      }
      const wakeHit = keyword === WAKE_PHRASE || (WAKE_PHRASE === 'nestor' && keyword === 'hey_nestor');
      if (wakeHit && current === 'idle') {
        goListening();
      }
    },
    [goExiting, goListening],
  );

  const onAudio = useCallback(
    (samples: number[], sampleRate: number) => {
      const current = phaseRef.current;
      if (current === 'listening' && pcmRms(samples) >= LISTENING_VOICE_RMS) {
        silenceAt.current = Date.now() + LISTENING_SILENCE_MS;
      }
      if (!engineReady.current) {
        return;
      }
      if (current !== 'idle' && !(current === 'listening' && keepKwsMicRef.current)) {
        return;
      }
      void acceptKwsSamples(samples, sampleRate).then((keyword) => {
        if (keyword) {
          handleKeyword(keyword);
        }
      });
    },
    [handleKeyword],
  );

  const startEngine = useCallback(async (ask: boolean) => {
    if (Platform.OS !== 'android' || starting.current) {
      return;
    }
    starting.current = true;
    try {
      const current = ask ? await requestMicPermission() : await getMicPermission();
      setPermission(current);
      if (current !== 'granted') {
        if (current === 'denied' && phaseRef.current === 'idle') {
          setPhase('mic-needed');
        }
        return;
      }

      const model = await prepareKwsModel();
      if (!model) {
        return;
      }
      const kws = await startKeywordSpotter(model);
      engineReady.current = kws;
      setKwsReady(kws);
    } finally {
      starting.current = false;
    }
  }, []);

  useEffect(() => {
    if (preview) {
      return;
    }
    void startEngine(true);
    return () => {
      engineReady.current = false;
      setKwsReady(false);
      void stopMicrophone();
      void stopKeywordSpotter();
    };
  }, [preview, startEngine]);

  const wantKwsMic = phase === 'idle' || (phase === 'listening' && keepKwsMic);

  useEffect(() => {
    if (preview || Platform.OS !== 'android' || permission !== 'granted' || !kwsReady) {
      return;
    }
    if (!wantKwsMic) {
      void stopMicrophone();
      return;
    }
    let cancelled = false;
    void startMicrophone(onAudio).then((ok) => {
      if (cancelled) {
        void stopMicrophone();
        return;
      }
      if (!ok && phaseRef.current === 'idle') {
        setPhase('mic-needed');
      }
    });
    return () => {
      cancelled = true;
      void stopMicrophone();
    };
  }, [kwsReady, onAudio, permission, preview, wantKwsMic]);

  useEffect(() => {
    if (preview || phase !== 'listening') {
      return;
    }
    const timer = setInterval(() => {
      if (Date.now() >= silenceAt.current) {
        goExiting();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [goExiting, phase, preview]);

  const overnight = useOvernight(phase !== 'idle');

  const listen = useListenLoop({
    enabled: phase === 'listening',
    preview: Boolean(preview),
    previewTalking,
    previewMuted,
    previewAnswer: getPreviewAnswer(),
    quietNight: overnight.quiet,
    onSleep: goExiting,
    onHeard: bumpIdleTimer,
    onBusy: (busy) => {
      if (busy) {
        holdIdleTimer();
      } else if (phaseRef.current === 'listening') {
        bumpIdleTimer();
      }
    },
    onSpeechUnavailable: () => {
      setKeepKwsMic(true);
    },
  });

  const simulateWake = useCallback(() => {
    if (!ALLOW_WAKE_SIMULATE && !getWakeTapEnabled()) {
      return;
    }
    if (phaseRef.current === 'idle') {
      goListening();
    }
  }, [goListening]);

  const simulateSleep = useCallback(() => {
    if (!ALLOW_WAKE_SIMULATE && !getWakeTapEnabled()) {
      return;
    }
    if (phaseRef.current === 'listening') {
      goExiting();
    }
  }, [goExiting]);

  const retryMic = useCallback(() => {
    setPhase('idle');
    void startEngine(true);
  }, [startEngine]);

  const dismissMicCard = useCallback(() => {
    setPhase('idle');
  }, []);

  return {
    phase,
    permission,
    simulateWake,
    simulateSleep,
    finishExit: goIdle,
    retryMic,
    dismissMicCard,
    mode: listen.mode,
    answer: listen.answer,
    muted: listen.muted,
    toggleMute: listen.toggleMute,
    volumeUp: listen.volumeUp,
    volumeDown: listen.volumeDown,
    overnight,
  };
}
