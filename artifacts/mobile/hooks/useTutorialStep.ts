import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@tutorial_v11:';

/**
 * Tracks whether a named tutorial step has been completed.
 * Re-reads from AsyncStorage every time the screen gains focus so that
 * state stays fresh across tab navigation (tabs stay mounted).
 *
 * - `seen === null`  — still loading from storage (render nothing yet)
 * - `seen === false` — not done yet; show the tutorial
 * - `seen === true`  — already done; hide the tutorial
 */
export function useTutorialStep(stepId: string) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PREFIX + stepId)
        .then((val) => setSeen(val === 'done'))
        .catch(() => setSeen(true)); // silently skip on storage error
    }, [stepId]),
  );

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
