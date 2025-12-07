import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
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

  // グループ作成
  const createGroup = async (name: string, description: string, userId: string) => {
    if (!name.trim() || !userId) return;
    
    // 1. グループドキュメント作成
    const groupRef = await addDoc(collection(db, 'groups'), {
      name,
      description,
      createdBy: userId,
      createdAt: serverTimestamp(),
      memberCount: 1, // 作成者は最初からメンバー
    });

    // 2. 作成者をメンバーとして追加 (Web版と同じく groupMembers コレクションを使用)
    const memberRef = doc(collection(db, 'groupMembers'));
    await setDoc(memberRef, {
      groupId: groupRef.id,
      userId: userId,
      role: 'admin',
      joinedAt: serverTimestamp(),
    });

    return groupRef.id;
  };

  return { groups, loading, createGroup };
};