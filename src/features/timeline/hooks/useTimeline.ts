import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

export const useTimeline = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // timelineコレクションを「作成日時の新しい順」に50件取得
    const q = query(
      collection(db, "timeline"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    // リアルタイム監視 (onSnapshot)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // タイムスタンプを文字列に変換（エラー防止）
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Just now',
        };
      });
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("タイムライン取得エラー:", error);
      setLoading(false);
    });

    // アンマウント時に監視を解除
    return () => unsubscribe();
  }, []);

  return { posts, loading };
};