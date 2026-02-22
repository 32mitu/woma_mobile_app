import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useGroupTimeline } from '../hooks/useGroupTimeline';
import { useTranslation } from 'react-i18next';
import { Post } from '../../timeline/components/Post';

type Props = {
    memberIds: string[];
    ListHeaderComponent?: React.ReactElement;
};

export const GroupTimeline = ({ memberIds, ListHeaderComponent }: Props) => {
    const { posts, loading, refreshing, refresh, loadMore } = useGroupTimeline(memberIds);
    const { t } = useTranslation();

    const renderItem = useCallback(({ item }: { item: any }) => {
        // データの揺らぎを吸収
        const targetUserId = item.userId || item.uid || item.authorId;

        const postData = {
            id: item.id,
            userId: targetUserId,
            text: item.comment || item.text || "",
            imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
            likes: item.likes || 0,
            comments: item.comments || 0,
            timestamp: item.createdAt,
            reactions: item.reactions,
            activities: item.activities || [],

            // ★修正: user情報を渡さないことで、Postコンポーネント側での「最新情報の強制再取得」をトリガーする
            // user: { ... }  <-- 削除
        };

        return <Post post={postData} />;
    }, []);

    return (
        <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            ListFooterComponent={
                loading && !refreshing ? (
                    <View style={{ padding: 20 }}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                ) : null
            }
            ListEmptyComponent={
                !loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('group.noMemberPosts')}</Text>
                    </View>
                ) : null
            }
        />
    );
};

const styles = StyleSheet.create({
    listContent: { paddingBottom: 20 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF' }
});