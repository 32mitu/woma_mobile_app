import React from 'react';
import { View, StyleSheet, Alert, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '../../src/features/groups/hooks/useGroups';
import { useAuth } from '../../src/features/auth/useAuth';

// React Hook Form & Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { groupCreateSchema, GroupCreateFormData } from '../../src/utils/validationSchemas';

// 共通コンポーネント
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { IconButton } from '../../src/ui/IconButton';
import { useTranslation } from 'react-i18next';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { createGroup } = useGroups();
  const { t } = useTranslation();

  // フォーム設定
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<GroupCreateFormData>({
    resolver: zodResolver(groupCreateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // 送信処理
  const onSubmit = async (data: GroupCreateFormData) => {
    if (!userProfile) {
      Alert.alert(t('common.error'), t('group.loginRequired'));
      return;
    }

    try {
      await createGroup(data.name, data.description || '', userProfile.uid);

      Alert.alert(t('group.createSuccess'), t('group.createSuccessMessage'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('group.createFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* キーボードで入力欄が隠れないように調整 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <IconButton
              name="close"
              size={24}
              color="#333"
              onPress={() => router.back()}
            />
            <Text style={styles.title}>{t('group.createTitle')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('group.nameLabel')}
                  placeholder={t('group.namePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  containerStyle={styles.inputGap}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('group.descLabel')}
                  placeholder={t('group.descPlaceholder')}
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                  containerStyle={styles.inputGap}
                />
              )}
            />

            <Button
              title={t('group.createButton')}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              variant="primary"
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20 },
  inputGap: { marginBottom: 24 },
  submitBtn: { marginTop: 16 },
});