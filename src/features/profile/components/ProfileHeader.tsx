import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons'; // Ioniconsを追加
import { useSocialCounts } from '../../social/hooks/useSocial';

type Props = {
  userProfile: any;
  onLogout: () => void;
};

export const ProfileHeader = ({ userProfile, onLogout }: Props) => {
  const router = useRouter();
  const { following, followers } = useSocialCounts(userProfile?.uid);

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={{ uri: userProfile.profileImageUrl || userProfile.photoURL || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {userProfile.username || userProfile.displayName || '名無しさん'}
          </Text>
          {/* ★追加: 編集ボタン */}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editButtonText}>プロフィール編集</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <FontAwesome5 name="sign-out-alt" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.bio}>
        {userProfile.bio || '自己紹介文はまだありません。'}
      </Text>

      {/* 以下、既存の統計表示コード... */}
      <View style={styles.statsContainer}>
        {/* ... (省略) ... */}
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => router.push({ pathname: '/friends', params: { type: 'following' } })}
        >
          <Text style={styles.statNumber}>{following}</Text>
          <Text style={styles.statLabel}>フォロー中</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => router.push({ pathname: '/friends', params: { type: 'followers' } })}
        >
          <Text style={styles.statNumber}>{followers}</Text>
          <Text style={styles.statLabel}>フォロワー</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white', padding: 20, borderRadius: 16,
    marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  topSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eee', marginRight: 16 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  
  // ★追加: 編集ボタンのスタイル
  editButton: {
    backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, alignSelf: 'flex-start'
  },
  editButtonText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },

  logoutButton: { padding: 8, alignSelf: 'flex-start' },
  bio: { color: '#666', marginBottom: 20, lineHeight: 20, marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
});