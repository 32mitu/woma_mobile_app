import { useState, useCallback, useEffect } from 'react';
import { 
  collection, addDoc, orderBy, query, onSnapshot, 
  doc, setDoc, serverTimestamp, increment 
} from 'firebase/firestore'; // ★ increment を追加
import { db } from '../../../../firebaseConfig';
import { IMessage } from 'react-native-gifted-chat';

export const useChat = (currentUserId?: string, partnerUserId?: string) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);

  // 1. ルームIDの作成
  useEffect(() => {
    if (!currentUserId || !partnerUserId) return;
    const ids = [currentUserId, partnerUserId].sort();
    setRoomId(`${ids[0]}_${ids[1]}`);
  }, [currentUserId, partnerUserId]);

  // 2. メッセージの受信
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        
        return {
          _id: doc.id,
          text: data.text || '',
          createdAt: date,
          user: data.user || { _id: 'unknown', name: 'Unknown' },
        } as IMessage;
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 3. メッセージの送信（相手の未読数を+1する）
  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!roomId || !currentUserId || !partnerUserId) return;

    const { _id, text, user } = newMessages[0];

    try {
      // (1) メッセージ保存
      await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
        _id,
        text,
        createdAt: serverTimestamp(),
        user,
        senderId: currentUserId
      });

      // (2) ルーム情報更新 ＋ ★相手の未読カウントを増やす
      const roomRef = doc(db, 'chatRooms', roomId);
      await setDoc(roomRef, {
        members: [currentUserId, partnerUserId].sort(),
        lastMessage: text,
        updatedAt: serverTimestamp(),
        // 相手 (partnerUserId) の未読数を +1
        [`unreadCounts.${partnerUserId}`]: increment(1)
      }, { merge: true });

    } catch (error) {
      console.error("送信エラー:", error);
    }
  }, [roomId, currentUserId, partnerUserId]);

  // ★ 4. 既読にする処理（自分の未読数を0にする）
  const markAsRead = useCallback(async () => {
    if (!roomId || !currentUserId) return;
    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      await setDoc(roomRef, {
        [`unreadCounts.${currentUserId}`]: 0
      }, { merge: true });
    } catch (error) {
      console.error("既読処理エラー:", error);
    }
  }, [roomId, currentUserId]);

  return { messages, onSend, roomId, markAsRead };
};