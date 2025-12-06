import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '../../../firebaseConfig'; // ルートにある設定ファイルを読み込み

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Firestoreからユーザーの詳細情報（名前や体重など）を取得
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: data.username || "名無しさん",
              weight: data.weight || null,
              height: data.height || null,
              profileImageUrl: data.profileImageUrl || null,
              bio: data.bio || "",
            });
          } else {
            // データがない場合の初期値
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: "ゲスト",
            });
          }
        } catch (error) {
          console.error("ユーザー情報の取得に失敗:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, loading };
};