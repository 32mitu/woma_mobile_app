import React, { useState, useEffect } from 'react';
import {
  View, Text, Alert,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StyleSheet, ActivityIndicator,
  Linking
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/features/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';

// 共通コンポーネント
import { Button } from '../src/ui/Button';
import { Input } from '../src/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading]);

  const openTerms = () => {
    Linking.openURL('https://note.com/kumaotoko32/n/ned99f2c17b7c?app_launch=false');
  };

  if (authLoading || user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert("エラー", "すべての項目を入力してください");
      return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        username: username,
        email: email,
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
              <Input
                label="ユーザー名"
                placeholder="表示名を入力"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            )}

            <Input
              label="メールアドレス"
              placeholder="example@woma.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="パスワード"
              placeholder="6文字以上"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* メインアクションボタン */}
            <Button
              title={isLoginMode ? 'ログイン' : '新規登録'}
              onPress={isLoginMode ? handleLogin : handleSignUp}
              loading={isSubmitting}
              variant="primary"
              style={styles.mainButton}
            />

            {/* 規約への同意文言 (新規登録時のみ表示) */}
            {!isLoginMode && (
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  登録することで、
                  <Text style={styles.linkText} onPress={openTerms}>利用規約</Text>
                  に同意したものとみなされます。
                </Text>
              </View>
            )}

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

              {/* Google Login (共通Buttonを使用) */}
              <Button
                title="Googleで続ける"
                variant="secondary"
                icon={<Ionicons name="logo-google" size={20} color="#DB4437" />}
                onPress={handleGoogleLogin}
                disabled={isSubmitting}
                textStyle={styles.googleButtonText} // Googleだけ文字色を調整したい場合
              />
            </View>
            {/* ------------------------- */}

            {/* モード切り替え */}
            <Button
              title={isLoginMode ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方'}
              variant="ghost"
              onPress={() => setIsLoginMode(!isLoginMode)}
              style={styles.switchButton}
              textStyle={styles.switchText}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  headerSection: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#3B82F6', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },

  formContainer: { width: '100%' },

  mainButton: { marginTop: 8 },

  switchButton: { marginTop: 16 },
  switchText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },

  // ソーシャルログイン用スタイル
  dividerContainer: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 24
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 16, color: '#9CA3AF', fontSize: 12 },

  socialButtonsContainer: { gap: 12 },
  appleButton: { width: '100%', height: 50 },
  googleButtonText: { color: '#374151' }, // Secondaryボタンの文字色微調整

  // 規約同意
  termsContainer: { marginTop: 12, alignItems: 'center' },
  termsText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  linkText: { color: '#3B82F6', fontWeight: 'bold' },
});