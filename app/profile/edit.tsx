import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileEditForm } from '../../src/features/profile/components/ProfileEditForm';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { IconButton } from '../../src/ui/IconButton';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        {/* 閉じるボタンを共通コンポーネントに置き換え */}
        <IconButton
          name="close"
          size={24}
          color="#333"
          onPress={() => router.back()}
        />

        <Text style={styles.title}>{t('profile.editProfile', 'プロフィール編集')}</Text>

        {/* レイアウト調整用ダミー (閉じるボタンと同じ幅) */}
        <View style={{ width: 32 }} />
      </View>

      <ProfileEditForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
});