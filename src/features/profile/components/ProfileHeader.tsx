import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
// ★追加: 人数を取得するフックをインポート
import { useSocialCounts } from '../../social/hooks/useSocial';

type Props = {
  userProfile: any;
  onLogout: () => void;
};

export const ProfileHeader = ({ userProfile, onLogout }: Props) => {
  const router = useRouter();

  // ★追加: リアルタイムで人数を取得
  const { following, followers } = useSocialCounts(userProfile?.uid);

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      {/* 1. アイコンと名前 */}
      <View style={styles.topSection}>
        <Image
          source={{ uri: userProfile.photoURL || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {userProfile.displayName || userProfile.username || '名無しさん'}
        </Text>
        
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <FontAwesome5 name="sign-out-alt" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* 2. 自己紹介 */}
      <Text style={styles.bio}>
        {userProfile.bio || '自己紹介文はまだありません。'}
      </Text>

      {/* 3. フォロー・フォロワー数 */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => router.push({ pathname: '/friends', params: { type: 'following' } })}
        >
          {/* ★修正: 取得した following の数を表示 */}
          <Text style={styles.statNumber}>{following}</Text>
          <Text style={styles.statLabel}>フォロー中</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => router.push({ pathname: '/friends', params: { type: 'followers' } })}
        >
          {/* ★修正: 取得した followers の数を表示 */}
          <Text style={styles.statNumber}>{followers}</Text>
          <Text style={styles.statLabel}>フォロワー</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eee',
    marginRight: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  bio: {
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
  },
});