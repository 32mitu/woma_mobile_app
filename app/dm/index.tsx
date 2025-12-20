import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native'; // 標準のImageに戻す
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../src/features/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function ChatListScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', userProfile.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const promises = snapshot.docs.map(async (roomDoc) => {
        const data = roomDoc.data();
        const partnerId = data.members.find((id: string) => id !== userProfile.uid);
        const unreadCount = data.unreadCounts?.[userProfile.uid] || 0;

        let partnerName = 'ユーザー';
        let partnerAvatar = null;

        // キャッシュがあればそれを使う
        if (data.memberInfo && data.memberInfo[partnerId]) {
          const info = data.memberInfo[partnerId];
          partnerName = info.name;
          partnerAvatar = info.avatar;
        } else {
          try {
            const userSnap = await getDoc(doc(db, 'users', partnerId));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              partnerName = uData.username || 'ユーザー';
              partnerAvatar = uData.profileImageUrl;
            }
          } catch (e) {
            console.warn('ユーザー情報取得失敗', e);
          }
        }

        return {
          id: roomDoc.id,
          partnerId,
          partnerName,
          partnerAvatar,
          lastMessage: data.lastMessage,
          updatedAt: data.updatedAt?.toDate(),
          unreadCount,
        };
      });

      const results = await Promise.all(promises);
      setChatRooms(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#3B82F6" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item} 
            onPress={() => router.push(`/dm/${item.partnerId}`)}
          >
            {/* 標準のImageを使用 */}
            <Image 
              source={{ uri: item.partnerAvatar || 'https://via.placeholder.com/150' }} 
              style={styles.avatar}
            />
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>{item.partnerName}</Text>
                <Text style={styles.date}>
                  {item.updatedAt ? item.updatedAt.toLocaleDateString() : ''}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                  {item.lastMessage || '画像を送信しました'}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={{marginLeft: 8}} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" style={{ marginBottom: 10 }} />
            <Text style={{color: '#888'}}>メッセージはまだありません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', marginRight: 12 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontWeight: 'bold', fontSize: 16, color: '#333', maxWidth: '70%' },
  date: { fontSize: 12, color: '#999' },
  message: { fontSize: 14, color: '#666', flex: 1, marginRight: 8 },
  unreadMessage: { color: '#333', fontWeight: 'bold' },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 'auto',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});