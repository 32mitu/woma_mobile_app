import { useState, useEffect } from 'react';
import {
  doc, collection, query, where, onSnapshot,
  serverTimestamp, getDocs, writeBatch
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { Group } from '../../../types';

export const useGroupDetail = (groupId: string, userId?: string) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);

    // 1. グループ情報の監視
    const groupRef = doc(db, 'groups', groupId);
    const unsubGroup = onSnapshot(groupRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGroup(prev => ({
          ...prev,
          id: snap.id,
          name: data.name,
          description: data.description,
          ownerId: data.createdBy || data.ownerId,
          photoURL: data.photoURL,
          challenge: data.challenge,
          createdAt: data.createdAt,
          memberIds: prev?.memberIds || [],
          memberCount: data.memberCount || 0
        } as Group));
      } else {
        setGroup(null);
      }
    });

    // 2. メンバー一覧の監視
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId)
    );

    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const memberIds = snapshot.docs.map(doc => doc.data().userId);

      if (userId) {
        setIsMember(memberIds.includes(userId));
      }

      setGroup(prev => {
        if (!prev) return null;

        // オーナー判定
        const currentOwnerId = prev.ownerId;
        if (userId && currentOwnerId) {
          setIsOwner(currentOwnerId === userId);
        }

        return {
          ...prev,
          memberIds: memberIds,
          memberCount: snapshot.size
        };
      });

      setLoading(false);
    });

    return () => {
      unsubGroup();
      unsubMembers();
    };
  }, [groupId, userId]);

  // 参加・脱退
  const toggleJoin = async () => {
    if (!group || !userId) return;

    try {
      const batch = writeBatch(db);

      if (isMember) {
        // 脱退
        const q = query(
          collection(db, 'groupMembers'),
          where('groupId', '==', groupId),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      } else {
        // 参加
        const memberRef = doc(collection(db, 'groupMembers'));
        batch.set(memberRef, {
          groupId: groupId,
          userId: userId,
          role: 'member',
          joinedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      console.error("Toggle join error:", error);
    }
  };

  // 削除
  const deleteGroup = async () => {
    if (!group || !isOwner) return;

    try {
      setLoading(true);
      const batch = writeBatch(db);

      const q = query(
        collection(db, 'groupMembers'),
        where('groupId', '==', groupId)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      const groupRef = doc(db, 'groups', groupId);
      batch.delete(groupRef);

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Delete group error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    group,
    isMember,
    isOwner,
    loading,
    toggleJoin,
    deleteGroup
  };
};