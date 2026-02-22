import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserCard } from './UserCard'; // Named Importに変更

type Props = {
  users: any[];
};

export const UserList = ({ users }: Props) => {
  const { t } = useTranslation();
  if (!users || users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('social.noUsers')}</Text>
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
    color: '#9CA3AF', // 共通カラーに合わせる
    fontSize: 14,
  },
});