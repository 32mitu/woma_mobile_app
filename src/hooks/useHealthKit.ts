import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit?.Constants?.Permissions?.Steps],
    write: [],
  },
};

export const useHealthKit = () => {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // 1. 初期化ロジック (マウント時に実行)
  useEffect(() => {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      console.log('HealthKit is not available (Not iOS or Library missing).');
      return;
    }

    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.log('[ERROR] Cannot grant permissions!', error);
        return;
      }
      setIsAvailable(true);
    });
  }, []);

  // 2. 歩数取得関数 (ボタンから呼び出し用)
  const getTodaySteps = useCallback((): Promise<number> => {
    return new Promise((resolve, reject) => {
      // iOS以外、または初期化未完了時は0を返す
      if (Platform.OS !== 'ios' || !isAvailable) {
        // 開発用ダミーデータ (必要に応じてコメントアウトを外す)
        // resolve(5678); 
        console.warn('HealthKit not ready or not supported.');
        resolve(0); 
        return;
      }

      setLoading(true);

      const options = {
        date: new Date().toISOString(), // 今日の日付
        includeManuallyAdded: true,     // 手入力分も含む
      };

      AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
        setLoading(false);
        
        if (err) {
          console.error('Error getting steps:', err);
          reject(err);
          return;
        }
        
        // results.value が歩数
        console.log('Fetched Steps:', results.value);
        resolve(results.value);
      });
    });
  }, [isAvailable]);

  return { getTodaySteps, loading, isAvailable };
};