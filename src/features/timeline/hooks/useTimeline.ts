import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

// 引数に groupId (任意) を追加
export const useTimeline = (groupId?: string) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    const timelineRef = collection(db, "timeline");

    if (groupId) {
      // グループ指定がある場合: そのグループIDを持つ投稿を抽出
      q = query(
        timelineRef,
        where("groupId", "==", groupId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    } else {
      // 指定がない場合 (ホーム画面): 全体の投稿を表示
      q = query(
        timelineRef,
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Dateオブジェクトに変換
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("タイムライン取得エラー:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]); // groupIdが変わったら再実行

  return { posts, loading };
};