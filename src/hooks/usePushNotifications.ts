import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
        // リマインダー設定（重複チェック付き）
        scheduleDailyReminder(); 
      }
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

  // ★修正箇所: 重複チェックを追加して安定化
  const scheduleDailyReminder = async () => {
    try {
      // 1. 現在セットされている通知をすべて確認
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // 2. すでに「reminder」タイプの通知があるか探す
      const hasReminder = scheduledNotifications.find(
        (n) => n.content.data?.type === 'reminder'
      );

      // 3. すでにセットされていたら「何もしない」で終了（これが重要！）
      if (hasReminder) {
        console.log("📅 [Notification] リマインダーは既にセットされています");
        return;
      }

      // 4. まだセットされていなければセットする
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "今日の記録は済みましたか？",
          body: "21時になりました。今日の活動を記録して、自分を褒めましょう！",
          sound: 'default',
          data: { type: 'reminder' }, // 識別用のタグ
        },
        trigger: {
          hour: 21,
          minute: 0,
          repeats: true, // 毎日繰り返す
        },
      });
      console.log("📅 [Notification] 新しく21:00のリマインダーをセットしました");

    } catch (error) {
      console.error("Failed to schedule reminder:", error);
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
      console.error("Failed to send notification:", error);
    }
  };

  return { expoPushToken, notification, scheduleDailyReminder, sendPushNotification };
};

async function registerForPushNotificationsAsync() {
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
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  }
  return token;
}