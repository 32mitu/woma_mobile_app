import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Keyboard } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserList } from '../src/features/social/components/UserList';
import { Post } from '../src/features/timeline/components/Post';

// 共通コンポーネント
import { IconButton } from '../src/ui/IconButton';
import { useTranslation } from 'react-i18next';

type SearchType = 'user' | 'tag';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialType = (params.type as SearchType) || 'user';
  const initialQuery = (params.q as string) || '';

  const [activeTab, setActiveTab] = useState<SearchType>(initialType);
  const [searchText, setSearchText] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, []);

  // タブ切り替え時に前の検索結果をクリア
  useEffect(() => {
    setResults([]);
  }, [activeTab]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    Keyboard.dismiss();
    setResults([]);

    try {
      let q;
      const text = searchText.trim();

      if (activeTab === 'user') {
        // クライアント側でフィルタリング：
        // Firestoreは部分一致・大文字小文字無視の検索が不得意なため、
        // 全ユーザーを取得してJS側でフィルタリングする
        q = query(
          collection(db, 'users'),
          limit(500)
        );
        const snapshot = await getDocs(q);
        const lowerText = text.toLowerCase();
        const data = snapshot.docs
          .map(doc => ({ uid: doc.id, id: doc.id, ...doc.data() }))
          .filter((user: any) => {
            const username = (user.username || '').toLowerCase();
            const displayName = (user.displayName || '').toLowerCase();
            return username.includes(lowerText) || displayName.includes(lowerText);
          });
        setResults(data);
      } else {
        q = query(
          collection(db, 'timeline'),
          where('text', '>=', `#${text}`),
          where('text', '<=', `#${text}` + '\uf8ff'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <IconButton
          name="arrow-back"
          size={24}
          color="#333"
          onPress={() => router.back()}
          style={styles.backButton}
        />

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder={activeTab === 'user' ? t('search.userPlaceholder') : t('search.tagPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* タブ */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'user' && styles.activeTabItem]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>{t('search.userTab')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tag' && styles.activeTabItem]}
          onPress={() => setActiveTab('tag')}
        >
          <Text style={[styles.tabText, activeTab === 'tag' && styles.activeTabText]}>{t('search.tagTab')}</Text>
        </TouchableOpacity>
      </View>

      {/* 結果表示 */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
        ) : (
          activeTab === 'user' ? (
            <UserList users={results} />
          ) : (
            <FlashList
              data={results}
              estimatedItemSize={150}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <Post post={item} />}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                results.length === 0 && !loading ? (
                  <Text style={styles.emptyText}>{t('search.noPostsFound')}</Text>
                ) : null
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { marginRight: 8 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#333' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
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
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9CA3AF',
  }
});