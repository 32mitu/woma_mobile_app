import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Post } from './Post';
import { useTimeline } from '../hooks/useTimeline';

type Props = {
  groupId?: string;
};

export const Timeline = ({ groupId }: Props) => {
  const { posts, loading } = useTimeline(groupId);

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
        <Text style={styles.emptyText}>
          {groupId ? "まだグループの投稿がありません。" : "まだ投稿がありません。"}
        </Text>
        <Text style={styles.emptyText}>最初の1人になりませんか？</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        scrollEnabled={!groupId}
        renderItem={({ item }) => (
          <Post 
            post={{
              id: item.id,
              user: item.username || "名無し",
              userAvatar: item.profileImageUrl || item.userIcon || null,
              text: item.text || item.comment || "",
              imageUrl: item.imageUrls?.[0] || null,
              likes: item.likes || 0,
              comments: item.comments || 0,
              timestamp: item.createdAt,
              // ★修正: 運動記録データ (activities) を渡す
              activities: item.activities || [], 
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
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
});