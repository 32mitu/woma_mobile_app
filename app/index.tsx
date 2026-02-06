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

// React Hook Form & Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// ※ src/utils/validationSchemas.ts を作成済みであること
import { loginSchema, signupSchema, SignupFormData } from '../src/utils/validationSchemas';

// 共通コンポーネント
import { Button } from '../src/ui/Button';
import { Input } from '../src/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // ソーシャルログイン用のローディング状態
  const [socialLoading, setSocialLoading] = useState(false);

  // フォーム設定
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SignupFormData>({
    resolver: zodResolver(isLoginMode ? loginSchema : signupSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
  });

  // モード切替時にフォームをリセット
  useEffect(() => {
    reset({ email: '', password: '', username: '' });
  }, [isLoginMode, reset]);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading]);

  const openTerms = () => {
    Linking.openURL('https://note.com/kumaotoko32/n/ned99f2c17b7c?app_launch=false');
  };

  // フォーム送信ハンドラ (ログイン・登録共通)
  const onSubmit = async (data: SignupFormData) => {
    try {
      if (isLoginMode) {
        // --- ログイン処理 ---
        await signInWithEmailAndPassword(auth, data.email, data.password);
        // 遷移は useEffect で監視しているため不要だが、念のため
        router.replace('/(tabs)/home');
      } else {
        // --- 新規登録処理 ---
        // スキーマでチェック済みだが、型ガード的に確認
        if (!data.username) return;

        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const newUser = userCredential.user;

        // Firestoreにユーザー情報保存
        await setDoc(doc(db, "users", newUser.uid), {
          uid: newUser.uid,
          username: data.username,
          email: data.email,
          bio: "",
          profileImageUrl: "",
          createdAt: serverTimestamp(),
          blockedUsers: [],
        });

        Alert.alert("登録成功", "アカウントが作成されました！", [
          { text: "OK", onPress: () => router.replace('/(tabs)/home') }
        ]);
      }
    } catch (error: any) {
      console.error(error);
      let msg = "エラーが発生しました";
      if (error.code === 'auth/email-already-in-use') msg = "このメールアドレスは既に使用されています";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "メールアドレスまたはパスワードが間違っています";
      }
      if (error.code === 'auth/weak-password') msg = "パスワードは6文字以上にしてください";

      Alert.alert("エラー", msg);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSocialLoading(true);
      await signInWithGoogle();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error("Google Login Error:", error);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setSocialLoading(true);
      await signInWithApple();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error("Apple Login Error:", error);
    } finally {
      setSocialLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

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
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="ユーザー名"
                    placeholder="表示名を入力"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message} // エラー表示
                    autoCapitalize="none"
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="メールアドレス"
                  placeholder="example@woma.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message} // エラー表示
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="パスワード"
                  placeholder="6文字以上"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message} // エラー表示
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />

            {/* メインアクションボタン */}
            <Button
              title={isLoginMode ? 'ログイン' : '新規登録'}
              onPress={handleSubmit(onSubmit)} // handleSubmitでラップ
              loading={isSubmitting || socialLoading}
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
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />

              <Button
                title="Googleで続ける"
                variant="secondary"
                icon={<Ionicons name="logo-google" size={20} color="#DB4437" />}
                onPress={handleGoogleLogin}
                disabled={isSubmitting || socialLoading}
                textStyle={styles.googleButtonText}
              />
            </View>

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
  googleButtonText: { color: '#374151' },

  // 規約同意
  termsContainer: { marginTop: 12, alignItems: 'center' },
  termsText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  linkText: { color: '#3B82F6', fontWeight: 'bold' },
});