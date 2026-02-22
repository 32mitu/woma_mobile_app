import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../../src/store/uiStore';

// セクション区切り用のコンポーネント
const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-gray-500 text-sm font-bold uppercase mt-6 mb-2 px-4">
        {title}
    </Text>
);

// 設定項目用の行コンポーネント
const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    isSwitch = false,
    switchValue = false,
    onSwitchChange,
    accessibilityLabel
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
    accessibilityLabel?: string;
}) => (
    <TouchableOpacity
        onPress={isSwitch ? undefined : onPress}
        disabled={isSwitch}
        className="flex-row items-center bg-white px-4 py-4 border-b border-gray-100 active:bg-gray-50"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole={isSwitch ? 'switch' : 'button'}
    >
        <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-blue-50">
            <Ionicons name={icon} size={18} color="#3B82F6" />
        </View>
        <Text className="flex-1 text-base text-gray-800">
            {label}
        </Text>

        {isSwitch ? (
            <Switch
                value={switchValue}
                onValueChange={onSwitchChange}
                trackColor={{ false: '#767577', true: '#3B82F6' }}
                thumbColor={'#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
            />
        ) : (
            <View className="flex-row items-center">
                {value && <Text className="text-gray-400 mr-2">{value}</Text>}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        )}
    </TouchableOpacity>
);

export default function SettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { language, setLanguage } = useUiStore();

    // 通知設定（実際のバックエンド/ローカルDB保存ロジックに合わせて拡張してください）
    const [isNotifEnabled, setIsNotifEnabled] = useState(true);

    // 言語切り替えハンドラ
    const handleLanguageToggle = () => {
        const newLang = language === 'ja' ? 'en' : 'ja';
        setLanguage(newLang);
        i18n.changeLanguage(newLang);
    };

    const openTerms = () => {
        Linking.openURL('https://note.com/kumaotoko32/n/ned99f2c17b7c');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* ヘッダー */}
            <View className="bg-white px-4 py-3 flex-row items-center shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mr-4"
                    accessibilityLabel={t('accessibility.back')}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-800">
                    {t('settings.title')}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                {/* 外観・言語 */}
                <SectionHeader title={t('settings.general')} />
                <SettingRow
                    icon="language"
                    label={t('settings.language')}
                    value={language === 'ja' ? '日本語' : 'English'}
                    onPress={handleLanguageToggle}
                    accessibilityLabel="Change language"
                />

                {/* 通知・機能 */}
                <SectionHeader title={t('settings.notifications')} />
                <SettingRow
                    icon="notifications"
                    label={t('settings.pushNotification')}
                    isSwitch
                    switchValue={isNotifEnabled}
                    onSwitchChange={setIsNotifEnabled}
                    accessibilityLabel="Toggle push notifications"
                />

                {/* サポート */}
                <SectionHeader title={t('settings.support')} />
                <SettingRow
                    icon="document-text"
                    label={t('settings.terms')}
                    onPress={openTerms}
                    accessibilityLabel="Open terms of service"
                />
                <SettingRow
                    icon="shield-checkmark"
                    label={t('settings.privacy')}
                    onPress={openTerms} // 必要に応じてプライバシーポリシー用のURLに変更してください
                    accessibilityLabel="Open privacy policy"
                />

                {/* バージョン情報等 */}
                <View className="mt-8 items-center">
                    <Text className="text-gray-400 text-xs">Ver 1.1.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}