import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';
import { timeAgo } from '../utils/timelineUtils';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Input } from '../../../ui/Input';
import { IconButton } from '../../../ui/IconButton';
import { Avatar } from '../../../ui/Avatar'; // コメントユーザーの画像用（あれば）

type CommentSectionProps = {
  postId: string;
  postAuthorId?: string;
  onCommentAdded?: () => void;
};

export const CommentSection = ({ postId, postAuthorId, onCommentAdded }: CommentSectionProps) => {
  const { t } = useTranslation();
  const { sendPushNotification } = usePushNotifications();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "timeline", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('[CommentSection] コメント取得エラー:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [postId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setSubmitting(true);
    const user = auth.currentUser;

    try {
      // 1. コメントをサブコレクションに追加
      await addDoc(collection(db, "timeline", postId, "comments"), {
        userId: user?.uid,
        username: user?.displayName || t('timeline.noName'),
        userPhoto: user?.photoURL || null, // アイコン表示用に保存
        text: inputText.trim(),
        createdAt: serverTimestamp(),
      });

      // 2. 投稿本体のコメント数をインクリメント
      const postRef = doc(db, "timeline", postId);
      await updateDoc(postRef, {
        comments: increment(1)
      });

      // 3. 通知送信 (自分以外の投稿へのコメント時)
      if (postAuthorId && postAuthorId !== user?.uid) {
        const authorDoc = await getDoc(doc(db, "users", postAuthorId));
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          if (authorData.pushToken) {
            await sendPushNotification(
              authorData.pushToken,
              t('notification.commentTitle'),
              t('notification.commentBody', { user: user?.displayName || t('notification.someone'), text: inputText.trim() })
            );
          }
        }
      }

      setInputText("");
      onCommentAdded?.();
    } catch (error) {
      console.error("Error adding comment: ", error);
      Alert.alert(t('common.error'), t('comment.errorSend'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 10 }} />
      ) : (
        comments.map((item) => (
          <View key={item.id} style={styles.commentItem}>
            {/* 共通Avatarを使用 */}
            <Avatar uri={item.userPhoto} size="sm" style={styles.avatar} />
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.date}> • {item.createdAt ? timeAgo(item.createdAt) : t('comment.now')}</Text>
              </View>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        ))
      )}

      {/* 共通Inputコンポーネントを使用 */}
      <View style={styles.inputWrapper}>
        <Input
          placeholder={t('comment.placeholder')}
          value={inputText}
          onChangeText={setInputText}
          multiline
          containerStyle={{ marginBottom: 0 }} // Inputのデフォルトマージンを打ち消し
          // 送信ボタンをInputの中に配置
          rightElement={
            <IconButton
              name="send"
              size={20}
              color={inputText.trim() ? "#3B82F6" : "#ccc"}
              onPress={handleSend}
              disabled={submitting || !inputText.trim()}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  inputWrapper: {
    marginTop: 8,
  },
});