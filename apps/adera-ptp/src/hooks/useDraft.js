import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@adera_parcel_draft_v2';

export default function useDraft(initialState = {}) {
  const [data, setData] = useState(initialState);
  const [loaded, setLoaded] = useState(false);

  // load once
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  // save throttled
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 1500);
    return () => clearTimeout(id);
  }, [data, loaded]);

  const update = useCallback((partial) => {
    setData((d) => ({ ...d, ...partial }));
  }, []);

  const clear = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).finally(() => setData({}));
  }, []);

  return { draft: data, updateDraft: update, clearDraft: clear, loaded };
}
