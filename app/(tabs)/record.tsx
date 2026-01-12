import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// ★ 作成した RecordForm コンポーネントを読み込む
import { RecordForm } from '../../src/features/record/components/Recordform';

export default function RecordScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ここにフォームを表示！ */}
      <RecordForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
});

