import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus, Alert, Linking } from 'react-native';
// iOS用
import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';
// Android用
import {
  initialize,
  requestPermission,
  readRecords,
  getGrantedPermissions,
  getSdkStatus, // ★追加
  SdkAvailabilityStatus, // ★追加
  Permission,
} from 'react-native-health-connect';

const iosPermissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit?.Constants?.Permissions?.Steps],
    write: [],
  },
};

export const useHealthKit = () => {
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [dailySteps, setDailySteps] = useState(0);

  // ▼ 歩数を取得する関数
  const fetchSteps = useCallback(async () => {
    setLoading(true);

    if (Platform.OS === 'ios') {
      const options = {
        date: new Date().toISOString(),
        includeManuallyAdded: true,
      };
      AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
        setLoading(false);
        if (err) return;
        setDailySteps(results.value);
      });
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const result = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: today.toISOString(),
            endTime: tomorrow.toISOString(),
          },
        });

        const totalSteps = result.records.reduce((sum, record) => sum + record.count, 0);
        setDailySteps(totalSteps);
      } catch (err) {
        console.log('[Android] 歩数取得エラー:', err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // ▼ 安全な初期化チェック関数
  const checkAndroidInitialization = async (): Promise<boolean> => {
    try {
      // 1. SDKの状態を確認
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        Alert.alert("非対応", "このAndroidバージョンはヘルスコネクトに対応していません。");
        return false;
      }
      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        Alert.alert(
          "更新が必要",
          "ヘルスコネクトアプリのインストールまたは更新が必要です。",
          [
            { text: "ストアを開く", onPress: () => Linking.openURL('market://details?id=com.google.android.apps.healthdata') },
            { text: "キャンセル" }
          ]
        );
        return false;
      }

      // 2. 初期化を実行
      const isInitialized = await initialize();
      if (!isInitialized) {
        // ★ここが重要！ falseならまだ準備できていないので、無理に進まない
        console.log("Health Connect initialization failed (returned false).");
        return false;
      }

      return true;
    } catch (e) {
      console.error("Initialization check error:", e);
      return false;
    }
  };

  // ▼ 権限をリクエストする関数（ボタンを押した時に呼ぶ）
  const requestAccess = async () => {
    if (Platform.OS !== 'android') return;
    if (requesting) return;

    setRequesting(true);
    try {
      // ★ステップ1: 安全に初期化できるかチェック
      const canProceed = await checkAndroidInitialization();
      if (!canProceed) {
        // 初期化に失敗したら、ここで止める（これでクラッシュを防ぐ）
        return;
      }

      // ★ステップ2: ここまで来たら安全にリクエストできる
      const permissions: Permission[] = [{ accessType: 'read', recordType: 'Steps' }];
      await requestPermission(permissions);

      const granted = await getGrantedPermissions();
      const hasPermission = granted.some(p => p.recordType === 'Steps');

      if (hasPermission) {
        setIsAvailable(true);
        fetchSteps();
      }
    } catch (e) {
      console.error("権限リクエスト失敗:", e);
      Alert.alert("エラー", "ヘルスコネクトの起動に失敗しました。");
    } finally {
      setRequesting(false);
    }
  };

  // ▼ 初回ロード時チェック
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'ios') {
        AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
          if (!error) {
            setIsAvailable(true);
            fetchSteps();
          }
        });
      } else if (Platform.OS === 'android') {
        const canProceed = await checkAndroidInitialization();
        if (canProceed) {
          const granted = await getGrantedPermissions();
          const hasPermission = granted.some(p => p.recordType === 'Steps');
          if (hasPermission) {
            setIsAvailable(true);
            fetchSteps();
          }
        }
      }
    };
    init();
  }, [fetchSteps]);

  // アプリ復帰時の更新
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAvailable) {
        fetchSteps();
      }
    });
    return () => subscription.remove();
  }, [isAvailable, fetchSteps]);

  return {
    dailySteps,
    getTodaySteps: fetchSteps,
    loading,
    requesting,
    isAvailable,
    requestAccess,
  };
};