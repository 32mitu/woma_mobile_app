import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { Timeline } from '../../src/features/timeline/components/Timeline';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>WOMA</Text>
        
        <View style={styles.headerRight}>
          {/* グループボタン (追加) */}
          <TouchableOpacity onPress={() => router.push('/groups')} style={styles.iconButton}>
            <Ionicons name="people" size={24} color="#333" />
          </TouchableOpacity>
          
          {/* 検索ボタン */}
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <Timeline />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // アイコン同士の間隔
  },
  iconButton: {
    padding: 4, // タップ領域を少し広げる
  }
});