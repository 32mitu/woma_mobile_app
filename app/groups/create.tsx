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

export default function CreateGroupScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { createGroup } = useGroups();

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
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    try {
      // useGroupsフックのcreateGroupを呼び出す
      // ※スキーマ定義の description と、createGroupの引数(desc)を合わせる
      await createGroup(data.name, data.description || '', userProfile.uid);

      Alert.alert('完了', 'グループを作成しました！', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '作成に失敗しました');
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
            <Text style={styles.title}>グループ作成</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="グループ名"
                  placeholder="例: 早起きチャレンジ部"
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
                  label="説明"
                  placeholder="活動内容や目標などを記入"
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
              title="作成する"
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