import { useState, useEffect } from 'react';
import { 
  doc, collection, query, where, onSnapshot, 
  serverTimestamp, getDocs, addDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

export const useGroupDetail = (groupId: string, userId?: string) => {
  const [group, setGroup] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ★追加: リアルタイムで数えたメンバー数
  const [realtimeMemberCount, setRealtimeMemberCount] = useState(0);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);

    // 1. グループ情報の監視
    const groupRef = doc(db, 'groups', groupId);
    const unsubGroup = onSnapshot(groupRef, (snap) => {
      if (snap.exists()) {
        // ここで取得する memberCount は更新されない可能性があるので、
        // 下記のリアルタイムカウントを優先して使います
        setGroup({ id: snap.id, ...snap.data() });
      } else {
        setGroup(null);
      }
      setLoading(false);
    });

    // 2. メンバー状態 & 人数の監視 (★ここを強化)
    // このグループのメンバー全データを監視して数える
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId)
    );

    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      // ★実際のデータ数をカウント
      setRealtimeMemberCount(snapshot.size);

      // 自分が含まれているかチェック
      if (userId) {
        const isJoined = snapshot.docs.some(doc => doc.data().userId === userId);
        setIsMember(isJoined);
      }
    });

    return () => {
      unsubGroup();
      unsubMembers();
    };
  }, [groupId, userId]);

  // 参加・脱退アクション
  const toggleJoin = async () => {
    if (!group || !userId) return;

    try {
      if (isMember) {
        // --- 脱退処理 ---
        const q = query(
          collection(db, 'groupMembers'),
          where('groupId', '==', groupId),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        // ※ memberCountの更新は行わない (自動カウントに任せる)

      } else {
        // --- 参加処理 ---
        await addDoc(collection(db, 'groupMembers'), {
          groupId: groupId,
          userId: userId,
          role: 'member',
          joinedAt: serverTimestamp(),
        });
        
        // ※ memberCountの更新は行わない
      }
    } catch (error) {
      console.error("参加/脱退エラー:", error);
      alert("処理に失敗しました。");
    }
  };

  // フックが返すデータに、数え直した memberCount を適用して返す
  const groupWithCount = group ? { ...group, memberCount: realtimeMemberCount } : null;

  return { group: groupWithCount, isMember, loading, toggleJoin };
};