import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// 作成したJSONファイルをインポート
import ja from './locales/ja.json';
import en from './locales/en.json';

const resources = {
    ja: { translation: ja },
    en: { translation: en },
};

// 端末の言語設定を取得
const getLocales = Localization.getLocales();
const deviceLanguage = getLocales[0]?.languageCode === 'en' ? 'en' : 'ja';



i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3', // React Native用の必須設定
        resources,
        lng: deviceLanguage, // デフォルト言語を端末設定に合わせる
        fallbackLng: 'ja',   // 対応していない言語の場合は日本語を表示
        interpolation: {
            escapeValue: false, // ReactはXSS対策済みなのでfalseでOK
        },
        react: {
            useSuspense: false, // ★重要: Expo環境での言語切り替え時に、画面の再描画がブロックされるバグを防ぐ
        }
    });



export default i18n;