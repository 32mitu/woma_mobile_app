import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, FlatList, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, limit, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserList } from '../src/features/social/components/UserList';
import { Post } from '../src/features/timeline/components/Post'; // 先ほど作成したPostコンポーネント

type SearchType = 'user' | 'tag';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // URLパラメータがあれば初期値を設定 (例: #タグタップ時)
  const initialType = (params.type as SearchType) || 'user';
  const initialQuery = (params.q as string) || '';

  const [activeTab, setActiveTab] = useState<SearchType>(initialType);
  const [searchText, setSearchText] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 画面ロード時にパラメータがあれば自動検索
  useEffect(() => {
    if (initialQuery && initialType === 'tag') {
      handleSearch(initialQuery, initialType);
    }
  }, []);

  const handleSearch = async (text: string = searchText, type: SearchType = activeTab) => {
    if (!text.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResults([]);

    try {
      if (type === 'user') {
        // --- ユーザー検索 (既存ロジック) ---
        const usersRef = collection(db, 'users');
        // Firestoreは部分一致検索が苦手なため、クライアントサイドフィルタリングまたは
        // 前方一致検索 (text ~ text + '\uf8ff') を使うのが一般的ですが、今回は取得してフィルタする方式を維持
        const q = query(usersRef, limit(50));
        const snapshot = await getDocs(q);
        
        const searchLower = text.toLowerCase();
        const filteredUsers = snapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() } as any))
          .filter(user => {
            const name = user.username?.toLowerCase() || '';
            const display = user.displayName?.toLowerCase() || '';
            return name.includes(searchLower) || display.includes(searchLower);
          });
          
        setResults(filteredUsers);

      } else {
        // --- タグ検索 (Web版 TagPage.jsx の移植) ---
        // 入力値に#がなければ付与する
        const tag = text.trim().startsWith('#') ? text.trim() : `#${text.trim()}`;
        
        const timelineRef = collection(db, 'timeline');
        const q = query(
          timelineRef,
          where("hashtags", "array-contains", tag), // 配列内にタグが含まれるか
          orderBy("createdAt", "desc"),
          limit(20)
        );

        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Timestamp変換はPostコンポーネント内で行うためそのまま渡すか、ここで整形
          timestamp: doc.data().createdAt
        }));
        
        setResults(posts);
      }

    } catch (error) {
      console.error("検索エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー検索バー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder={activeTab === 'user' ? "ユーザーを検索..." : "タグを検索 (例: 筋トレ)"}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* タブ切り替え */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'user' && styles.activeTab]} 
          onPress={() => { setActiveTab('user'); setResults([]); }}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>ユーザー</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tag' && styles.activeTab]} 
          onPress={() => { setActiveTab('tag'); setResults([]); }}
        >
          <Text style={[styles.tabText, activeTab === 'tag' && styles.activeTabText]}>ハッシュタグ</Text>
        </TouchableOpacity>
      </View>

      {/* 結果表示 */}
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.content}>
          {activeTab === 'user' ? (
            <UserList users={results} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <Post post={item} />} // Postコンポーネントを再利用
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                results.length === 0 && !loading ? (
                  <Text style={styles.emptyText}>投稿が見つかりませんでした</Text>
                ) : null
              }
            />
          )}
        </View>
      )}
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
  backButton: { marginRight: 12, padding: 4 },
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
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: '#3B82F6' },
  
  content: { flex: 1 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
});