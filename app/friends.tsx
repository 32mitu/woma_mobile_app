import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendsListScreen } from '../src/features/social/components/FriendsListScreen';

// 共通コンポーネント
import { IconButton } from '../src/ui/IconButton';

export default function FriendsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    (params.type as 'following' | 'followers') || 'following'
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton
          name="arrow-back"
          size={24}
          color="#333"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>友達リスト</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            フォロー中
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            フォロワー
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FriendsListScreen type={activeTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { margin: 0 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
});