import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
// ★ 作成した RecordForm コンポーネントを読み込む
import { RecordForm } from '../../src/features/record/components/Recordform'; 

export default function RecordScreen() {
  return (
    <SafeAreaView style={styles.container}>
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

