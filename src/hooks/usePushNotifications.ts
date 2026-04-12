import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import i18n from '../i18n';

// 通知の表示設定（アプリがフォアグラウンドの場合も表示する）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// セッション内での並行呼び出しを防ぐメモリロック
let isProcessing = false;

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
        const saveToken = async () => {
          try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
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

    // 通知タップ時のリスナー（画面遷移）
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId, shouldRegister]);

  // 毎日21時のリマインダーをスケジュール
  // 「必ず cancelAll → schedule 1件」で重複を完全に防ぐ
  const scheduleDailyReminder = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      // 既存のスケジュール済み通知を全て削除してから1件だけ登録する
      // → 何度呼ばれても常に通知は1件だけになる
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notification.reminderTitle', { defaultValue: '今日の記録は終わりましたか？' }),
          body: i18n.t('notification.reminderBody', { defaultValue: 'WOMAを開いて、今日の運動や食事を記録しましょう！' }),
          sound: true,
          data: { url: '/(tabs)/record' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
      console.log('[PushNotifications] Daily reminder scheduled for 21:00');
    } catch (error) {
      console.error('[PushNotifications] Failed to schedule reminder:', error);
    } finally {
      isProcessing = false;
    }
  };

  const sendPushNotification = async (targetUserId: string, title: string, body: string, data: any = {}) => {
    if (!targetUserId) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      const userData = userDoc.data();

      // 通知OFF設定なら送らない（Cloud Functionと同じロジック）
      if (userData?.settings?.notificationEnabled === false) return;

      const tokens: string[] = userData?.fcmTokens || [];

      if (!Array.isArray(tokens) || tokens.length === 0) return;

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
      console.error('[PushNotifications] Failed to send push notification', error);
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
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (e) {
      console.error('[PushNotifications] Failed to get expo push token:', e);
    }
  } else {
    console.log('[PushNotifications] Must use physical device for Push Notifications');
  }

  return token;
}
