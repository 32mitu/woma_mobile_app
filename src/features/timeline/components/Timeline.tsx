import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from './Post';
import { useTimeline } from '../hooks/useTimeline';

type Props = {
  groupId?: string;
};

export const Timeline = ({ groupId }: Props) => {
  // フックから必要な関数と状態を受け取る
  const { posts, loading, refreshing, refresh, loadMore, hasMore } = useTimeline(groupId);

  // 初回ロード中のみインジケータを表示
  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // 投稿がない場合
  if (!loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {groupId ? "まだグループの投稿がありません。" : "まだ投稿がありません。"}
        </Text>
        <Text style={styles.emptyText}>最初の1人になりませんか？</Text>
        {/* 空の状態でも引っ張って更新できるようにする */}
        <Text onPress={refresh} style={styles.retryText}>タップして更新</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        // ネスト問題の回避: groupIdがある場合は親でスクロール制御されている可能性があるため調整が必要だが、
        // 基本的にはFlashList自身にスクロールさせる方がパフォーマンスが良い
        scrollEnabled={true}

        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={400}

        // ★ 引っ張って更新
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }

        // ★ 無限スクロール (リストの端に来たら追加読み込み)
        onEndReached={loadMore}
        onEndReachedThreshold={0.5} // 端の半分くらいまで来たら読み込み開始

        // 追加読み込み中のインジケータ
        ListFooterComponent={() =>
          hasMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#9ca3af" />
            </View>
          ) : (
            <View style={styles.footerLoader}>
              <Text style={styles.footerText}>これ以上投稿はありません</Text>
            </View>
          )
        }

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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