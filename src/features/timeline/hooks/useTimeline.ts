import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';

export const useTimeline = (groupId?: string) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    const blockedUsers = userProfile?.blockedUsers || [];
    
    let q;
    const timelineRef = collection(db, "timeline");

    if (groupId) {
      q = query(timelineRef, where("groupId", "==", groupId), orderBy("createdAt", "desc"), limit(50));
    } else {
      q = query(timelineRef, orderBy("createdAt", "desc"), limit(50));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1. データ取得
      const allPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });

      // 2. フィルタリング (IDの揺らぎを考慮)
      const filteredPosts = allPosts.filter(post => {
        const targetUserId = post.userId || post.uid || post.authorId || post.senderId || post.user?._id;
        const isBlocked = targetUserId && blockedUsers.includes(targetUserId);
        return !isBlocked;
      });

      setPosts(filteredPosts);
      setLoading(false);
    }, (error) => {
      console.error("タイムライン取得エラー:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, userProfile?.blockedUsers]);

  return { posts, loading };
};