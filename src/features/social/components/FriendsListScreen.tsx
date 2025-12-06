import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
// ★修正: 新しいフック (useSocialList) を使う
import { useSocialList } from '../hooks/useSocial';
import { useAuth } from '../../auth/useAuth';
// ★修正: 先ほど直した UserList (Named Export) を使う
import { UserList } from './UserList';

type Props = {
  type: 'following' | 'followers'; // 「フォロー中」か「フォロワー」かを受け取る
};

export const FriendsListScreen = ({ type }: Props) => {
  const { userProfile } = useAuth();
  
  // ★重要: ここで自動的にデータを取得します (fetchFollowingなどは呼び出し不要)
  const { users, loading } = useSocialList(userProfile?.uid, type);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <UserList users={users} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});