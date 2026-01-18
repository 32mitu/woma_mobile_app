import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
// iOS用
import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';
// Android用
import {
  initialize,
  requestPermission,
  readRecords,
  getGrantedPermissions,
  Permission,
} from 'react-native-health-connect';

// iOSの権限設定
const iosPermissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit?.Constants?.Permissions?.Steps],
    write: [],
  },
};

export const useHealthKit = () => {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [dailySteps, setDailySteps] = useState(0);

  // 歩数を取得する共通関数
  const fetchSteps = useCallback(async () => {
    setLoading(true);

    // --- iOSの実装 ---
    if (Platform.OS === 'ios') {
      const options = {
        date: new Date().toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
        setLoading(false);
        if (err) {
          console.log('Error fetching steps (iOS):', err);
          return;
        }
        setDailySteps(results.value);
      });
      return;
    }

    // --- Androidの実装 (Health Connect) ---
    if (Platform.OS === 'android') {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 今日の0時0分0秒
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // 明日の0時0分0秒

        // データの読み出し
        const result = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: today.toISOString(),
            endTime: tomorrow.toISOString(),
          },
        });

        // レコードごとの歩数を合計する
        const totalSteps = result.records.reduce((sum, record) => sum + record.count, 0);

        console.log('Fetched Steps (Android):', totalSteps);
        setDailySteps(totalSteps);
      } catch (err) {
        console.error('Error fetching steps (Android):', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(false);
  }, []);

  // 初期化ロジック
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'ios') {
        // iOS初期化
        if (!AppleHealthKit) return;
        AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
          if (error) {
            console.log('[iOS] Cannot grant permissions!', error);
            return;
          }
          setIsAvailable(true);
          fetchSteps();
        });
      } else if (Platform.OS === 'android') {
        // Android初期化
        try {
          // 1. Health Connect SDKの初期化
          const isInitialized = await initialize();
          if (!isInitialized) {
            console.log('[Android] Health Connect not initialized');
            return;
          }

          // 2. 権限の確認とリクエスト
          const permissions: Permission[] = [{ accessType: 'read', recordType: 'Steps' }];

          // 既に許可されているか確認（オプション）
          // const granted = await getGrantedPermissions(); 
          // 必要に応じて requestPermission を呼ぶ形が一般的

          const grantedPermissions = await requestPermission(permissions);

          // 許可が得られたか確認（read権限があるか）
          const hasPermission = grantedPermissions.some(
            p => p.accessType === 'read' && p.recordType === 'Steps'
          );

          if (hasPermission) {
            setIsAvailable(true);
            fetchSteps();
          } else {
            console.log('[Android] Permission denied');
          }
        } catch (error) {
          console.error('[Android] Health Connect init error:', error);
        }
      }
    };

    init();
  }, [fetchSteps]);

  // アプリが前面に戻った時にデータを再取得（更新）する
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAvailable) {
        fetchSteps();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAvailable, fetchSteps]);

  // 手動リフレッシュ用に getTodaySteps も返す（中身は fetchSteps を呼ぶだけ）
  const getTodaySteps = async () => {
    await fetchSteps();
    return dailySteps; // 以前のインターフェースとの互換性のため
  };

  return {
    dailySteps,    // home.tsx で使用
    getTodaySteps, // 手動更新用
    loading,
    isAvailable
  };
};