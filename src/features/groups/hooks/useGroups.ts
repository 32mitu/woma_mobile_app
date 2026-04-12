import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, serverTimestamp, writeBatch // ★ writeBatch をインポート
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

export const useGroups = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // グループ一覧の監視
  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // グループ作成 (修正版: Batch処理)
  const createGroup = async (name: string, description: string, userId: string) => {
    if (!name.trim() || !userId) return;

    try {
      // 1. バッチの開始
      const batch = writeBatch(db);

      // 2. ドキュメント参照（ID）を先に作成
      const groupRef = doc(collection(db, 'groups'));
      const memberRef = doc(db, 'groupMembers', `${groupRef.id}_${userId}`);

      // 3. バッチにセット (書き込み予約)
      batch.set(groupRef, {
        name,
        description,
        createdBy: userId,
        createdAt: serverTimestamp(),
        memberCount: 1,
      });

      batch.set(memberRef, {
        groupId: groupRef.id, // 先ほど作成したIDを使用
        userId: userId,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      // 4. 一括コミット (ここで初めて書き込まれる)
      await batch.commit();

      return groupRef.id;

    } catch (error) {
      console.error("グループ作成エラー:", error);
      throw error; // UI側でエラーハンドリングできるように再スロー
    }
  };

  return { groups, loading, createGroup };
};