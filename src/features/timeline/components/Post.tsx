import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../../firebaseConfig';
import { RenderTextWithHashtags, timeAgo } from '../utils/timelineUtils';
import { CommentSection } from './CommentSection';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/useAuth';

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
    // ★追加: 運動記録の配列を受け取る
    activities?: { name: string; duration: number; mets?: number }[]; 
  };
};

export const Post = ({ post }: PostProps) => {
  const router = useRouter();
  const { userProfile } = useAuth();

  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);

  const isMe = userProfile?.uid === post.userId;

  const displayAvatar = (isMe && userProfile?.profileImageUrl) 
    ? userProfile.profileImageUrl 
    : (post.userAvatar || 'https://via.placeholder.com/40');

  const displayName = (isMe && userProfile?.username)
    ? userProfile.username
    : post.user;

  const handleGoToProfile = () => {
    if (post.userId) {
      router.push(`/public/${post.userId}`);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    try {
      const postRef = doc(db, 'timeline', post.id);
      await updateDoc(postRef, { likes: increment(1) });
    } catch (error) {
      console.error(error);
      setLiked(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("削除", "本当に削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除する", style: "destructive", onPress: async () => {
          try { await deleteDoc(doc(db, 'timeline', post.id)); } catch (e) {}
        }}
    ]);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'timeline', post.id), { text: editText });
      setIsEditing(false);
    } catch (err) { Alert.alert("エラー", "更新できませんでした"); }
  };

  const showActionSheet = () => {
    const options = ['キャンセル'];
    if (isMe) options.push('投稿を編集する', '投稿を削除する');
    else options.push('この投稿を通報する', 'このユーザーをブロックする');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex: isMe ? 2 : undefined },
        (index) => handleMenuSelect(index, options)
      );
    } else {
      Alert.alert("メニュー", "", options.slice(1).map((opt, i) => ({ text: opt, onPress: () => handleMenuSelect(i + 1, options) })));
    }
  };

  const handleMenuSelect = (index: number, options: string[]) => {
    const selected = options[index];
    if (selected === '投稿を編集する') setIsEditing(true);
    if (selected === '投稿を削除する') handleDelete();
    if (selected === 'この投稿を通報する') Alert.alert("完了", "通報しました。");
    if (selected === 'このユーザーをブロックする') Alert.alert("完了", "ブロックしました。");
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleGoToProfile}>
          <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.date}>{timeAgo(post.timestamp)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={showActionSheet} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput value={editText} onChangeText={setEditText} style={styles.editInput} multiline />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}><Text>キャンセル</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}><Text style={{color:'white'}}>更新</Text></TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.textArea}>
            <RenderTextWithHashtags text={post.text} style={styles.text} />
          </View>

          {/* ★修正: 運動記録の表示エリア */}
          {post.activities && post.activities.length > 0 && (
            <View style={styles.activitiesContainer}>
              {post.activities.map((act, index) => (
                <View key={index} style={styles.activityBadge}>
                  <Ionicons name="stopwatch-outline" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
                  <Text style={styles.activityText}>
                    {act.name} <Text style={{ fontWeight: 'bold' }}>{act.duration}分</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#EF4444" : "#333"} />
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {post.likes > 0 ? post.likes : 'えらい！'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble-outline" size={22} color="#333" />
          <Text style={styles.actionText}>{post.comments || 0}</Text>
        </TouchableOpacity>
      </View>

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
  textArea: { marginBottom: 8 }, // 下のマージンを少し減らして記録との間隔を調整
  text: { fontSize: 15, lineHeight: 22, color: '#333' },
  
  // ★追加: 運動記録用のスタイル
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF', // 薄い青
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  activityText: {
    fontSize: 13,
    color: '#3B82F6', // 青文字
  },

  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12, resizeMode: 'cover' },
  footer: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { marginLeft: 6, color: '#555', fontSize: 14 },
  likedText: { color: '#EF4444', fontWeight: 'bold' },
  editContainer: { marginBottom: 12 },
  editInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, minHeight: 60, marginBottom: 8 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: 8 },
  saveBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
});