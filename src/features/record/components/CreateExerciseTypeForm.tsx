import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 修正: パスを components/ui から ui に変更
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';

type Props = {
  visible: boolean;
  onSubmit: (data: { name: string, low: number, mid: number, high: number }) => Promise<void>;
  onCancel: () => void;
};

export const CreateExerciseTypeForm = ({ visible, onSubmit, onCancel }: Props) => {
  const [name, setName] = useState('');
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
      setName('');
      setLow('3.0'); setMid('5.0'); setHigh('7.0');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>新しい運動を作成</Text>

            <Input
              label="運動名"
              placeholder="例: ヨガ, ボルダリング"
              value={name}
              onChangeText={setName}
              autoFocus
              containerStyle={{ marginBottom: 20 }}
            />

            <Text style={styles.sectionLabel}>強度別METs値</Text>
            <View style={styles.metsRow}>
              <View style={styles.metsCol}>
                <Input label="弱め" value={low} onChangeText={setLow} keyboardType="numeric" placeholder="3.0" />
              </View>
              <View style={styles.metsCol}>
                <Input label="普通" value={mid} onChangeText={setMid} keyboardType="numeric" placeholder="5.0" />
              </View>
              <View style={styles.metsCol}>
                <Input label="強め" value={high} onChangeText={setHigh} keyboardType="numeric" placeholder="7.0" />
              </View>
            </View>

            <View style={styles.referenceBox}>
              <Text style={styles.refTitle}>💡 METsの目安</Text>
              <View style={styles.refRow}><Text style={styles.refText}>散歩・ストレッチ</Text><Text style={styles.refVal}>2.5 〜 3.0</Text></View>
              <View style={styles.refRow}><Text style={styles.refText}>早歩き・自転車</Text><Text style={styles.refVal}>4.0 〜 5.0</Text></View>
              <View style={styles.refRow}><Text style={styles.refText}>ジョギング・筋トレ</Text><Text style={styles.refVal}>6.0 〜 7.0</Text></View>
              <View style={styles.refRow}><Text style={styles.refText}>ランニング・水泳</Text><Text style={styles.refVal}>8.0 〜 10.0</Text></View>
            </View>

            <View style={styles.buttonGroup}>
              <Button title="キャンセル" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
              <Button title="作成する" variant="primary" onPress={handleSubmit} loading={loading} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#1F2937' },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  metsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metsCol: { flex: 1 },
  referenceBox: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16,
    marginBottom: 30, borderWidth: 1, borderColor: '#DBEAFE'
  },
  refTitle: { fontWeight: 'bold', color: '#1E40AF', marginBottom: 8, fontSize: 14 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
  refText: { fontSize: 13, color: '#1F2937' },
  refVal: { fontSize: 13, fontWeight: 'bold', color: '#3B82F6' },
  buttonGroup: { flexDirection: 'row', gap: 16 },
});