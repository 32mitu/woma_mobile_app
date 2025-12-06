import { useState, useEffect } from 'react';
import { 
  doc, setDoc, deleteDoc, 
  serverTimestamp, collection, query, where, getDocs, getDoc, onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';

// 1. フォロー・フォロー解除を行うフック
export const useSocial = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const followUser = async (targetUserId: string) => {
    if (!userProfile?.uid || !targetUserId) return;
    setLoading(true);
    try {
      const docId = `${userProfile.uid}_${targetUserId}`;
      const followRef = doc(db, 'follows', docId);
      await setDoc(followRef, {
        followerId: userProfile.uid,
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      });
      console.log(`Followed ${targetUserId}`);
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!userProfile?.uid || !targetUserId) return;
    setLoading(true);
    try {
      const docId = `${userProfile.uid}_${targetUserId}`;
      const followRef = doc(db, 'follows', docId);
      await deleteDoc(followRef);
      console.log(`Unfollowed ${targetUserId}`);
    } catch (error) {
      console.error("Unfollow error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { followUser, unfollowUser, loading };
};

// 2. フォロー中・フォロワー一覧を取得するフック
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
        const followsRef = collection(db, 'follows');
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

// 3. ★追加: フォロー数・フォロワー数をリアルタイムで数えるフック
export const useSocialCounts = (userId: string | undefined) => {
  const [counts, setCounts] = useState({ following: 0, followers: 0 });

  useEffect(() => {
    if (!userId) return;

    const followsRef = collection(db, 'follows');

    // フォロー中 (自分が followerId になっているデータの数)
    const followingQuery = query(followsRef, where('followerId', '==', userId));
    const unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, following: snapshot.size }));
    });

    // フォロワー (自分が followingId になっているデータの数)
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