import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StyleSheet 
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router'; // ★重要: ルーターのインポート

export default function LoginScreen() {
  const router = useRouter(); // ★重要: ルーターの定義
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // 新規登録処理
  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert("エラー", "すべての項目を入力してください");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        bio: "",
        profileImageUrl: "",
        createdAt: serverTimestamp()
      });
      
      // ★修正: OKを押したら移動する設定
      Alert.alert("成功", "アカウントを作成しました！", [
        { text: "OK", onPress: () => router.replace('/(tabs)/home') }
      ]);

    } catch (err: any) {
      Alert.alert("登録エラー", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ログイン処理
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("エラー", "メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // ★修正: OKを押したら移動する設定
      Alert.alert("成功", "ログインしました！", [
        { text: "OK", onPress: () => router.replace('/(tabs)/home') }
      ]);

    } catch (err: any) {
      Alert.alert("ログインエラー", "メールアドレスかパスワードが間違っています");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <Text style={styles.title}>WOMA</Text>
          <Text style={styles.subtitle}>3日坊主を、肯定する。</Text>

          <View style={styles.formContainer}>
            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ユーザー名</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="例: なまけもの太郎"
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="hello@woma.jp"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity 
              onPress={isLoginMode ? handleSignIn : handleSignUp}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {loading ? '処理中...' : (isLoginMode ? 'ログイン' : '新規登録')}
              </Text>
            </TouchableOpacity>

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
  title: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', color: '#3B82F6', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6B7280', marginBottom: 40 },
  formContainer: { gap: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#4B5563', marginBottom: 4, fontWeight: 'bold' },
  input: { width: '100%', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  button: { width: '100%', backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, marginTop: 16 },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
  switchButton: { marginTop: 24 },
  switchText: { textAlign: 'center', color: '#3B82F6' }
});