import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from "firebase/firestore"; // getDoc から onSnapshot に変更
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
      // ログアウト時はここでロード完了＆データクリア
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. ユーザープロフィールのリアルタイム監視 (userステートに依存)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const userDocRef = doc(db, "users", user.uid);

    // onSnapshot を使用して、データの変更をリアルタイムに検知する
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
        // データがない場合の初期値
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

    // アンマウント時、またはユーザー切り替え時に監視を解除
    return () => unsubscribeSnapshot();
  }, [user]);

  return { user, userProfile, loading };
};