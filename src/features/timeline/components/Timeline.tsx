import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Post } from './Post';
import { useTimeline } from '../hooks/useTimeline'; // ★作成したフックをインポート

export const Timeline = () => {
  const { posts, loading } = useTimeline(); // ★リアルデータを取得

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>まだ投稿がありません。</Text>
        <Text style={styles.emptyText}>最初の1人になりませんか？</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        // Firestoreのデータ形式をPostコンポーネントに合わせて整形
        renderItem={({ item }) => (
          <Post 
            post={{
              id: item.id,
              user: item.username || "名無し",
              userAvatar: item.userIcon || null,
              text: item.text || item.comment || "", // 念のため両方チェック
              imageUrl: item.imageUrls?.[0] || null, // 1枚目の画像を表示
              likes: item.likes || 0,
              timestamp: item.createdAt,
            }} 
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
});