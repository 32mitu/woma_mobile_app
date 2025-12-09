import { useState, useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit?.Constants?.Permissions?.Steps], // オプショナルチェーンを追加
    write: [],
  },
};

export const useHealthKit = () => {
  const [dailySteps, setDailySteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // 【重要】iOS以外、またはHealthKitがロードできない環境（Expo Goなど）では何もしない
    if (Platform.OS !== 'ios' || !AppleHealthKit || !AppleHealthKit.initHealthKit) {
      console.log('HealthKit is not available in this environment.');
      // ★ 開発用にダミーデータを見たい場合はここでセットできます
      // setDailySteps(5678); 
      // setIsAvailable(true);
      return;
    }

    // 歩数取得関数
    const fetchSteps = () => {
      const options = {
        date: new Date().toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
        if (err) {
          console.log('Error getting steps:', err);
          return;
        }
        setDailySteps(results.value);
      });
    };

    // 初期化
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.log('[ERROR] Cannot grant permissions!');
        return;
      }
      setIsAvailable(true);
      fetchSteps();
    });

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchSteps();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { dailySteps, isAvailable };
};