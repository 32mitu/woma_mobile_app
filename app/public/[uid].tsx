import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, addDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ActivityLog } from '../../src/features/profile/components/ActivityLog';
import { Ionicons } from '@expo/vector-icons';

export default function PublicProfileScreen() {
  const { uid } = useLocalSearchParams(); // URLパラメータから対象ユーザーIDを取得
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const targetUserId = Array.isArray(uid) ? uid[0] : uid;
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!targetUserId) return;
    fetchProfile();
    checkFollowStatus();
  }, [targetUserId]);

  // プロフィール取得
  const fetchProfile = async () => {
    try {
      const docRef = doc(db, 'users', targetUserId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfileData(snap.data());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // フォロー状態確認
  const checkFollowStatus = async () => {
    if (!currentUserId || !targetUserId) return;
    const q = query(
      collection(db, 'relationships'),
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );
    const snap = await getDocs(q);
    setIsFollowing(!snap.empty);
  };

  // フォロー/解除処理
  const handleFollowToggle = async () => {
    if (!currentUserId) return Alert.alert("エラー", "ログインが必要です");
    setFollowLoading(true);

    try {
      if (isFollowing) {
        // フォロー解除: クエリでドキュメントを探して削除
        const q = query(
          collection(db, 'relationships'),
          where('followerId', '==', currentUserId),
          where('followingId', '==', targetUserId)
        );
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(d.ref);
        });
        setIsFollowing(false);
      } else {
        // フォロー登録
        await addDoc(collection(db, 'relationships'), {
          followerId: currentUserId,
          followingId: targetUserId,
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
        // TODO: 通知を送る処理など
      }
    } catch (e) {
      Alert.alert("エラー", "操作に失敗しました");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#3B82F6" />;
  if (!profileData) return <View style={styles.center}><Text>ユーザーが見つかりません</Text></View>;

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー部分 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Image 
          source={{ uri: profileData.profileImageUrl || 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
        />
        <Text style={styles.username}>{profileData.username}</Text>
        <Text style={styles.bio}>{profileData.bio || '自己紹介がありません'}</Text>

        {/* フォローボタン (自分以外の場合のみ表示) */}
        {currentUserId !== targetUserId && (
          <TouchableOpacity 
            style={[
              styles.followButton, 
              isFollowing && styles.followingButton
            ]} 
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {followLoading ? '処理中...' : (isFollowing ? 'フォロー中' : 'フォローする')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* 活動ログ (Web版 PublicPage.jsx で一時無効化されていた ActivityLog を復活) */}
        <ActivityLog userId={targetUserId} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: 'white', padding: 20, alignItems: 'center', 
    borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, backgroundColor: '#eee' },
  username: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  bio: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  followButton: {
    backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 32, borderRadius: 24,
    minWidth: 140, alignItems: 'center'
  },
  followingButton: {
    backgroundColor: 'white', borderWidth: 1, borderColor: '#3B82F6'
  },
  followButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  followingButtonText: { color: '#3B82F6' },
  content: { padding: 16 },
});