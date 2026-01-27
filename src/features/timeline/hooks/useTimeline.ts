import { useState, useCallback, useEffect } from 'react';
import {
  collection, query, orderBy, limit,
  getDocs, startAfter, QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';

const POSTS_PER_PAGE = 20;

export const useTimeline = (groupId?: string) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { userProfile } = useAuth();

  // 投稿取得の共通ロジック
  // isRefresh: 引っ張って更新かどうか
  // startAfterDoc: 続きから読み込む場合の開始ドキュメント
  const fetchPosts = useCallback(async (isRefresh: boolean = false, startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null) => {
    try {
      if (!userProfile) return;

      const timelineRef = collection(db, "timeline");

      // クエリの構築
      // NOTE: groupIdがある場合は複合インデックス(groupId + createdAt)が必要です
      const constraints: any[] = [orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE)];

      // 続きからの読み込みなら startAfter を追加
      if (!isRefresh && startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      // クエリ作成 (groupId対応は簡易的にコメントアウト中。必要に応じて有効化してください)
      // const q = groupId 
      //   ? query(timelineRef, where("groupId", "==", groupId), ...constraints)
      //   : query(timelineRef, ...constraints);

      const q = query(timelineRef, ...constraints);

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        if (isRefresh) setPosts([]);
        return;
      }

      // 次の読み込みのために最後のドキュメントを保存
      const nextLastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(nextLastVisible);

      // データの変換とフィルタリング
      const blockedUsers = userProfile.blockedUsers || [];

      const newPosts = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        })
        .filter(post => {
          // ブロックユーザーの除外
          const targetUserId = post.userId || post.uid || post.authorId || post.senderId || post.user?._id;
          return targetUserId && !blockedUsers.includes(targetUserId);
        });

      // ★追加: フィルタリングの結果、表示できる投稿が0件になってしまった場合
      // かつ、まだ続きがありそうな場合（取得件数がリミットいっぱいだった場合）
      // 自動的に次のページを読みに行く (再帰呼び出し)
      if (newPosts.length === 0 && snapshot.docs.length >= POSTS_PER_PAGE) {
        // 再帰呼び出し: refreshフラグは維持しつつ、今取得した最後のドキュメントから次を探す
        await fetchPosts(isRefresh, nextLastVisible);
        return;
      }

      if (isRefresh) {
        setPosts(newPosts);
      } else {
        // 重複排除して追加
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }

    } catch (error) {
      console.error("タイムライン取得エラー:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile, groupId]);

  // 初回読み込み
  useEffect(() => {
    if (userProfile) {
      fetchPosts(true);
    }
  }, [userProfile, fetchPosts]);

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