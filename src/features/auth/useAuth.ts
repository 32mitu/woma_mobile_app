import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth'; // ★ signOutを追加
import { doc, onSnapshot } from "firebase/firestore"; 
import { auth, db } from '../../../firebaseConfig';

// ユーザー情報の型定義
type UserProfile = {
  uid: string;
  email: string | null;
  username: string;
  weight?: number | null;
  height?: number | null;
  profileImageUrl?: string | null;
  bio?: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 認証状態の監視
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. ユーザープロフィールのリアルタイム監視
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const userDocRef = doc(db, "users", user.uid);

    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          uid: user.uid,
          email: user.email,
          username: data.username || "名無しさん",
          weight: data.weight || null,
          height: data.height || null,
          profileImageUrl: data.profileImageUrl || null,
          bio: data.bio || "",
        });
      } else {
        setUserProfile({
          uid: user.uid,
          email: user.email,
          username: "ゲスト",
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("ユーザー情報の取得に失敗:", error);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  // ★ 3. ログアウト関数を追加
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("ログアウトエラー:", error);
      throw error;
    }
  };

  // ★ signOut を return に含める
  return { user, userProfile, loading, signOut };
};