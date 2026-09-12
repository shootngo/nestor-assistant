import { useEffect, useState } from 'react';
import { OVERNIGHT_DIM_END_HOUR, OVERNIGHT_DIM_START_HOUR } from '../config';
import { getOvernightPreview, getPreviewClock } from '../preview';
import { applyOvernightBrightness } from './brightness';
import { formatHouseholdClock, type OvernightClock } from './clock';
import { isOvernightNow } from './window';

const CLOCK_TICK_MS = 1000;

export function useOvernight(sessionActive: boolean) {
  const preview = getOvernightPreview();
  const frozenClock = getPreviewClock();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (frozenClock) {
      return;
    }
    const timer = setInterval(() => {
      setNow(new Date());
    }, CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, [frozenClock]);

  const inWindow =
    preview === true
      ? true
      : preview === false
        ? false
        : isOvernightNow(now, OVERNIGHT_DIM_START_HOUR, OVERNIGHT_DIM_END_HOUR);
  const dimmed = inWindow && !sessionActive;
  const clock: OvernightClock = frozenClock ?? formatHouseholdClock(now);

  useEffect(() => {
    void applyOvernightBrightness(dimmed);
    return () => {
      if (dimmed) {
        void applyOvernightBrightness(false);
      }
    };
  }, [dimmed]);

  return {
    inWindow,
    dimmed,
    clock,
    quiet: inWindow,
  };
}
