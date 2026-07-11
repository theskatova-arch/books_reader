import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@tutorial_v1:';

/**
 * Tracks whether a named tutorial step has been completed.
 * - `seen === null`  — still loading from storage (render nothing yet)
 * - `seen === false` — not done yet; show the tutorial
 * - `seen === true`  — already done; hide the tutorial
 */
export function useTutorialStep(stepId: string) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFIX + stepId)
      .then((val) => setSeen(val === 'done'))
      .catch(() => setSeen(true)); // silently skip on storage error
  }, [stepId]);

  const markSeen = useCallback(async () => {
    setSeen(true);
    try {
      await AsyncStorage.setItem(PREFIX + stepId, 'done');
    } catch {
      // ignore
    }
  }, [stepId]);

  return { seen, markSeen };
}
