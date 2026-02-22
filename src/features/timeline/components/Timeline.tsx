import React, { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Post } from './Post';
import { useTimeline } from '../hooks/useTimeline';

type Props = {
  groupId?: string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
};

export const Timeline = ({ groupId, ListHeaderComponent }: Props) => {
  const { posts, loading, refreshing, refresh, loadMore, hasMore } = useTimeline(groupId);
  const { t } = useTranslation();

  const renderFooter = () => {
    if (hasMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#9CA3AF" />
        </View>
      );
    }
    if (posts && posts.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.footerText}>{t('timeline.noMore')}</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{t('timeline.empty')}</Text>
      </View>
    );
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const targetUserId = item.userId || item.uid || item.authorId || item.senderId || item.user?._id;

    // Postコンポーネントに渡すオブジェクトを作成
    const postData = {
      id: item.id,
      userId: targetUserId,
      text: item.text || item.comment || "",
      imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
      likes: item.likes || 0,
      comments: item.comments || 0,
      timestamp: item.createdAt || item.timestamp,
      activities: item.activities || [],
      reactions: item.reactions || {},

      // ストリークとバッジ情報
      streak: item.streak,
      displayBadges: item.displayBadges,
      earnedBadges: item.earnedBadges,

      // userオブジェクトは存在する場合のみ渡す
      user: item.user ? {
        displayName: item.user.username || item.user.displayName,
        photoURL: item.user.profileImageUrl || item.user.photoURL
      } : undefined
    };

    return <Post post={postData} />;
  }, []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (loading && !refreshing && (!posts || posts.length === 0)) {
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
        estimatedItemSize={400}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={refresh}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
    flex: 1,
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