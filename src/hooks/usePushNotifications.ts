import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ★重要修正: 「処理中」かどうかを判定するメモリ上のロック変数
// ファイルの外に置くことで、アプリ全体で共有されます。
let isProcessing = false;

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

      // デイリーリマインダーの設定試行
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
    // ★ロック処理1: メモリ上での即時チェック
    // すでに誰かが処理を開始していたら、問答無用で帰らせる
    if (isProcessing) {
      return;
    }

    // 処理中フラグを立てて、他の呼び出しをブロックする
    isProcessing = true;

    try {
      const today = new Date().toDateString(); // "Mon Feb 16 2026"
      const STORAGE_KEY = 'WOMA_LAST_REMINDER_SET_DATE';

      // ★ロック処理2: ディスク上での永続チェック
      const lastSetDate = await AsyncStorage.getItem(STORAGE_KEY);

      // 今日すでに完了していれば終了
      if (lastSetDate === today) {
        // console.log("Already scheduled for today (AsyncStorage check).");
        return;
      }

      // --- 設定処理 ---
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('pushNotification.reminderTitle'),
          body: i18n.t('pushNotification.reminderBody'),
          sound: 'default',
          data: { type: 'reminder' },
        },
        trigger: {
          hour: 21,
          minute: 0,
          repeats: true,
        },
      });

      // 設定完了を保存
      await AsyncStorage.setItem(STORAGE_KEY, today);

      console.log("Daily reminder scheduled successfully. (Saved to Storage)");

    } catch (error) {
      console.log("Error scheduling reminder:", error);
      // エラーが出た場合はロックを解除して再試行できるようにしても良いが、
      // 無限ループ防止のため、基本的には解除しなくてOK（次回起動時に再トライ）
    } finally {
      // ※ここではあえて isProcessing = false に戻しません。
      // なぜなら、「1回成功したら、アプリを落とすまで二度と呼ばなくていい」からです。
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