import React, { useState, useEffect } from 'react'; // ★ useEffectを追加
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StyleSheet, ActivityIndicator 
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/features/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const router = useRouter();
  // ★ useAuthから user と loading (初期判定用) を取得
  // ローカルの loading と名前が被るので authLoading という名前に変更して受け取る
  const { signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // ボタン押下時のローディング用 (authLoadingと区別)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ★追加: ログイン済みならホームへ転送する処理
  useEffect(() => {
    // 読み込みが終わり、かつユーザーが存在すればホームへ
    if (!authLoading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading]);

  // ★追加: 認証確認中、または転送待機中は画面を表示せずローディング
  if (authLoading || user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // メールアドレスでの新規登録
  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert("エラー", "すべての項目を入力してください");
      return;
    }
    setIsSubmitting(true); // loading -> isSubmitting
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        bio: "",
        profileImageUrl: "",
        createdAt: serverTimestamp(),
        blockedUsers: [],
      });
      
      Alert.alert("登録成功", "アカウントが作成されました！", [
        { text: "OK", onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (error: any) {
      let msg = "登録に失敗しました";
      if (error.code === 'auth/email-already-in-use') msg = "このメールアドレスは既に使用されています";
      if (error.code === 'auth/weak-password') msg = "パスワードは6文字以上にしてください";
      Alert.alert("エラー", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // メールアドレスでのログイン
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("エラー", "メールアドレスとパスワードを入力してください");
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error(error);
      Alert.alert("ログイン失敗", "メールアドレスまたはパスワードが間違っています");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Googleログインハンドラ
  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error("Google Login Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Appleログインハンドラ
  const handleAppleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithApple();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error("Apple Login Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.headerSection}>
            <Text style={styles.title}>WOMA</Text>
            <Text style={styles.subtitle}>3日坊主を、肯定する。</Text>
          </View>

          <View style={styles.formContainer}>
            {/* ユーザー名 (新規登録時のみ) */}
            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ユーザー名</Text>
                <TextInput
                  style={styles.input}
                  placeholder="表示名を入力"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                placeholder="example@woma.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                style={styles.input}
                placeholder="6文字以上"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={isLoginMode ? handleLogin : handleSignUp}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? '処理中...' : (isLoginMode ? 'ログイン' : '新規登録')}
              </Text>
            </TouchableOpacity>

            {/* --- ソーシャルログイン --- */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              {/* Apple Login */}
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />

              {/* Google Login */}
              <TouchableOpacity 
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
                <Text style={styles.googleButtonText}>Googleで続ける</Text>
              </TouchableOpacity>
            </View>
            {/* ------------------------- */}

            <TouchableOpacity 
              onPress={() => setIsLoginMode(!isLoginMode)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLoginMode ? 'アカウントを作成する' : 'すでにアカウントをお持ちの方'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  
  headerSection: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#3B82F6', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  
  formContainer: { gap: 16 },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 14, color: '#4B5563', marginBottom: 4, fontWeight: 'bold' },
  input: { 
    width: '100%', backgroundColor: '#F3F4F6', padding: 16, 
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    fontSize: 16 
  },
  
  button: {
    backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginTop: 8,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },
  buttonDisabled: { backgroundColor: '#93C5FD' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  switchButton: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#3B82F6', fontWeight: '600' },

  // ソーシャルログイン用スタイル
  dividerContainer: { 
    flexDirection: 'row', alignItems: 'center', marginVertical: 16 
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 16, color: '#9CA3AF', fontSize: 12 },
  
  socialButtonsContainer: { gap: 12 },
  appleButton: { width: '100%', height: 50 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB',
    padding: 14, borderRadius: 12, height: 50
  },
  googleButtonText: {
    color: '#374151', fontWeight: 'bold', fontSize: 16
  }
});