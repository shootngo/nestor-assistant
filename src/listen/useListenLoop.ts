import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { PRIVATE_REPLY } from '../household/copy';
import { isPrivateHouseholdAsk } from '../household/privacy';
import { nightSpeakVolume } from '../overnight/window';
import { askNestor } from './brain';
import {
  MIC_HANDOFF_MS,
  TTS_HANDOFF_MS,
  delay,
  releaseWakeAudio,
  shouldRetryStt,
  sttRestartDelay,
} from './audioHandoff';
import { disarmStt, isSttArmed, sttStartsUsed } from './sttGate';
import {
  NETWORK_REPLY,
  PREVIEW_ANSWER,
  STT_MISSING_REPLY,
} from './copy';
import { isSleepUtterance, looksLikeRequest } from './request';
import { TTS_VOLUME_STEP, getSessionMuted, getSessionVolume, persistMuted, persistVolume } from './sessionState';
import type { ConversationTurn, ListenMode } from './types';
import {
  NestorVoiceEvents,
  kitchenSpeechAvailable,
  kitchenVoiceAvailable,
  nudgeTabletVolume,
  readingMs,
  releaseSpeechRecognizer,
  setNativeMuted,
  speakAnswer,
  speechCaptureActive,
  startUtteranceCapture,
  stopSpeaking,
  stopUtteranceCapture,
} from './voice';

type Options = {
  enabled: boolean;
  preview?: boolean;
  previewTalking?: boolean;
  previewMuted?: boolean;
  previewAnswer?: string;
  quietNight?: boolean;
  onSleep: () => void;
  onHeard: () => void;
  onBusy: (busy: boolean) => void;
  onSpeechUnavailable?: () => void;
};

export function useListenLoop({
  enabled,
  preview = false,
  previewTalking = false,
  previewMuted = false,
  previewAnswer: previewAnswerProp,
  quietNight = false,
  onSleep,
  onHeard,
  onBusy,
  onSpeechUnavailable,
}: Options) {
  const previewAnswer =
    previewAnswerProp || (previewTalking || previewMuted ? PREVIEW_ANSWER : '');
  const [mode, setMode] = useState<ListenMode>(previewAnswer ? 'talking' : 'listening');
  const [answer, setAnswer] = useState(previewAnswer);
  const [muted, setMuted] = useState(previewMuted || getSessionMuted());
  const [volume, setVolume] = useState(getSessionVolume());
  const [heard, setHeard] = useState('');

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const quietNightRef = useRef(quietNight);
  quietNightRef.current = quietNight;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const turnRef = useRef(0);
  const historyRef = useRef<ConversationTurn[]>([]);
  const sttUsable = useRef(true);
  const sttBusy = useRef(false);
  const errorBurst = useRef(0);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSleepRef = useRef(onSleep);
  onSleepRef.current = onSleep;
  const onHeardRef = useRef(onHeard);
  onHeardRef.current = onHeard;
  const onBusyRef = useRef(onBusy);
  onBusyRef.current = onBusy;
  const onSpeechUnavailableRef = useRef(onSpeechUnavailable);
  onSpeechUnavailableRef.current = onSpeechUnavailable;
  const presentAnswerRef = useRef<(text: string) => Promise<void>>(async () => {});
  const listenSoonRef = useRef<(delayMs?: number) => void>(() => {});

  const clearTimers = useCallback(() => {
    if (restartTimer.current) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
    if (speakTimer.current) {
      clearTimeout(speakTimer.current);
      speakTimer.current = null;
    }
  }, []);

  const bump = useCallback(() => {
    onHeardRef.current();
  }, []);

  const giveUpToIdle = useCallback(() => {
    clearTimers();
    sttBusy.current = false;
    disarmStt();
    void stopUtteranceCapture();
    void releaseSpeechRecognizer();
    onSleepRef.current();
  }, [clearTimers]);

  const listenSoon = useCallback(
    (delayMs = sttRestartDelay(0, sttStartsUsed())) => {
      if (restartTimer.current) {
        clearTimeout(restartTimer.current);
      }
      restartTimer.current = setTimeout(() => {
        restartTimer.current = null;
        if (!enabledRef.current || modeRef.current !== 'listening' || preview || !sttUsable.current) {
          return;
        }
        if (!isSttArmed() || !shouldRetryStt(0, sttStartsUsed())) {
          giveUpToIdle();
          return;
        }
        if (sttBusy.current || speechCaptureActive()) {
          return;
        }
        sttBusy.current = true;
        // Online first. Offline-prefer then fail was a guaranteed extra beep on this Tab.
        void startUtteranceCapture(false)
          .then((ok) => {
            if (!ok) {
              sttBusy.current = false;
              giveUpToIdle();
            }
          })
          .catch(() => {
            sttBusy.current = false;
            giveUpToIdle();
          });
      }, delayMs);
    },
    [giveUpToIdle, preview],
  );
  listenSoonRef.current = listenSoon;

  const finishSpeaking = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }
    onBusyRef.current(false);
    setMode('listening');
    errorBurst.current = 0;
    listenSoon(MIC_HANDOFF_MS);
  }, [listenSoon]);

  const presentAnswer = useCallback(
    async (text: string) => {
      const myTurn = turnRef.current;
      setAnswer(text);
      setMode('talking');
      onBusyRef.current(true);
      bump();

      try {
        await stopUtteranceCapture();
        await releaseSpeechRecognizer();
        await delay(TTS_HANDOFF_MS);
      } catch (error) {
        console.warn('Nestor: STT release before TTS failed', error);
      }

      const speakAloud = !mutedRef.current && kitchenVoiceAvailable();
      if (speakAloud) {
        try {
          const started = await speakAnswer(text, nightSpeakVolume(volumeRef.current, quietNightRef.current));
          if (started) {
            return;
          }
        } catch (error) {
          console.warn('Nestor: speakAnswer threw; egg stays up with text', error);
        }
      }

      speakTimer.current = setTimeout(() => {
        if (turnRef.current !== myTurn || !enabledRef.current) {
          return;
        }
        finishSpeaking();
      }, readingMs(text));
    },
    [bump, finishSpeaking],
  );
  presentAnswerRef.current = presentAnswer;

  const handleUtterance = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      sttBusy.current = false;
      if (!text || !enabledRef.current) {
        listenSoon();
        return;
      }
      bump();
      setHeard(text);

      try {
        if (isSleepUtterance(text)) {
          onSleepRef.current();
          return;
        }
        if (isPrivateHouseholdAsk(text)) {
          const myTurn = ++turnRef.current;
          setMode('thinking');
          onBusyRef.current(true);
          await stopUtteranceCapture();
          if (myTurn !== turnRef.current || !enabledRef.current) {
            return;
          }
          await presentAnswer(PRIVATE_REPLY);
          return;
        }
        if (!looksLikeRequest(text)) {
          listenSoon();
          return;
        }

        const myTurn = ++turnRef.current;
        setMode('thinking');
        onBusyRef.current(true);
        await stopUtteranceCapture();
        await releaseSpeechRecognizer();

        const nextTurns = [...historyRef.current, { role: 'user' as const, text }];
        const reply = await askNestor(nextTurns);
        if (myTurn !== turnRef.current || !enabledRef.current) {
          return;
        }

        historyRef.current = [...nextTurns, { role: 'model' as const, text: reply }].slice(-8);
        await presentAnswer(reply);
      } catch (error) {
        console.warn('Nestor: listen turn failed; kitchen session stays up', error);
        if (enabledRef.current) {
          await presentAnswer(NETWORK_REPLY);
        }
      }
    },
    [bump, listenSoon, presentAnswer],
  );

  useEffect(() => {
    if (preview || Platform.OS !== 'android') {
      return;
    }

    const subs = [
      NestorVoiceEvents.addListener('onSpeechBegin', () => {
        if (enabledRef.current && modeRef.current === 'listening') {
          bump();
        }
      }),
      NestorVoiceEvents.addListener('onSpeechResult', (event) => {
        if (!enabledRef.current || modeRef.current !== 'listening') {
          sttBusy.current = false;
          return;
        }
        errorBurst.current = 0;
        void handleUtterance('text' in event ? event.text ?? '' : '');
      }),
      NestorVoiceEvents.addListener('onSpeechPartial', (event) => {
        const text = 'text' in event ? event.text ?? '' : '';
        if (enabledRef.current && isSleepUtterance(text)) {
          onSleepRef.current();
        }
      }),
      NestorVoiceEvents.addListener('onSpeechError', (event) => {
        sttBusy.current = false;
        if (!enabledRef.current || modeRef.current !== 'listening') {
          return;
        }
        const code = 'code' in event ? event.code : 0;
        if (!isSttArmed() || !shouldRetryStt(code, sttStartsUsed())) {
          giveUpToIdle();
          return;
        }
        errorBurst.current += 1;
        listenSoon(sttRestartDelay(code, sttStartsUsed()));
      }),
      NestorVoiceEvents.addListener('onTtsDone', () => {
        if (enabledRef.current && modeRef.current === 'talking') {
          finishSpeaking();
        }
      }),
      NestorVoiceEvents.addListener('onTtsError', () => {
        if (enabledRef.current && modeRef.current === 'talking') {
          finishSpeaking();
        }
      }),
    ];

    return () => {
      for (const sub of subs) {
        sub.remove();
      }
    };
  }, [bump, finishSpeaking, giveUpToIdle, handleUtterance, listenSoon, preview]);

  useEffect(() => {
    if (!enabled) {
      turnRef.current += 1;
      clearTimers();
      sttBusy.current = false;
      errorBurst.current = 0;
      void stopUtteranceCapture();
      void releaseSpeechRecognizer();
      void stopSpeaking();
      onBusyRef.current(false);
      if (!preview) {
        setMode('listening');
        setHeard('');
        setAnswer('');
        historyRef.current = [];
      }
      return;
    }

    if (preview || Platform.OS !== 'android') {
      return;
    }

    sttUsable.current = true;
    errorBurst.current = 0;
    let cancelled = false;
    const start = setTimeout(() => {
      void (async () => {
        if (!isSttArmed()) {
          return;
        }
        try {
          await releaseWakeAudio();
          await delay(MIC_HANDOFF_MS);
        } catch (error) {
          console.warn('Nestor: wake-audio release before STT failed', error);
        }
        if (cancelled || !enabledRef.current || !isSttArmed()) {
          return;
        }
        if (!kitchenSpeechAvailable()) {
          sttUsable.current = false;
          onSpeechUnavailableRef.current?.();
          void presentAnswerRef.current(STT_MISSING_REPLY);
          return;
        }
        setMode('listening');
        listenSoonRef.current(0);
      })();
    }, MIC_HANDOFF_MS);

    return () => {
      cancelled = true;
      clearTimeout(start);
      clearTimers();
      void stopUtteranceCapture();
      void stopSpeaking();
    };
  }, [clearTimers, enabled, preview]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    persistMuted(next);
    setMuted(next);
    void setNativeMuted(next);
    if (next) {
      void stopSpeaking();
      if (modeRef.current === 'talking') {
        finishSpeaking();
      }
    }
  }, [finishSpeaking]);

  const volumeUp = useCallback(() => {
    const next = Math.min(1, volumeRef.current + TTS_VOLUME_STEP);
    volumeRef.current = next;
    persistVolume(next);
    setVolume(next);
    void nudgeTabletVolume(1);
    if (mutedRef.current) {
      mutedRef.current = false;
      persistMuted(false);
      setMuted(false);
      void setNativeMuted(false);
    }
  }, []);

  const volumeDown = useCallback(() => {
    const next = Math.max(0.05, volumeRef.current - TTS_VOLUME_STEP);
    volumeRef.current = next;
    persistVolume(next);
    setVolume(next);
    void nudgeTabletVolume(-1);
  }, []);

  return {
    mode,
    answer,
    heard,
    muted,
    volume,
    toggleMute,
    volumeUp,
    volumeDown,
  };
}
