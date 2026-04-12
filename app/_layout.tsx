import 'react-native-get-random-values';
import '../src/i18n'; // 1. ★重要: 翻訳設定の読み込み
import i18n from '../src/i18n'; // ★追加: i18nの本体をインポート
import '../global.css'; // Tailwind CSSなどのスタイル適用

import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message'; // 追加: トースト通知
import { GlobalErrorBoundary } from '../src/ui/GlobalErrorBoundary'; // 追加: エラーハンドリング
import * as SplashScreen from 'expo-splash-screen'; // ★追加: スプラッシュスクリーンの制御

import { useAuth } from '../src/features/auth/useAuth';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { I18nextProvider } from 'react-i18next'; // ★追加: Providerをインポート
import { useUiStore } from '../src/store/uiStore';

// 開発中の不要なログを無視する場合（任意）
LogBox.ignoreLogs(['@firebase/auth']);

// データの準備ができるまでスプラッシュスクリーンを自動で隠さない
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 認証状態の監視（初期化のため呼び出し）
  const { user } = useAuth();

  // プッシュ通知設定用のフック（uid を渡してトークン登録も有効化）
  const { registerForPushNotificationsAsync, scheduleDailyReminder } = usePushNotifications(user?.uid, true);

  // Zustand ストアから状態を取得
  const { language, _hasHydrated } = useUiStore();
  const [isI18nReady, setIsI18nReady] = useState(false); // i18nの準備状態を管理

  // Zustandのストレージ読み込みと言語の同期を確実に行う
  useEffect(() => {

    const initLanguage = async () => {
      if (_hasHydrated) {
        if (language && i18n.language !== language) {
          console.log(`⏳ [RootLayout] i18nの言語をZustandの保存データに同期させます: ${language}`);
          await i18n.changeLanguage(language); // 言語の切り替えを完全に待つ
        }
        setIsI18nReady(true);
        SplashScreen.hideAsync(); // 完全に準備ができてからスプラッシュを消す
      }
    };
    initLanguage();
  }, [_hasHydrated, language]);

  useEffect(() => {
    // registerForPushNotificationsAsync は usePushNotifications 内の useEffect で
    // shouldRegister=true のとき自動実行されるため、ここでは呼ばない（二重登録防止）
    scheduleDailyReminder();
  }, []);

  // データの準備が完全に終わるまでは画面を描画しない
  if (!_hasHydrated || !isI18nReady) {
    return null;
  }

  return (
    // アプリ全体を GlobalErrorBoundary で囲む
    <GlobalErrorBoundary>
      {/* アプリ全体を I18nextProvider で囲み、言語の変更を「すべての画面」に行き渡らせる */}
      <I18nextProvider i18n={i18n}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* ログイン・登録画面 (index) */}
          <Stack.Screen name="index" />

          {/* タブ画面 (メイン) */}
          <Stack.Screen name="(tabs)" />

          {/* 各種詳細画面 */}
          <Stack.Screen name="search" />
          <Stack.Screen name="public/[uid]" />
          <Stack.Screen name="dm" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="groups" />
          <Stack.Screen name="profile" />
        </Stack>

        {/* Toast コンポーネントを最下部に配置 */}
        <Toast />
      </I18nextProvider>
    </GlobalErrorBoundary>
  );
}