import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from './Post';
import { useTimeline } from '../hooks/useTimeline';

type Props = {
  groupId?: string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
};

export const Timeline = ({ groupId, ListHeaderComponent }: Props) => {
  const { posts, loading, refreshing, refresh, loadMore, hasMore } = useTimeline(groupId);

  const renderFooter = () => {
    if (hasMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#9CA3AF" />
        </View>
      );
    }
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.footerText}>これ以上投稿はありません</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null; // 初回ロード中はEmpty表示しない
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>投稿がまだありません</Text>
      </View>
    );
  };

  // 初回ロード中で、かつデータがない場合でもヘッダーは表示したい
  // FlashListはdataが空でもListHeaderComponentを表示してくれる

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        estimatedItemSize={400} // パフォーマンス最適化
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}

        // ヘッダー（グループ詳細など）
        ListHeaderComponent={ListHeaderComponent}

        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}

        renderItem={({ item }) => {
          // データ構造の揺らぎを吸収
          const targetUserId = item.userId || item.uid || item.authorId || item.senderId || item.user?._id;

          return (
            <Post
              post={{
                id: item.id,
                userId: targetUserId,
                text: item.text || item.comment || "",
                imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
                likes: item.likes || 0,
                comments: item.comments || 0,
                timestamp: item.createdAt,
                activities: item.activities || [],
                // ユーザー情報が含まれている場合
                user: item.user ? {
                  displayName: item.user.username || item.user.displayName,
                  photoURL: item.user.profileImageUrl || item.user.photoURL
                } : undefined
              }}
            />
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // アプリ全体の背景色と統一
  },
  center: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});