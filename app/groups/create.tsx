import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '../../src/features/groups/hooks/useGroups';
import { useAuth } from '../../src/features/auth/useAuth';

// 共通コンポーネント
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { IconButton } from '../../src/ui/IconButton';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { createGroup } = useGroups();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !desc.trim()) {
      Alert.alert('エラー', 'グループ名と説明を入力してください');
      return;
    }
    if (!userProfile) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    setSubmitting(true);
    try {
      await createGroup(name, desc, userProfile.uid);
      Alert.alert('完了', 'グループを作成しました！', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('エラー', '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Input
          label="グループ名"
          placeholder="例: 早起きチャレンジ部"
          value={name}
          onChangeText={setName}
          containerStyle={styles.inputGap}
        />

        <Input
          label="説明"
          placeholder="活動内容や目標などを記入"
          multiline
          numberOfLines={3}
          value={desc}
          onChangeText={setDesc}
          containerStyle={styles.inputGap}
        />

        <Button
          title="作成する"
          onPress={handleCreate}
          loading={submitting}
          variant="primary"
          style={styles.submitBtn}
        />
      </View>
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