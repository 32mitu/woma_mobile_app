import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
// ★修正: { } を外して Default Import に変更
import UserCard from './UserCard';

type Props = {
  users: any[];
};

export const UserList = ({ users }: Props) => {
  if (!users || users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>ユーザーが見つかりません</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.uid || item.id}
      renderItem={({ item }) => <UserCard user={item} />}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
});