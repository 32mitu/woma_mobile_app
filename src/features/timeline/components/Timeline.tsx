import React, { useCallback } from 'react';
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
    // データが有る場合のみ「これ以上なし」を表示
    if (posts.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.footerText}>これ以上投稿はありません</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>投稿がまだありません</Text>
      </View>
    );
  };

  // useCallback でレンダー関数を固定
  const renderItem = useCallback(({ item }: { item: any }) => {
    // データ構造の揺らぎを吸収して整形
    // ※ useTimeline側でこの変換を行うのが理想ですが、現状はここで吸収します
    const targetUserId = item.userId || item.uid || item.authorId || item.senderId || item.user?._id;

    // Postコンポーネントに渡すオブジェクトを作成
    const postData = {
      id: item.id,
      userId: targetUserId,
      text: item.text || item.comment || "",
      imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
      likes: item.likes || 0,
      comments: item.comments || 0,
      timestamp: item.createdAt,
      activities: item.activities || [],
      user: item.user ? {
        displayName: item.user.username || item.user.displayName,
        photoURL: item.user.profileImageUrl || item.user.photoURL
      } : undefined
    };

    return <Post post={postData} />;
  }, []); // 依存配列は空でOK（itemは引数で来るため）

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={350} // 平均的な投稿の高さを指定（パフォーマンス向上に重要）
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={refresh}

        // ヘッダー・フッター・空表示
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}

        // スクロールインジケータ調整
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
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