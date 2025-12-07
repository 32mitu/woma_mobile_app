import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroups } from '../../src/features/groups/hooks/useGroups';
import { useAuth } from '../../src/features/auth/useAuth';

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>グループ作成</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>グループ名</Text>
        <TextInput 
          style={styles.input} 
          placeholder="例: 朝活ランニング部" 
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>説明</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="活動内容や目標などを記入" 
          multiline
          numberOfLines={3}
          value={desc}
          onChangeText={setDesc}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, submitting && styles.disabled]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>作成する</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  disabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});