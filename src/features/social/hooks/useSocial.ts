import { useState, useEffect } from 'react';
import { 
  doc, setDoc, deleteDoc, 
  serverTimestamp, collection, query, where, getDocs, getDoc, onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';

const COLLECTION_NAME = 'follows';

// 1. フォロー・フォロー解除アクション
export const useSocial = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const followUser = async (targetUserId: string) => {
    if (!userProfile?.uid || !targetUserId) return;
    setLoading(true);
    try {
      const docId = `${userProfile.uid}_${targetUserId}`;
      const followRef = doc(db, COLLECTION_NAME, docId);
      await setDoc(followRef, {
        followerId: userProfile.uid,
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      });
      console.log(`Followed ${targetUserId}`);
    } catch (error) {
      console.error("Follow error:", error);
      alert("フォローに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!userProfile?.uid || !targetUserId) return;
    setLoading(true);
    try {
      const docId = `${userProfile.uid}_${targetUserId}`;
      const followRef = doc(db, COLLECTION_NAME, docId);
      await deleteDoc(followRef);
      console.log(`Unfollowed ${targetUserId}`);
    } catch (error) {
      console.error("Unfollow error:", error);
      alert("フォロー解除に失敗しました");
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

        if (targetIds.length === 0) {
          setUsers([]);
        } else {
          const userPromises = targetIds.map(async (id) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', id));
              if (userDoc.exists()) {
                return { uid: userDoc.id, ...userDoc.data() };
              }
              return null;
            } catch (e) {
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