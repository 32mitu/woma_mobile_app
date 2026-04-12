import { useState, useCallback, useEffect, useRef } from 'react';
import {
  collection, query, orderBy, limit,
  getDocs, startAfter, QueryDocumentSnapshot, DocumentData,
  where
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
  const blockedUsersRef = useRef<string[]>([]);
  const userUid = userProfile?.uid;
  const blockedUsers = userProfile?.blockedUsers;

  useEffect(() => {
    if (blockedUsers) {
      blockedUsersRef.current = blockedUsers;
    }
  }, [blockedUsers]);

  const fetchPosts = useCallback(async (isRefresh: boolean = false, startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      if (!userUid) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let q;
      const constraints: any[] = [orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE)];

      if (!isRefresh && startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      if (groupId) {
        const timelineRef = collection(db, `groups/${groupId}/timeline`);
        q = query(timelineRef, ...constraints);
      } else {
        const timelineRef = collection(db, "timeline");
        q = query(timelineRef, ...constraints);
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        if (isRefresh) setPosts([]);
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

      const blockedUsers = blockedUsersRef.current;

      const newPosts = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        })
        .filter(post => {
          const targetUserId = post.userId || post.uid || post.authorId || post.senderId || post.user?._id;
          if (targetUserId && blockedUsers.includes(targetUserId)) {
            return false;
          }
          return true;
        });

      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
      }

      if (snapshot.docs.length < POSTS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (error) {
      console.error("[TimelineHook] Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // blockedUsers は配列なので deps に入れると毎回再生成される。ref で読む。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid, groupId]);

  useEffect(() => {
    if (userUid) {
      fetchPosts(true);
    }
  }, [fetchPosts, userUid]);

  const refresh = async () => {
    setHasMore(true);
    setLastVisible(null);
    await fetchPosts(true, null);
  };

  const loadMore = async () => {
    if (!hasMore || loading || refreshing || !lastVisible) return;
    await fetchPosts(false, lastVisible);
  };

  return { posts, loading, refreshing, refresh, loadMore, hasMore };
};