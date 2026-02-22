import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '../../src/features/groups/hooks/useGroups';
import { GroupCard } from '../../src/features/groups/components/GroupCard';

// 共通コンポーネント
import { IconButton } from '../../src/ui/IconButton';
import { useTranslation } from 'react-i18next';

export default function GroupsListScreen() {
  const router = useRouter();
  const { groups, loading } = useGroups();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <IconButton
          name="arrow-back"
          size={24}
          color="#333"
          onPress={() => router.back()}
        />
        <Text style={styles.title}>{t('group.explorTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GroupCard group={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('group.noGroups')}</Text>
            </View>
          }
        />
      )}

      {/* 新規作成ボタン (FAB) */}
      <IconButton
        name="add"
        size={30}
        color="white"
        variant="filled" // 背景色付き
        onPress={() => router.push('/groups/create')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#999', fontSize: 14 },

  // FABスタイル (IconButtonのスタイルを上書き)
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6', // 青色指定
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
});