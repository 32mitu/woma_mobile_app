# Layout Fix Walkthrough

## Changes Made

### Problem
iPhone SEでは画角が正しく表示されるが、最新のiPhoneやAndroid端末ではコンテンツがステータスバーやノッチに被ってしまう問題がありました。

### Root Cause
React Nativeのデフォルト`SafeAreaView`はiOSでのみ動作し、Androidでは適切に機能しません。また、ノッチやDynamic Islandを持つ最新デバイスに対しても不十分でした。

### Solution
`react-native-safe-area-context`ライブラリの`SafeAreaView`に切り替え、適切なエッジ設定を行いました。

## Modified Files

### [home.tsx](file:///c:/dev/woma-mobile/woma_ios/app/(tabs)/home.tsx)
- `SafeAreaView`のインポート元を`react-native-safe-area-context`に変更
- `edges={['top', 'left', 'right']}`を追加(下部はタブバーが管理)

### [profile.tsx](file:///c:/dev/woma-mobile/woma_ios/app/(tabs)/profile.tsx)
- `SafeAreaView`のインポート元を`react-native-safe-area-context`に変更
- `edges={['top', 'left', 'right']}`を追加

### [record.tsx](file:///c:/dev/woma-mobile/woma_ios/app/(tabs)/record.tsx)
- `SafeAreaView`のインポート元を`react-native-safe-area-context`に変更
- `edges={['top', 'left', 'right']}`を追加

## Testing Needed

以下の端末で動作確認が必要です:

1. **iPhone SE** - 既存の動作に影響がないか確認
2. **iPhone 14/15/16 (Pro含む)** - Dynamic Islandやノッチの下にコンテンツが正しく表示されるか
3. **Android端末** - ステータスバーの下にヘッダーが正しく表示されるか

### 確認ポイント
- ホーム画面の「WOMA」ヘッダーがステータスバー/ノッチに被っていないか
- プロフィール画面の上部コンテンツが正しく表示されるか
- 記録画面の「今日の記録」タイトルが見えるか
- タブバーの上に不要な余白がないか
