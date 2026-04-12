import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

admin.initializeApp();
const db = admin.firestore();
const expo = new Expo();

// 共通: 通知送信関数
const sendPushNotification = async (
  targetUserId: string,
  title: string,
  body: string,
  data: any
) => {
  try {
    const userDoc = await db.collection("users").doc(targetUserId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    // 通知OFF設定なら送らない
    if (userData?.settings?.notificationEnabled === false) return;

    const tokens = userData?.fcmTokens || [];
    const messages: ExpoPushMessage[] = [];

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Invalid Expo push token: ${token}`);
        continue;
      }
      messages.push({
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Error sending chunks", error);
      }
    }
  } catch (error) {
    console.error("Error in sendPushNotification", error);
  }
};

// 1. DM受信通知
export const onNewMessage = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    // 冪等性: 再試行時の二重通知を防ぐ
    if (snap.data()?.notified === true) return;
    await snap.ref.update({ notified: true });

    const message = snap.data();
    const roomId = context.params.roomId;
    const senderId = message.senderId;

    const roomDoc = await db.collection("chatRooms").doc(roomId).get();
    if (!roomDoc.exists) return;
    const members = roomDoc.data()?.members || [];

    const recipientId = members.find((uid: string) => uid !== senderId);
    if (!recipientId) return;

    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderName = senderDoc.data()?.username || "誰か";

    await sendPushNotification(
      recipientId,
      "新着メッセージ",
      `${senderName}さんからメッセージが届きました`,
      { type: "dm", partnerId: senderId }
    );
  });

// 2. フォロー通知
// ※ リアクション通知はクライアント側（Post.tsx）で送信済みのため Cloud Function は不要
export const onNewFollow = functions.firestore
  .document("follows/{docId}")
  .onCreate(async (snap, context) => {
    // 冪等性: 再試行時の二重通知を防ぐ
    if (snap.data()?.notified === true) return;
    await snap.ref.update({ notified: true });

    const { followerId, followingId } = snap.data();
    if (!followerId || !followingId || followerId === followingId) return;

    const followerDoc = await db.collection("users").doc(followerId).get();
    const followerName = followerDoc.data()?.username || "誰か";

    await sendPushNotification(
      followingId,
      "新しいフォロワー",
      `${followerName}さんにフォローされました！`,
      { type: "follow", userId: followerId }
    );
  });

// 3. コメント受信通知
export const onNewComment = functions.firestore
  .document("timeline/{postId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    // 冪等性: 再試行時の二重通知を防ぐ
    if (snap.data()?.notified === true) return;
    await snap.ref.update({ notified: true });

    const commentData = snap.data();
    const postId = context.params.postId;

    const postDoc = await db.collection("timeline").doc(postId).get();
    if (!postDoc.exists) return;

    const postData = postDoc.data();
    const recipientId = postData?.userId;

    if (recipientId === commentData.userId) return;

    const commenterName = commentData.username || "誰か";
    const previewText = (commentData.text || "").substring(0, 50);
    await sendPushNotification(
      recipientId,
      "コメント",
      `${commenterName}さんがコメントしました: ${previewText}`,
      { type: "comment", postId: postId }
    );
  });