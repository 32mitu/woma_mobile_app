import { useEffect } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  deleteUser
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from '../../../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '../../store/authStore'; // Zustandストアをインポート

// Google Sign-Inの初期設定
// 環境変数 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID を .env に定義することを推奨
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '540454404812-p95ail006s113tvlthe8vb542a953c4j.apps.googleusercontent.com',
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '540454404812-grhtketipkrgpa24m3u7hejbn94v0bec.apps.googleusercontent.com',
});

// UserProfile型は store/authStore.ts で定義されているものと合わせるのが理想ですが、
// ここでは戻り値の互換性のために同様の型を使用、またはストアから型をインポートしてください。
// 今回はストアが { user, ... } を管理しているため、ストアの定義に従います。

export const useAuth = () => {
  // Zustandから状態とアクションを取得
  // userProfileはストアの user ステートに対応します
  const { user: userProfile, isLoading: loading, setUser, setLoading, logout } = useAuthStore();

  // 1. 認証状態とプロフィール情報のリアルタイム監視を一元化
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // 既存のスナップショットリスナーがあれば解除（ユーザー切り替え時など）
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (firebaseUser) {
        // ログイン状態: Firestoreの監視を開始
        const userDocRef = doc(db, "users", firebaseUser.uid);

        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // ストアを更新 (Firebase User情報とFirestore情報をマージ)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: data.username || firebaseUser.displayName || "名無しさん",
              weight: data.weight || null,
              height: data.height || null,
              profileImageUrl: data.profileImageUrl || firebaseUser.photoURL || null,
              bio: data.bio || "",
              blockedUsers: data.blockedUsers || [],
              // その他必要なフィールドがあればここに追加
              createdAt: data.createdAt,
            } as any);
          } else {
            // ドキュメント未作成時
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: firebaseUser.displayName || "ゲスト",
              blockedUsers: [],
            } as any);
          }
          setLoading(false);
        }, (error) => {
          console.error("ユーザー情報の取得に失敗:", error);
          setLoading(false);
        });

      } else {
        // ログアウト状態
        logout();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [setUser, setLoading, logout]);

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
        // エラー表示はUI側で行うか、ここでAlertを出しても良い
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
      // ストアのクリアはonAuthStateChangedのリスナー内で行われますが、念のため呼んでもOK
      logout();
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  // アカウント削除（退会）機能
  const deleteAccount = async () => {
    const currentUser = auth.currentUser; // 現在のユーザーを取得
    if (!currentUser) return;

    try {
      // 1. Firestoreのユーザーデータを削除
      await deleteDoc(doc(db, "users", currentUser.uid));

      // 2. Firebase Authenticationのアカウント削除
      await deleteUser(currentUser);

      // 3. ストアの状態をクリア (onAuthStateChangedが検知して実行するが、明示的に行う)
      logout();

    } catch (error: any) {
      console.error("Account deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('セキュリティ保護のため、再ログインが必要です。一度ログアウトし、再度ログインしてから実行してください。');
      }
      throw error;
    }
  };

  return {
    user: auth.currentUser, // FirebaseのUserオブジェクトが必要な場合のために返す
    userProfile,            // Zustandで管理されているリッチなプロフィール情報
    loading,
    isAuthenticated: !!userProfile, // 認証済みかどうかのフラグ
    signOut,
    signInWithGoogle,
    signInWithApple,
    deleteAccount,
  };
};