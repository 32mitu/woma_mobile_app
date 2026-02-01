import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

// 通知ハンドラの設定（アプリがフォアグラウンドの時も通知を表示する設定）
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
    // 明示的に登録が求められた場合のみ実行
    if (!shouldRegister) return;

    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (userId && token) {
        saveTokenToFirestore(userId, token);
        // リマインダー設定（ログイン時など）
        scheduleDailyReminder();
      }
    });

    // 通知受信リスナー
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // 通知タップリスナー
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

  // リマインダー設定（重複チェック機能付き）
  const scheduleDailyReminder = async () => {
    try {
      // 1. 現在セットされている通知をすべて確認
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // 2. すでに「reminder」タイプの通知があるか探す
      const existingReminders = scheduledNotifications.filter(
        (n) => n.content.data?.type === 'reminder'
      );

      // 設定したいリマインダーの数
      const TARGET_REMINDER_COUNT = 1;

      // 3. すでに設定済みなら「何もしない」で終了
      if (existingReminders.length === TARGET_REMINDER_COUNT) {
        return;
      }

      // 4. 数が合わない場合は、一旦reminder系をすべて削除して再登録
      // ログ出力は削除

      for (const reminder of existingReminders) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }

      // 5. 設定するスケジュールのリスト
      const schedules = [
        {
          hour: 21,
          minute: 0,
          title: "今日の記録は済みましたか？",
          body: "21時になりました。今日の活動を記録して、自分を褒めましょう！",
        },
      ];

      // 6. ループで登録
      for (const s of schedules) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: s.title,
            body: s.body,
            sound: 'default',
            data: { type: 'reminder' }, // 識別用のタグ
            channelId: 'default', // ★Androidで必須
          } as any,
          trigger: {
            hour: s.hour,
            minute: s.minute,
            repeats: true, // 毎日繰り返す
          },
        });
      }

      // ログ出力は削除

    } catch (error) {
      // ignore
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

  // registerForPushNotificationsAsync をreturnに追加
  return {
    expoPushToken,
    notification,
    scheduleDailyReminder,
    sendPushNotification,
    registerForPushNotificationsAsync
  };
};

// 独立した関数としてエクスポート（フック内からも呼べるように）
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
      // 許可されなかった場合は終了
      return;
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    // プロジェクトIDが取得できない場合の安全策
    if (!projectId) {
      // ignore
      // return; // 必要に応じてreturnするが、まずは続行させてみる
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      // ignore
    }
  } else {
    // シミュレーターの場合
    // ignore
  }
  return token;
}