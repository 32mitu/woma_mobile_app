import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from './Post';
import { useTimeline } from '../hooks/useTimeline';

type Props = {
  groupId?: string;
  // ★追加: ヘッダー用コンポーネントを受け取る
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
};

export const Timeline = ({ groupId, ListHeaderComponent }: Props) => {
  const { posts, loading, refreshing, refresh, loadMore, hasMore } = useTimeline(groupId);

  // ★修正: ローディング中でもヘッダー（グループ詳細）だけは表示したい場合があるため、
  // 全体を条件分岐で隠さず、FlashListのListEmptyComponent等を活用するのが理想ですが、
  // ここでは簡易的に「ロード中で投稿ゼロ」のときだけローディング表示とします。
  // ただし、ListHeaderComponentがある場合はそれを優先表示する設計に変更します。

  const renderFooter = () => {
    if (hasMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#9ca3af" />
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
    if (loading) return <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />;
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {groupId ? "まだグループの投稿がありません。" : "まだ投稿がありません。"}
        </Text>
        <Text style={styles.emptyText}>最初の1人になりませんか？</Text>
        <Text onPress={refresh} style={styles.retryText}>タップして更新</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        scrollEnabled={true} // 常にスクロール許可
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={400}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}

        // ★追加: ここでヘッダーを描画
        ListHeaderComponent={ListHeaderComponent}

        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}

        renderItem={({ item }) => {
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
    backgroundColor: '#f8fafc',
  },
  center: {
    padding: 20,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 8,
  },
  retryText: {
    marginTop: 20,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#d1d5db',
    fontSize: 12,
  },
});