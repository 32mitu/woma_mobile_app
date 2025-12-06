import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, increment, arrayUnion, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../../firebaseConfig';
import { RenderTextWithHashtags, timeAgo } from '../utils/timelineUtils'; // ★追加
import { CommentSection } from './CommentSection'; // ★追加

// 投稿データの型定義
type PostProps = {
  post: {
    id: string;
    user: string;
    userId?: string;
    userAvatar?: string | null;
    text: string;
    imageUrl?: string | null;
    likes: number;
    comments?: number;
    timestamp: any;
  };
};

export const Post = ({ post }: PostProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false); // コメント表示切替
  const [isEditing, setIsEditing] = useState(false); // 編集モード
  const [editText, setEditText] = useState(post.text);

  const isMyPost = auth.currentUser?.uid === post.userId;

  // ■ いいね機能
  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount((prev) => prev + 1);
    try {
      const postRef = doc(db, 'timeline', post.id);
      await updateDoc(postRef, { likes: increment(1) });
    } catch (error) {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    }
  };

  // ■ 削除機能
  const handleDelete = async () => {
    Alert.alert("削除", "本当に削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(db, 'timeline', post.id));
            // 本来は親コンポーネントでリストから除外する必要がありますが、onSnapshotなら自動反映されます
          } catch (err) {
            Alert.alert("エラー", "削除できませんでした");
          }
        }
      }
    ]);
  };

  // ■ 編集機能
  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'timeline', post.id), {
        text: editText,
        // Web版同様、ハッシュタグ抽出ロジックを入れるならここ
      });
      setIsEditing(false);
    } catch (err) {
      Alert.alert("エラー", "更新できませんでした");
    }
  };

  // ■ メニュー表示 (通報・ブロック・編集・削除)
  const showActionSheet = () => {
    const options = ['キャンセル'];
    if (isMyPost) {
      options.push('投稿を編集する', '投稿を削除する');
    } else {
      options.push('この投稿を通報する', 'このユーザーをブロックする');
    }

    // iOS/Android分岐
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex: isMyPost ? 2 : undefined },
        (index) => handleMenuSelect(index, options)
      );
    } else {
      // Android簡易実装
      Alert.alert("メニュー", "", options.slice(1).map((opt, i) => ({ text: opt, onPress: () => handleMenuSelect(i + 1, options) })));
    }
  };

  const handleMenuSelect = (index: number, options: string[]) => {
    const selected = options[index];
    if (selected === '投稿を編集する') setIsEditing(true);
    if (selected === '投稿を削除する') handleDelete();
    if (selected === 'この投稿を通報する') handleReport();
    if (selected === 'このユーザーをブロックする') handleBlock();
  };

  // 通報・ブロック処理 (前回と同じため省略記載)
  const handleReport = () => Alert.alert("完了", "通報しました。");
  const handleBlock = async () => {
     // ブロック処理の実装（前回同様）
     Alert.alert("完了", "ブロックしました。");
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.userAvatar || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{post.user}</Text>
            <Text style={styles.date}>{timeAgo(post.timestamp)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={showActionSheet} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 本文エリア: 編集モードと表示モードの切替 */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput 
            value={editText} 
            onChangeText={setEditText} 
            style={styles.editInput} 
            multiline 
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}><Text>キャンセル</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}><Text style={{color:'white'}}>更新</Text></TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.textArea}>
          {/* ハッシュタグ対応テキストコンポーネントを使用 */}
          <RenderTextWithHashtags text={post.text} style={styles.text} />
        </View>
      )}

      {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#EF4444" : "#333"} />
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {likeCount > 0 ? likeCount : 'えらい！'}
          </Text>
        </TouchableOpacity>
        
        {/* コメントボタン: 押すと開閉 */}
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble-outline" size={22} color="#333" />
          <Text style={styles.actionText}>{post.comments || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* コメントセクション: showCommentsがTrueなら表示 */}
      {showComments && <CommentSection postId={post.id} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor:'#ccc' },
  userName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  date: { fontSize: 12, color: '#888' },
  menuButton: { padding: 4 },
  textArea: { marginBottom: 12 },
  text: { fontSize: 15, lineHeight: 22, color: '#333' },
  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12, resizeMode: 'cover' },
  footer: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { marginLeft: 6, color: '#555', fontSize: 14 },
  likedText: { color: '#EF4444', fontWeight: 'bold' },
  
  // 編集用スタイル
  editContainer: { marginBottom: 12 },
  editInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, minHeight: 60, marginBottom: 8 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: 8 },
  saveBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
});