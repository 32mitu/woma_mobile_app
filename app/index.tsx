import React, { useState, useEffect } from 'react';
import {
  View, Text, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator,
  Linking, TouchableOpacity, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/features/auth/useAuth';
import { useUiStore } from '../src/store/uiStore';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';

// React Hook Form & Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signupSchema, SignupFormData } from '../src/utils/validationSchemas';

// 共通コンポーネント
import { Button } from '../src/ui/Button';
import { Input } from '../src/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();

  // 言語設定用のStoreとi18nを取得
  const { language, setLanguage } = useUiStore();
  const { i18n } = useTranslation();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [socialLoading, setSocialLoading] = useState(false);

  // ドロップダウンメニューの開閉状態
  const [showLangMenu, setShowLangMenu] = useState(false);

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

  // 認証状態の監視と画面遷移
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading, router]);

  const openTerms = () => {
    Linking.openURL('https://note.com/kumaotoko32/n/ned99f2c17b7c?app_launch=false');
  };

  // 言語選択ハンドラ
  const selectLanguage = (lang: 'ja' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setShowLangMenu(false); // 選択後にメニューを閉じる
  };

  // フォーム送信ハンドラ (ログイン・登録共通)
  const onSubmit = async (data: SignupFormData) => {
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        router.replace('/(tabs)/home');
      } else {
        if (!data.username) return;

        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const newUser = userCredential.user;

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
    // 画面全体をタッチ可能にし、メニュー外タップで閉じるようにする
    <TouchableWithoutFeedback onPress={() => setShowLangMenu(false)}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

        {/* 右上のドロップダウン付き言語切り替えボタン */}
        <View style={styles.topBar}>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              onPress={() => setShowLangMenu(!showLangMenu)}
              style={styles.languageButton}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={18} color="#4B5563" />
              <Text style={styles.languageText}>{language === 'ja' ? '日本語' : 'English'}</Text>
              <Ionicons name={showLangMenu ? "chevron-up" : "chevron-down"} size={16} color="#4B5563" />
            </TouchableOpacity>

            {/* ドロップダウンメニュー */}
            {showLangMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => selectLanguage('ja')}
                >
                  <Text style={[styles.dropdownItemText, language === 'ja' && styles.activeDropdownItemText]}>
                    日本語
                  </Text>
                  {language === 'ja' && <Ionicons name="checkmark" size={16} color="#3B82F6" />}
                </TouchableOpacity>

                <View style={styles.dropdownDivider} />

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => selectLanguage('en')}
                >
                  <Text style={[styles.dropdownItemText, language === 'en' && styles.activeDropdownItemText]}>
                    English
                  </Text>
                  {language === 'en' && <Ionicons name="checkmark" size={16} color="#3B82F6" />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

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
                      error={errors.username?.message}
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
                    error={errors.email?.message}
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
                    error={errors.password?.message}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                )}
              />

              <Button
                title={isLoginMode ? 'ログイン' : '新規登録'}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || socialLoading}
                variant="primary"
                style={styles.mainButton}
              />

              {!isLoginMode && (
                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    登録することで、
                    <Text style={styles.linkText} onPress={openTerms}>利用規約</Text>
                    に同意したものとみなされます。
                  </Text>
                </View>
              )}

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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  // 右上の言語切り替えドロップダウン関連のスタイル
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 100, // ドロップダウンが他の要素の下に隠れないようにする
  },
  dropdownContainer: {
    position: 'relative',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44, // ボタンのすぐ下に配置
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8, // Android用の影
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeDropdownItemText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
  },

  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  headerSection: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#3B82F6', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },

  formContainer: { width: '100%' },

  mainButton: { marginTop: 8 },

  switchButton: { marginTop: 16 },
  switchText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },

  dividerContainer: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 24
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 16, color: '#9CA3AF', fontSize: 12 },

  socialButtonsContainer: { gap: 12 },
  appleButton: { width: '100%', height: 50 },
  googleButtonText: { color: '#374151' },

  termsContainer: { marginTop: 12, alignItems: 'center' },
  termsText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  linkText: { color: '#3B82F6', fontWeight: 'bold' },
});