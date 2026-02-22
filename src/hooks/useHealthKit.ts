import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus, Alert, Linking } from 'react-native';
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
    console.log('[HealthKit] fetchSteps called');

    // 権限がない状態で呼ぶとクラッシュすることがあるためガード
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
          console.error('[HealthKit] iOS Error:', err);
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

        console.log(`[HealthKit] Android: Fetching range ${today.toISOString()} - ${tomorrow.toISOString()}`);

        // ★修正: 権限確認をここでも念のため行う
        const granted = await getGrantedPermissions();
        console.log('[HealthKit] Android: Current Granted Permissions:', JSON.stringify(granted));

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
        console.log(`[HealthKit] Android: Total Steps Fetched: ${totalSteps} (Records: ${result.records.length})`);

        setDailySteps(totalSteps);
      } catch (err) {
        console.error('[HealthKit] Android Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [isAvailable]);

  // ▼ 安全な初期化チェック関数
  const checkAndroidInitialization = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
      const status = await getSdkStatus();
      console.log('[HealthKit] Android SDK Status:', status);

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
      console.log('[HealthKit] Android Initialized:', isInitialized);
      return isInitialized;
    } catch (e) {
      console.error("[HealthKit] Android Initialization Check Error:", e);
      return false;
    }
  };

  // ▼ 権限をリクエストする関数（ボタン押下時に実行）
  const requestAccess = async () => {
    console.log('[HealthKit] requestAccess called');
    if (Platform.OS !== 'android') return;
    if (requesting) {
      console.log('[HealthKit] Already requesting. Ignored.');
      return;
    }

    setRequesting(true);
    try {
      // 1. 初期化チェック
      const canProceed = await checkAndroidInitialization();
      if (!canProceed) {
        console.log('[HealthKit] Initialization failed. Aborting request.');
        Alert.alert(i18n.t('healthkit.error'), i18n.t('healthkit.initFailed'));
        return;
      }

      // 2. 権限リクエスト
      const permissions: Permission[] = [{ accessType: 'read', recordType: 'Steps' }];
      console.log('[HealthKit] Requesting permissions:', JSON.stringify(permissions));

      // requestPermissionは権限ダイアログの結果を返さないため、awaitで待つのみ
      await requestPermission(permissions);
      console.log('[HealthKit] Permission dialog closed');

      // 3. 結果確認
      const granted = await getGrantedPermissions();
      console.log('[HealthKit] Granted Permissions after request:', JSON.stringify(granted));

      const hasPermission = granted.some(p => p.recordType === 'Steps');

      if (hasPermission) {
        console.log('[HealthKit] Permission granted! Fetching steps...');
        setIsAvailable(true);
        // 権限取得直後にデータを取得
        await fetchSteps();
        Alert.alert(i18n.t('healthkit.syncSuccess'), i18n.t('healthkit.syncSuccessMessage'));
      } else {
        console.log('[HealthKit] Permission denied or cancelled.');
        Alert.alert(i18n.t('healthkit.permissionRequired'), i18n.t('healthkit.permissionMessage'));
      }
    } catch (e) {
      console.error("[HealthKit] Request Access Error:", e);
      Alert.alert(i18n.t('healthkit.error'), i18n.t('healthkit.errorMessage'));
    } finally {
      setRequesting(false);
    }
  };

  // ▼ 初回ロード時チェック
  useEffect(() => {
    const init = async () => {
      console.log('[HealthKit] Mount: Initial check started');
      if (Platform.OS === 'ios') {
        AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
          if (!error) {
            setIsAvailable(true);
            fetchSteps();
          } else {
            console.error('[HealthKit] iOS Init Error:', error);
          }
        });
      } else if (Platform.OS === 'android') {
        // Androidは起動時に勝手に権限リクエストを出さないのがマナー
        try {
          const canProceed = await checkAndroidInitialization();
          if (canProceed) {
            const granted = await getGrantedPermissions();
            console.log('[HealthKit] Auto-check Granted:', JSON.stringify(granted));
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
  }, []);

  // アプリ復帰時の更新
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