import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  deleteUser // ★追加
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, deleteDoc } from "firebase/firestore"; // ★ deleteDoc 追加 
import { auth, db } from '../../../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// Google Sign-Inの初期設定
GoogleSignin.configure({
  iosClientId:"540454404812-p95ail006s113tvlthe8vb542a953c4j.apps.googleusercontent.com",
  webClientId: '540454404812-grhtketipkrgpa24m3u7hejbn94v0bec.apps.googleusercontent.com' 
});

type UserProfile = {
  uid: string;
  email: string | null;
  username: string;
  weight?: number | null;
  height?: number | null;
  profileImageUrl?: string | null;
  bio?: string;
  blockedUsers?: string[];
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
          username: data.username || user.displayName || "名無しさん",
          weight: data.weight || null,
          height: data.height || null,
          profileImageUrl: data.profileImageUrl || user.photoURL || null,
          bio: data.bio || "",
          blockedUsers: data.blockedUsers || [],
        });
      } else {
        setUserProfile({
          uid: user.uid,
          email: user.email,
          username: user.displayName || "ゲスト",
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("ユーザー情報の取得に失敗:", error);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  // Googleログイン処理
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) throw new Error('Google ID Tokenが見つかりません');

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      await checkAndCreateUserDoc(result.user);
      
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('Google Sign-In cancelled');
      } else {
        console.error('Google Sign-In Error:', error);
        alert('Googleログインに失敗しました');
      }
    }
  };

  // Appleログイン処理
  const signInWithApple = async () => {
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { identityToken } = appleCredential;
      if (!identityToken) throw new Error('Apple Identity Tokenが見つかりません');

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const result = await signInWithCredential(auth, credential);
      await checkAndCreateUserDoc(result.user);

    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple Sign-In cancelled');
      } else {
        console.error('Apple Sign-In Error:', error);
        alert('Appleログインに失敗しました');
      }
    }
  };

  const checkAndCreateUserDoc = async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        username: firebaseUser.displayName || "名無しさん",
        email: firebaseUser.email,
        createdAt: new Date(),
        blockedUsers: [],
      });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  // ★追加: アカウント削除（退会）機能
  const deleteAccount = async () => {
    if (!user) return;

    try {
      // 1. Firestoreのユーザーデータを削除
      await deleteDoc(doc(db, "users", user.uid));
      
      // 2. Firebase Authenticationのアカウント削除
      // ※ 注意: ログインから時間が経っていると失敗するため、その場合は再ログインを促す
      await deleteUser(user);
      
    } catch (error: any) {
      console.error("Account deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('セキュリティ保護のため、再ログインが必要です。一度ログアウトし、再度ログインしてから実行してください。');
      }
      throw error;
    }
  };

  return {
    user,
    userProfile,
    loading,
    signOut,
    signInWithGoogle,
    signInWithApple,
    deleteAccount, // ★これをリターンに追加したので、profile.tsxから呼び出せるようになります
  };
};