import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus, Alert, Linking, NativeModules } from 'react-native';
import i18n from '../i18n';
// iOS用
import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';
// Android用
import {
  initialize,
  requestPermission,
  readRecords,
  getGrantedPermissions,
  getSdkStatus,
  SdkAvailabilityStatus,
  Permission,
} from 'react-native-health-connect';

// 🌟 修正1: 新アーキテクチャ（TurboModules）の遅延読み込み対策パッチ
// 初回ロード時に NativeModules が空になる不具合を回避し、強制的に代入する
if (Platform.OS === 'ios' && !AppleHealthKit.initHealthKit) {
  const NativeHealthKit = NativeModules.AppleHealthKit;
  if (NativeHealthKit) {
    AppleHealthKit.initHealthKit = NativeHealthKit.initHealthKit;
    AppleHealthKit.isAvailable = NativeHealthKit.isAvailable;
    AppleHealthKit.getStepCount = NativeHealthKit.getStepCount;
  }
}

// 🌟 修正2: 'StepCount' ではなく 'Steps' を使用
// 古いバージョンのライブラリや特定のiOSバージョンでクラッシュする原因を排除
const STEP_PERMISSION = AppleHealthKit?.Constants?.Permissions?.Steps || 'Steps';

const iosPermissions: HealthKitPermissions = {
  permissions: {
    read: [STEP_PERMISSION],
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
    console.log('[HealthKit] fetchSteps called');

    if (!isAvailable && Platform.OS === 'android') {
      console.log('[HealthKit] Android: isAvailable is false. Skipping fetch.');
      return;
    }

    setLoading(true);

    if (Platform.OS === 'ios') {
      const options = {
        date: new Date().toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
        setLoading(false);
        if (err) {
          // iOSは今日のデータがまだ0件の場合にエラーを返すことがあるため、0歩として扱う
          console.log('[HealthKit] iOS Steps no data or error:', err);
          setDailySteps(0);
          return;
        }
        console.log('[HealthKit] iOS Steps:', results.value);
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

        const granted = await getGrantedPermissions();
        if (!granted.some(p => p.recordType === 'Steps')) {
          console.log('[HealthKit] Android: Steps permission missing during fetch.');
          setLoading(false);
          return;
        }

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
        console.error('[HealthKit] Android Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [isAvailable]);

  // ▼ 安全な初期化チェック関数 (Android専用)
  const checkAndroidInitialization = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
      const status = await getSdkStatus();

      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        Alert.alert(i18n.t('healthkit.notSupported'), i18n.t('healthkit.notSupportedMessage'));
        return false;
      }
      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        Alert.alert(
          i18n.t('healthkit.updateRequired'),
          i18n.t('healthkit.updateRequiredMessage'),
          [
            { text: i18n.t('healthkit.openStore'), onPress: () => Linking.openURL('market://details?id=com.google.android.apps.healthdata') },
            { text: i18n.t('common.cancel') }
          ]
        );
        return false;
      }

      const isInitialized = await initialize();
      return isInitialized;
    } catch (e) {
      console.error("[HealthKit] Android Initialization Check Error:", e);
      return false;
    }
  };

  // ▼ 権限をリクエストする関数（ボタン押下時に実行）
  const requestAccess = async () => {
    console.log('[HealthKit] requestAccess called');
    if (requesting) return;

    setRequesting(true);

    if (Platform.OS === 'ios') {
      // 🌟 修正3: iOS 17以降のUI遷移競合バグを防ぐため、リクエスト実行に微小な遅延を挿入
      setTimeout(() => {
        AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
          setRequesting(false);
          if (!error) {
            console.log('[HealthKit] iOS Permission success');
            setIsAvailable(true);
            fetchSteps();
            Alert.alert(i18n.t('healthkit.syncSuccess'), i18n.t('healthkit.syncSuccessMessage'));
          } else {
            console.error('[HealthKit] iOS Init Error:', error);
            Alert.alert(i18n.t('healthkit.permissionRequired'), i18n.t('healthkit.permissionMessage'));
          }
        });
      }, 500);
      return;
    }

    // Androidの場合の処理
    if (Platform.OS === 'android') {
      try {
        const canProceed = await checkAndroidInitialization();
        if (!canProceed) {
          Alert.alert(i18n.t('healthkit.error'), i18n.t('healthkit.initFailed'));
          return;
        }

        const permissions: Permission[] = [{ accessType: 'read', recordType: 'Steps' }];
        await requestPermission(permissions);

        const granted = await getGrantedPermissions();
        const hasPermission = granted.some(p => p.recordType === 'Steps');

        if (hasPermission) {
          setIsAvailable(true);
          await fetchSteps();
          Alert.alert(i18n.t('healthkit.syncSuccess'), i18n.t('healthkit.syncSuccessMessage'));
        } else {
          Alert.alert(i18n.t('healthkit.permissionRequired'), i18n.t('healthkit.permissionMessage'));
        }
      } catch (e) {
        console.error("[HealthKit] Request Access Error:", e);
        Alert.alert(i18n.t('healthkit.error'), i18n.t('healthkit.errorMessage'));
      } finally {
        setRequesting(false);
      }
    }
  };

  // ▼ 初回ロード時チェック
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'ios') {
        // 🌟 修正4: iOS 15以降のプレウォーミング対策
        // アプリがバックグラウンドでロードされた際にダイアログ表示が不発になるのを防ぐ
        const initializeIOS = () => {
          AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
            if (!error) {
              setIsAvailable(true);
              fetchSteps();
            } else {
              console.error('[HealthKit] iOS Init Error:', error);
            }
          });
        };

        if (AppState.currentState === 'active') {
          initializeIOS();
        } else {
          const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
              initializeIOS();
              subscription.remove();
            }
          });
        }
      } else if (Platform.OS === 'android') {
        try {
          const canProceed = await checkAndroidInitialization();
          if (canProceed) {
            const granted = await getGrantedPermissions();
            const hasPermission = granted.some(p => p.recordType === 'Steps');
            if (hasPermission) {
              setIsAvailable(true);
              fetchSteps();
            }
          }
        } catch (e) {
          console.log("[HealthKit] Auto-check Error(Android):", e);
        }
      }
    };
    init();
  }, [fetchSteps]); // fetchStepsを依存配列に追加して警告を防止

  // ▼ アプリ復帰時の更新
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAvailable) {
        console.log('[HealthKit] App active. Refreshing steps...');
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