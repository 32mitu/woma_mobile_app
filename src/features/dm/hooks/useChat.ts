import { useState, useCallback, useEffect } from 'react';
import {
  collection, addDoc, orderBy, query, onSnapshot,
  doc, setDoc, serverTimestamp, increment, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebaseConfig';
import { IMessage } from 'react-native-gifted-chat';
import { compressImage } from '../../../utils/imageCompressor'; // ★追加: 画像圧縮ユーティリティ
import i18n from '../../../i18n';

export const useChat = (currentUserId?: string, partnerUserId?: string) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);

  // 1. ルームID作成（ユーザーID同士をソートして結合し、一意なIDにする）
  useEffect(() => {
    if (!currentUserId || !partnerUserId) return;
    const ids = [currentUserId, partnerUserId].sort();
    setRoomId(`${ids[0]}_${ids[1]}`);
  }, [currentUserId, partnerUserId]);

  // 2. メッセージ受信 (リアルタイム監視)
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');

    // 最新の50件のみ取得（読み込み速度と通信量の最適化）
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

        return {
          _id: doc.id,
          text: data.text || '',
          createdAt: date,
          user: data.user,
          image: data.image || null,
        } as IMessage;
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 送信ロジック（内部用）
  const sendMessageRaw = async (text: string, imageUri: string | null, user: any) => {
    if (!roomId || !currentUserId || !partnerUserId) return;

    try {
      let downloadUrl = null;

      if (imageUri) {
        // ★ここが変更点: 画像圧縮処理
        const compressedUri = await compressImage(imageUri);

        const filename = `chat-images/${roomId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);

        const response = await fetch(compressedUri);
        const blob = await response.blob();

        await uploadBytes(storageRef, blob);
        downloadUrl = await getDownloadURL(storageRef);
      }

      if (!text && !downloadUrl) return;

      const msgData: any = {
        text: text,
        createdAt: serverTimestamp(),
        senderId: currentUserId,
        user: {
          _id: currentUserId,
          name: user.name || 'Unknown',
          avatar: user.avatar || null
        },
        read: false
      };

      if (downloadUrl) {
        msgData.image = downloadUrl;
      }

      // メッセージをSubCollectionに追加
      await addDoc(collection(db, 'chatRooms', roomId, 'messages'), msgData);

      // ルーム情報の更新（一覧表示用）
      let lastMsgText = text;
      if (!text && downloadUrl) lastMsgText = i18n.t('dm.imagesSent');

      const roomRef = doc(db, 'chatRooms', roomId);

      await setDoc(roomRef, {
        members: [currentUserId, partnerUserId].sort(),
        lastMessage: lastMsgText,
        updatedAt: serverTimestamp(),
        [`unreadCounts.${partnerUserId}`]: increment(1), // 相手の未読数を+1
        // メンバー情報のキャッシュ更新
        [`memberInfo.${currentUserId}`]: {
          name: user.name || 'Unknown',
          avatar: user.avatar || null
        }
      }, { merge: true });

    } catch (error) {
      console.error("送信エラー:", error);
      throw error;
    }
  };

  // テキストメッセージ送信ハンドラ
  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (newMessages.length === 0) return;
    const msg = newMessages[0];
    await sendMessageRaw(msg.text, null, msg.user);
  }, [roomId, currentUserId, partnerUserId]);

  // 画像送信ハンドラ
  const sendImage = useCallback(async (imageUri: string, user: any) => {
    await sendMessageRaw('', imageUri, user);
  }, [roomId, currentUserId, partnerUserId]);

  // 既読処理
  const markAsRead = useCallback(async () => {
    if (!roomId || !currentUserId) return;
    const roomRef = doc(db, 'chatRooms', roomId);
    // 自分の未読カウントを0にする
    await setDoc(roomRef, {
      [`unreadCounts.${currentUserId}`]: 0
    }, { merge: true });
  }, [roomId, currentUserId]);

  return { messages, onSend, sendImage, markAsRead };
};