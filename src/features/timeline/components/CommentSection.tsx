import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, doc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig'; // パスは環境に合わせて調整
import { timeAgo } from '../utils/timelineUtils';
import { Ionicons } from '@expo/vector-icons';

type CommentSectionProps = {
  postId: string;
};

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // コメント監視
  useEffect(() => {
    const q = query(
      collection(db, "timeline", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [postId]);

  // コメント送信処理
  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!auth.currentUser) return Alert.alert("エラー", "ログインが必要です");

    setSubmitting(true);
    try {
      // ユーザー情報を取得 (本来はContextやReduxから取るのが理想)
      const user = auth.currentUser;
      const userDoc = await import('firebase/firestore').then(mod => mod.getDoc(doc(db, 'users', user.uid)));
      const userData = userDoc.data();

      // コメント追加
      await addDoc(collection(db, "timeline", postId, "comments"), {
        text: inputText.trim(),
        userId: user.uid,
        username: userData?.username || "匿名",
        userAvatar: userData?.profileImageUrl || null,
        createdAt: serverTimestamp(),
        likes: 0,
      });

      // 投稿本体のコメント数をインクリメント
      await updateDoc(doc(db, "timeline", postId), {
        comments: increment(1)
      });

      setInputText("");
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "コメントの送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" />;

  return (
    <View style={styles.container}>
      {/* コメントリスト */}
      {comments.map((item) => (
        <View key={item.id} style={styles.commentItem}>
          <Text style={styles.commentHeader}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.date}> • {timeAgo(item.createdAt)}</Text>
          </Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      ))}

      {/* 入力フォーム */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="コメントを入力..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity onPress={handleSend} disabled={submitting || !inputText.trim()}>
          <Ionicons name="send" size={20} color={inputText.trim() ? "#3B82F6" : "#ccc"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  commentItem: { marginBottom: 12, paddingHorizontal: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  username: { fontWeight: 'bold', fontSize: 13, color: '#333' },
  date: { fontSize: 11, color: '#888' },
  commentText: { fontSize: 14, color: '#444', lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
});