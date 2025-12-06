import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onSubmit: (data: { name: string, low: number, mid: number, high: number }) => Promise<void>;
  onCancel: () => void;
};

export const CreateExerciseTypeForm = ({ visible, onSubmit, onCancel }: Props) => {
  const [name, setName] = useState('');
  const [low, setLow] = useState('3');
  const [mid, setMid] = useState('5');
  const [high, setHigh] = useState('8');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('運動名を入力してください');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name,
        low: Number(low),
        mid: Number(mid),
        high: Number(high)
      });
      // フォームリセット
      setName('');
      setLow('3'); setMid('5'); setHigh('8');
    } catch (error) {
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>新しい運動を作成</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>運動名</Text>
              <TextInput
                style={styles.input}
                placeholder="例: ボルダリング"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.label}>運動強度 (METs)</Text>
            <Text style={styles.helperText}>※不明な場合はデフォルトのままでOKです</Text>
            
            <View style={styles.metsRow}>
              <View style={styles.metsInput}>
                <Text style={styles.subLabel}>低</Text>
                <TextInput style={styles.input} value={low} onChangeText={setLow} keyboardType="numeric" />
              </View>
              <View style={styles.metsInput}>
                <Text style={styles.subLabel}>中</Text>
                <TextInput style={styles.input} value={mid} onChangeText={setMid} keyboardType="numeric" />
              </View>
              <View style={styles.metsInput}>
                <Text style={styles.subLabel}>高</Text>
                <TextInput style={styles.input} value={high} onChangeText={setHigh} keyboardType="numeric" />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.disabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? '作成中...' : '作成する'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: 'white', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  form: { gap: 20 },
  inputGroup: { marginBottom: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  helperText: { fontSize: 12, color: '#666', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  metsRow: { flexDirection: 'row', gap: 10 },
  metsInput: { flex: 1 },
  subLabel: { textAlign: 'center', marginBottom: 4, fontWeight: '600' },
  submitBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  disabled: { backgroundColor: '#ccc' },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});