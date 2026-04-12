import { useState, useCallback, useEffect } from 'react';
import {
    collection, query, orderBy, limit,
    getDocs, startAfter, QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';

const POSTS_PER_PAGE = 20;

export const useGroupTimeline = (memberIds: string[]) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { userProfile } = useAuth();

    const fetchPosts = useCallback(async (isRefresh: boolean = false, startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null) => {
        // console.log("🔥 [Hook] fetchPosts called. Members:", memberIds?.length);

        if (!memberIds || memberIds.length === 0) {
            setLoading(false);
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const timelineRef = collection(db, "timeline");
            const constraints: any[] = [orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE)];

            if (!isRefresh && startAfterDoc) {
                constraints.push(startAfter(startAfterDoc));
            }

            const q = query(timelineRef, ...constraints);
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                if (isRefresh) setPosts([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const nextLastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastVisible(nextLastVisible);

            const blockedUsers = userProfile?.blockedUsers || [];

            // 生データの確認ログ
            // console.log(`🔥 [Hook] Fetched ${snapshot.docs.length} docs`);

            const rawPosts = snapshot.docs.map(doc => {
                const data = doc.data();
                // 最初の1件だけ詳細ログを出す
                // if (doc.id === snapshot.docs[0].id) {
                //   console.log("🔥 [Hook] Raw Data Sample:", JSON.stringify({
                //     id: doc.id,
                //     username: data.username,
                //     userId: data.userId,
                //     uid: data.uid
                //   }, null, 2));
                // }

                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                };
            });

            const filteredPosts = rawPosts.filter(post => {
                const targetUserId = post.userId || post.uid || post.authorId;
                if (targetUserId && blockedUsers.includes(targetUserId)) return false;

                if (memberIds && memberIds.length > 0) {
                    return targetUserId && memberIds.includes(targetUserId);
                }
                return true;
            });

            // console.log(`🔥 [Hook] After Filter: ${filteredPosts.length} posts`);

            if (filteredPosts.length === 0 && snapshot.docs.length >= POSTS_PER_PAGE) {
                // メンバーの投稿がなくてもページがある場合はカーソルを進めるだけで終了
                // 再帰呼び出しにすると投稿0件のグループで無限ループになるため、hasMoreを維持してloadMoreに委ねる
                setLastVisible(nextLastVisible);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // 取得件数が1ページ未満なら次ページなし
            if (snapshot.docs.length < POSTS_PER_PAGE) {
                setHasMore(false);
            }

            if (isRefresh) {
                setPosts(filteredPosts);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = filteredPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
            }

        } catch (error) {
            console.error("Group Timeline Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [memberIds.join(','), userProfile?.uid]);

    useEffect(() => {
        fetchPosts(true);
    }, [fetchPosts]);

    const refresh = async () => {
        setRefreshing(true);
        setHasMore(true);
        await fetchPosts(true);
    };

    const loadMore = async () => {
        if (!hasMore || loading || refreshing || !lastVisible) return;
        await fetchPosts(false, lastVisible);
    };

    return { posts, loading, refreshing, refresh, loadMore, hasMore };
};