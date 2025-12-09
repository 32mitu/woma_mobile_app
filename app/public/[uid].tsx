import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ActivityLog } from '../../src/features/profile/components/ActivityLog';
import { Ionicons } from '@expo/vector-icons';
import { useSocial, useFollowStatus } from '../../src/features/social/hooks/useSocial';

export default function PublicProfileScreen() {
  const { uid } = useLocalSearchParams();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const targetUserId = Array.isArray(uid) ? uid[0] : uid;
  const currentUserId = auth.currentUser?.uid;

  const { followUser, unfollowUser, loading: actionLoading } = useSocial();
  const { isFollowing, isMutual } = useFollowStatus(targetUserId);

  useEffect(() => {
    if (!targetUserId) return;
    console.log(`👤 [PublicProfile] ユーザーID: ${targetUserId} のプロフィールを表示`);
    fetchProfile();
  }, [targetUserId]);

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
      setLoadingProfile(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) return Alert.alert("エラー", "ログインが必要です");
    if (isFollowing) {
      await unfollowUser(targetUserId);
    } else {
      await followUser(targetUserId);
    }
  };

  // ★修正: デバッグログ付きの遷移処理
  const handleMessagePress = () => {
    console.log("\n🟢 [Debug] 緑のメッセージボタンが押されました");
    console.log(`   - 自分: ${currentUserId}`);
    console.log(`   - 相手: ${targetUserId}`);
    console.log(`   - 相互フォロー: ${isMutual}`);

    if (!targetUserId) {
      console.error("❌ [Error] 相手のIDが不明です。遷移を中止します。");
      return;
    }

    const path = `/dm/${targetUserId}`;
    console.log(`👉 [Router] 次のパスへ遷移を試みます: ${path}`);
    
    try {
      router.push(path);
      console.log("✅ [Router] router.push 実行完了");
    } catch (error) {
      console.error("❌ [Router Error] 遷移に失敗しました:", error);
    }
  };

  if (loadingProfile) return <ActivityIndicator style={styles.center} size="large" color="#3B82F6" />;
  if (!profileData) return <View style={styles.center}><Text>ユーザーが見つかりません</Text></View>;

  return (
    <ScrollView style={styles.container}>
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

        {currentUserId !== targetUserId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={handleFollowToggle}
              disabled={actionLoading}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {actionLoading ? '...' : (isFollowing ? 'フォロー中' : 'フォローする')}
              </Text>
            </TouchableOpacity>

            {/* DMボタン: 相互フォロー時のみ表示 */}
            {isMutual && (
              <TouchableOpacity style={styles.dmButton} onPress={handleMessagePress}>
                <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                <Text style={styles.dmButtonText}>メッセージ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View style={styles.content}>
        <ActivityLog userId={targetUserId} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: 'white', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, backgroundColor: '#eee' },
  username: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  bio: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  followButton: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 24, minWidth: 120, alignItems: 'center' },
  followingButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#3B82F6' },
  followButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  followingButtonText: { color: '#3B82F6' },
  dmButton: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dmButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  content: { padding: 16 },
});