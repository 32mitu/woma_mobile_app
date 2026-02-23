import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
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

// 🌟 今回の要：リマインダー通知に「唯一無二の固定ID」を付与します
const REMINDER_NOTIFICATION_ID = 'woma-daily-reminder-2100';

export const usePushNotifications = (userId?: string, shouldRegister: boolean = false) => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    if (!shouldRegister) return;

    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (userId && token) {
        saveTokenToFirestore(userId, token);
      }

      // デイリーリマインダーの自動修復・設定プロセスを開始
      scheduleDailyReminder();
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'dm' && data?.partnerId) {
        router.push(`/dm/${data.partnerId}`);
      } else if (data?.type === 'like' || data?.type === 'comment') {
        router.push('/(tabs)/home');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId, shouldRegister]);

  const saveTokenToFirestore = async (uid: string, token: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
    } catch (error) {
      // ignore
    }
  };

  const scheduleDailyReminder = async () => {
    // 複数コンポーネントからの同時呼び出しをブロック
    if (isProcessing) return;
    isProcessing = true;

    try {
      // 1. 通知の権限があるか確認（権限がなければスケジュールできないので安全に終了）
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // 2. 現在OSにスケジュールされているすべての通知を取得
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // 3. すでに私たちが定義した「固定ID」のリマインダーが存在するか確認
      const hasCorrectReminder = scheduledNotifications.some(
        (notif) => notif.identifier === REMINDER_NOTIFICATION_ID
      );

      // 4. 過去のバグで「固定IDではないがリマインダーとして登録されてしまった」ゴミ通知を探す
      const obsoleteReminders = scheduledNotifications.filter(
        (notif) => notif.content.data?.type === 'reminder' && notif.identifier !== REMINDER_NOTIFICATION_ID
      );

      // 5. ゴミ通知があれば、それを個別に削除（自動お掃除機能）
      // ※ 他の正常な通知（DMなど）は一切消えません
      if (obsoleteReminders.length > 0) {
        for (const notif of obsoleteReminders) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
        console.log(`Cleaned up ${obsoleteReminders.length} obsolete reminder(s).`);
      }

      // 6. 正しい固定IDのリマインダーがすでに登録されていれば、何もしない（完璧な状態）
      if (hasCorrectReminder) {
        return;
      }

      // 7. まだ登録されていない場合、固定IDを指定して新規登録（永久ループ）
      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_NOTIFICATION_ID, // ← ★ここで固定IDをOSに登録
        content: {
          title: i18n.t('pushNotification.reminderTitle'),
          body: i18n.t('pushNotification.reminderBody'),
          sound: 'default',
          data: { type: 'reminder' },
        },
        trigger: {
          hour: 21,
          minute: 0,
          repeats: true, // 毎日繰り返す
        },
      });

      console.log("Daily reminder perfectly scheduled for 21:00 with fixed ID.");

    } catch (error) {
      console.log("Error scheduling reminder:", error);
    } finally {
      // 処理完了後にロック解除。次回以降は hasCorrectReminder が true になるので安全。
      isProcessing = false;
    }
  };

  const sendPushNotification = async (targetUserId: string, title: string, body: string, data: any = {}) => {
    try {
      const userDoc = await getDoc(doc(db, "users", targetUserId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const tokens = userData.fcmTokens || [];

      if (tokens.length === 0) return;

      const notifications = tokens.map((token: string) => ({
        to: token,
        title: title,
        body: body,
        data: data,
        sound: 'default',
      }));

      for (const message of notifications) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
      }
    } catch (error) {
      // ignore
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
      return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      // ignore
    }
  }
  return token;
}