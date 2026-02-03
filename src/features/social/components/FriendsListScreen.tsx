import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSocialList } from '../hooks/useSocial';
import { useAuth } from '../../auth/useAuth';
import { UserList } from './UserList';

type Props = {
  type: 'following' | 'followers';
};

export const FriendsListScreen = ({ type }: Props) => {
  const { userProfile } = useAuth();

  // データを自動取得
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
    backgroundColor: '#F3F4F6', // 背景色をアプリ全体で統一
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});