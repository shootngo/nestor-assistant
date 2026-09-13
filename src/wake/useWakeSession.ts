import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { ALLOW_WAKE_SIMULATE, LISTENING_SILENCE_MS, LISTENING_VOICE_RMS, WAKE_PHRASE } from '../config';
import { releaseWakeAudio } from '../listen/audioHandoff';
import { useListenLoop } from '../listen/useListenLoop';
import { armSttForWake, disarmStt, kwsAcceptsWake } from '../listen/sttGate';
import { useOvernight } from '../overnight/useOvernight';
import { getPreviewAnswer, getPreviewMuted, getPreviewSession, getPreviewTalking, getWakeTapEnabled } from '../preview';
import { acceptKwsSamples, lastPreparedModel, startKeywordSpotter } from './kwsEngine';
import { pcmRms, startMicrophone, stopMicrophone } from './microphone';
import { getMicPermission, requestMicPermission } from './permissions';
import { prepareKwsModel, type PreparedKwsModel } from './prepareModel';
import { phaseAfterWakeInitFailure } from './startupPolicy';
import type { MicPermission, WakeKeywordId, WakePhase } from './types';

type WakeSessionOptions = {
  /** Wait until the kitchen board has painted before touching sherpa / AudioRecord. */
  boardReady?: boolean;
};

export function useWakeSession(options?: WakeSessionOptions) {
  const boardReady = options?.boardReady ?? true;
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
  const modelRef = useRef<PreparedKwsModel | null>(null);
  const permissionRef = useRef<MicPermission>('unknown');
  permissionRef.current = permission;

  const goIdle = useCallback(() => {
    disarmStt();
    setKeepKwsMic(false);
    setPhase('idle');
  }, []);

  const goListening = useCallback(() => {
    armSttForWake();
    silenceAt.current = Date.now() + LISTENING_SILENCE_MS;
    setKeepKwsMic(false);
    engineReady.current = false;
    setPhase('listening');
    void releaseWakeAudio();
  }, []);

  const goExiting = useCallback(() => {
    disarmStt();
    setKeepKwsMic(false);
    engineReady.current = false;
    setPhase('exiting');
    void releaseWakeAudio();
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
      const wakeHit =
        keyword === WAKE_PHRASE ||
        keyword === 'nestor' ||
        keyword === 'hey_nestor';
      if (wakeHit && current === 'idle' && kwsAcceptsWake()) {
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
      void acceptKwsSamples(samples, sampleRate)
        .then((keyword) => {
          if (keyword) {
            handleKeyword(keyword);
          }
        })
        .catch((error) => {
          console.warn('Nestor: KWS accept failed', error);
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
      permissionRef.current = current;
      if (current !== 'granted') {
        if (current === 'denied' && phaseRef.current === 'idle') {
          setPhase(phaseAfterWakeInitFailure('mic-denied'));
        }
        return;
      }

      const model = await prepareKwsModel();
      if (!model) {
        console.warn('Nestor: KWS model missing; kitchen board stays idle without wake');
        engineReady.current = false;
        setKwsReady(false);
        if (phaseRef.current === 'mic-needed') {
          setPhase(phaseAfterWakeInitFailure('model-missing'));
        }
        return;
      }
      modelRef.current = model;
      if (phaseRef.current !== 'idle') {
        setKwsReady(true);
        return;
      }
      const kws = await startKeywordSpotter(model);
      engineReady.current = kws;
      setKwsReady(kws);
      if (!kws) {
        console.warn('Nestor: keyword spotter failed; kitchen board stays idle');
      }
    } catch (error) {
      engineReady.current = false;
      setKwsReady(false);
      console.warn('Nestor: wake engine failed; kitchen board stays idle', error);
      if (phaseRef.current !== 'listening' && phaseRef.current !== 'exiting') {
        setPhase(phaseAfterWakeInitFailure('exception'));
      }
    } finally {
      starting.current = false;
    }
  }, []);

  useEffect(() => {
    if (preview || !boardReady) {
      return;
    }
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!cancelled) {
        void startEngine(true);
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
      engineReady.current = false;
      setKwsReady(false);
      void releaseWakeAudio();
    };
  }, [boardReady, preview, startEngine]);

  useEffect(() => {
    if (preview || Platform.OS !== 'android') {
      return;
    }
    if (phase === 'listening' || phase === 'exiting') {
      engineReady.current = false;
      void releaseWakeAudio();
      return;
    }
    if (phase !== 'idle' || permission !== 'granted') {
      return;
    }
    const model = modelRef.current ?? lastPreparedModel();
    if (!model || engineReady.current || starting.current) {
      return;
    }
    let cancelled = false;
    void startKeywordSpotter(model).then((ok) => {
      if (cancelled) {
        return;
      }
      engineReady.current = ok;
      setKwsReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, permission, preview]);

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
    void startMicrophone(onAudio)
      .then((ok) => {
        if (cancelled) {
          void stopMicrophone();
          return;
        }
        if (!ok && phaseRef.current === 'idle') {
          setPhase(phaseAfterWakeInitFailure('mic-failed'));
        }
      })
      .catch((error) => {
        console.warn('Nestor: microphone start failed; kitchen board stays idle', error);
        if (!cancelled && phaseRef.current === 'idle') {
          setPhase(phaseAfterWakeInitFailure('mic-failed'));
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
      const model = modelRef.current ?? lastPreparedModel();
      if (model) {
        void startKeywordSpotter(model).then((ok) => {
          engineReady.current = ok;
        });
      }
    },
  });

  const tapToWake = useCallback(() => {
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'mic-needed') {
      return;
    }
    if (Platform.OS !== 'android') {
      goListening();
      return;
    }
    if (permissionRef.current !== 'granted') {
      setPhase('idle');
      void startEngine(true).then(() => {
        if (permissionRef.current === 'granted' && phaseRef.current === 'idle') {
          goListening();
        }
      });
      return;
    }
    goListening();
  }, [goListening, startEngine]);

  const simulateWake = useCallback(() => {
    if (!ALLOW_WAKE_SIMULATE && !getWakeTapEnabled()) {
      tapToWake();
      return;
    }
    tapToWake();
  }, [tapToWake]);

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
    tapToWake,
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
