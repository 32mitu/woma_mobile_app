import { useState, useEffect } from 'react';
import {
  doc, setDoc, deleteDoc,
  serverTimestamp, collection, query, where, getDocs, getDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';
import { useTranslation } from 'react-i18next';

const COLLECTION_NAME = 'follows';

// 1. フォロー・フォロー解除アクション
export const useSocial = () => {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const followUser = async (targetUserId: string) => {
    if (!userProfile?.uid || !targetUserId) return;
    if (userProfile.uid === targetUserId) return; // 自分自身はフォロー不可
    if (loading) return; // 連打防止
    setLoading(true);
    try {
      const docId = `${userProfile.uid}_${targetUserId}`;
      const followRef = doc(db, COLLECTION_NAME, docId);
      await setDoc(followRef, {
        followerId: userProfile.uid,
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      });
      // 通知は Cloud Function (onNewFollow) が送信するためクライアント側では送らない

    } catch (error) {
      console.error('Follow error:', error);
      alert(t('social.followFailed'));
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!userProfile?.uid || !targetUserId) return;
    if (loading) return; // 連打防止
    setLoading(true);
    try {
      const docId = `${userProfile.uid}_${targetUserId}`;
      const followRef = doc(db, COLLECTION_NAME, docId);
      await deleteDoc(followRef);
    } catch (error) {
      console.error('Unfollow error:', error);
      alert(t('social.unfollowFailed'));
    } finally {
      setLoading(false);
    }
  };

  return { followUser, unfollowUser, loading };
};

// 2. プロフィール画面用: 相互フォロー判定フック
export const useFollowStatus = (targetUserId: string) => {
  const { userProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);   // 自分が相手をフォローしているか
  const [isFollowedBy, setIsFollowedBy] = useState(false); // 相手が自分をフォローしているか
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // targetUserId が変わったとき古い状態を即座にリセット
    setIsFollowing(false);
    setIsFollowedBy(false);
    setLoading(true);

    if (!userProfile?.uid || !targetUserId) {
      setLoading(false);
      return;
    }

    const currentUserId = userProfile.uid;

    // 1. 自分が相手をフォローしているか (自分 -> 相手)
    const myFollowRef = doc(db, COLLECTION_NAME, `${currentUserId}_${targetUserId}`);
    const unsubMe = onSnapshot(myFollowRef, (doc) => {
      setIsFollowing(doc.exists());
    });

    // 2. 相手が自分をフォローしているか (相手 -> 自分)
    const theirFollowRef = doc(db, COLLECTION_NAME, `${targetUserId}_${currentUserId}`);
    const unsubThem = onSnapshot(theirFollowRef, (doc) => {
      setIsFollowedBy(doc.exists());
    });

    setLoading(false);

    return () => {
      unsubMe();
      unsubThem();
    };
  }, [userProfile?.uid, targetUserId]);

  const isMutual = isFollowing && isFollowedBy;

  return { isFollowing, isFollowedBy, isMutual, loading };
};

// 3. UserCard用: 単純なフォロー状態チェックフック
export const useIsFollowing = (targetUserId: string) => {
  const { userProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid || !targetUserId) return;

    const docId = `${userProfile.uid}_${targetUserId}`;
    const followRef = doc(db, COLLECTION_NAME, docId);

    const unsubscribe = onSnapshot(followRef, (doc) => {
      setIsFollowing(doc.exists());
    });

    return () => unsubscribe();
  }, [userProfile?.uid, targetUserId]);

  return isFollowing;
};

// 4. 一覧取得フック
export const useSocialList = (userId: string | undefined, type: 'following' | 'followers') => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchList = async () => {
      setLoading(true);
      try {
        const followsRef = collection(db, COLLECTION_NAME);
        let q;
        if (type === 'following') {
          q = query(followsRef, where('followerId', '==', userId));
        } else {
          q = query(followsRef, where('followingId', '==', userId));
        }
        const snapshot = await getDocs(q);
        const targetIds: string[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as { followingId: string; followerId: string };
          if (type === 'following') {
            if (data.followingId) targetIds.push(data.followingId);
          } else {
            if (data.followerId) targetIds.push(data.followerId);
          }
        });

        // userId -> follow doc ref のマップを作成（インデックスずれを防ぐ）
        const followDocMap = new Map<string, any>();
        snapshot.forEach(followDoc => {
          const data = followDoc.data() as { followingId: string; followerId: string };
          const targetId = type === 'following' ? data.followingId : data.followerId;
          if (targetId) {
            followDocMap.set(targetId, followDoc.ref);
          }
        });

        const resolvedTargetIds = Array.from(followDocMap.keys());

        if (resolvedTargetIds.length === 0) {
          setUsers([]);
        } else {
          const userPromises = resolvedTargetIds.map(async (id) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', id));
              if (userDoc.exists()) {
                return { uid: userDoc.id, ...userDoc.data() };
              } else {
                // ユーザーが存在しない場合、対応する follow ドキュメントをマップから取得して削除
                const followDocRef = followDocMap.get(id);
                if (followDocRef) {
                  console.log(`Deleting orphan follow record (Target user ${id} not found)`);
                  await deleteDoc(followDocRef);
                }
                return null;
              }
            } catch (e) {
              console.error(`Error fetching user ${id}:`, e);
              return null;
            }
          });
          const fetchedUsers = await Promise.all(userPromises);
          setUsers(fetchedUsers.filter(u => u !== null));
        }
      } catch (error) {
        console.error("Error fetching social list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [userId, type]);

  return { users, loading };
};

// 5. カウント取得フック
export const useSocialCounts = (userId: string | undefined) => {
  const [counts, setCounts] = useState({ following: 0, followers: 0 });

  useEffect(() => {
    if (!userId) return;

    const followsRef = collection(db, COLLECTION_NAME);

    const followingQuery = query(followsRef, where('followerId', '==', userId));
    const unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, following: snapshot.size }));
    });

    const followersQuery = query(followsRef, where('followingId', '==', userId));
    const unsubscribeFollowers = onSnapshot(followersQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, followers: snapshot.size }));
    });

    return () => {
      unsubscribeFollowing();
      unsubscribeFollowers();
    };
  }, [userId]);

  return counts;
};