import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ★ 追加
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import i18n from '../i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 重複実行を防ぐメモリ上のロック変数
let isProcessing = false;

// ★ 新しい管理キー（AsyncStorageに保存するフラグの名前）
const SCHEDULE_FLAG_KEY = 'woma_daily_reminder_scheduled_v3';

export const usePushNotifications = (userId?: string, shouldRegister: boolean = false) => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!shouldRegister) return;

    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token && userId) {
        // トークンをFirestoreに保存
        const saveToken = async () => {
          try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              pushTokens: arrayUnion(token)
            });
          } catch (e) {
            console.error('Failed to save push token', e);
          }
        };
        saveToken();
      }
    });

    // 通知受信時のリスナー
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // 通知タップ時のリスナー
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId, shouldRegister]);

  // ★ 修正箇所：AsyncStorageを使った、絶対に1回しか実行されない最強のスケジュールロジック
  const scheduleDailyReminder = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      // 1. スマホのローカルストレージから「設定済みフラグ」を読み込む
      const hasScheduled = await AsyncStorage.getItem(SCHEDULE_FLAG_KEY);

      // 2. 既にフラグがあれば、処理を「完全に」終了する（APIチェックはしない）
      if (hasScheduled === 'true') {
        console.log('Daily reminder is perfectly scheduled for 21:00. Skipping setup.');
        return;
      }

      // 3. 過去のバグった通知（v1やv2など）を容赦なく全て削除する
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 4. 初回のみ、改めて21時の通知をスケジュールする
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notification.reminderTitle', { defaultValue: '今日の記録は終わりましたか？' }),
          body: i18n.t('notification.reminderBody', { defaultValue: 'WOMAを開いて、今日の運動や食事を記録しましょう！' }),
          sound: true,
          data: { url: '/(tabs)/record' },
        },
        trigger: {
          hour: 21,
          minute: 0,
          repeats: true, // 毎日繰り返す
        },
      });

      // 5. 【最重要】設定完了フラグをローカルストレージに保存する
      await AsyncStorage.setItem(SCHEDULE_FLAG_KEY, 'true');
      console.log('Successfully created a NEW daily reminder (v3) for 21:00. Flag saved.');

    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    } finally {
      isProcessing = false;
    }
  };

  // リモートプッシュ通知の送信処理
  const sendPushNotification = async (targetUserId: string, title: string, body: string, data: any = {}) => {
    if (!targetUserId) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      const tokens = userDoc.data()?.pushTokens || [];

      if (tokens.length === 0) return;

      const message = {
        to: tokens,
        sound: 'default',
        title,
        body,
        data,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Failed to send push notification', error);
    }
  };

  return {
    expoPushToken,
    notification,
    scheduleDailyReminder,
    sendPushNotification,
    registerForPushNotificationsAsync
  };
};

export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return undefined;
    }

    try {
      // 開発環境と本番環境（EAS）の両方に対応したプロジェクトIDの取得
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (e) {
      console.error('Failed to get expo push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}