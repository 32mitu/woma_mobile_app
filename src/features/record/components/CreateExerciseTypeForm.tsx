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
  // 初期値を少しマイルドな値（一般的な運動の平均くらい）に変更
  const [low, setLow] = useState('3.0');
  const [mid, setMid] = useState('5.0');
  const [high, setHigh] = useState('7.0');
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
      setLow('3.0'); setMid('5.0'); setHigh('7.0');
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
                placeholder="例: ヨガ、ボルダリング"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>強度設定 (METs)</Text>
            <Text style={styles.helperText}>
              消費カロリー計算に使われます。以下の目安を参考に設定してください。
            </Text>
            
            <View style={styles.metsRow}>
              <View style={styles.metsInput}>
                <Text style={styles.subLabel}>低 (楽)</Text>
                <TextInput 
                  style={styles.inputCenter} 
                  value={low} 
                  onChangeText={setLow} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={styles.metsInput}>
                <Text style={styles.subLabel}>中 (普通)</Text>
                <TextInput 
                  style={styles.inputCenter} 
                  value={mid} 
                  onChangeText={setMid} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={styles.metsInput}>
                <Text style={styles.subLabel}>高 (キツイ)</Text>
                <TextInput 
                  style={styles.inputCenter} 
                  value={high} 
                  onChangeText={setHigh} 
                  keyboardType="numeric" 
                />
              </View>
            </View>

            {/* ★ここがポイント: ユーザーが迷わないための目安表 */}
            <View style={styles.referenceBox}>
              <Text style={styles.refTitle}>📊 設定の目安</Text>
              <View style={styles.refRow}>
                <Text style={styles.refName}>🚶 ウォーキング</Text>
                <Text style={styles.refVal}>低2.5 / 中3.5 / 高5.0</Text>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refName}>💪 筋トレ</Text>
                <Text style={styles.refVal}>低3.0 / 中5.0 / 高6.0</Text>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refName}>🧘 ヨガ・ストレッチ</Text>
                <Text style={styles.refVal}>低2.0 / 中2.5 / 高3.0</Text>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refName}>🏃 ランニング</Text>
                <Text style={styles.refVal}>低6.0 / 中8.0 / 高10.0</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.disabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? '作成中...' : 'この内容で作成'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: 'white', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  closeBtn: { padding: 4 },
  form: { gap: 20 },
  inputGroup: { marginBottom: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#374151' },
  helperText: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  
  input: { 
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, 
    padding: 12, fontSize: 16, backgroundColor: '#F9FAFB' 
  },
  inputCenter: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, 
    padding: 12, fontSize: 16, backgroundColor: '#F9FAFB', textAlign: 'center'
  },
  
  metsRow: { flexDirection: 'row', gap: 12 },
  metsInput: { flex: 1 },
  subLabel: { textAlign: 'center', marginBottom: 6, fontWeight: '600', color: '#4B5563', fontSize: 13 },
  
  // 目安表のスタイル
  referenceBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  refTitle: { fontWeight: 'bold', color: '#1E40AF', marginBottom: 8, fontSize: 14 },
  refRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#DBEAFE', paddingBottom: 4 
  },
  refName: { fontSize: 12, color: '#1F2937', fontWeight: '500' },
  refVal: { fontSize: 12, color: '#4B5563' },

  submitBtn: { 
    backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginTop: 12,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2
  },
  disabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});