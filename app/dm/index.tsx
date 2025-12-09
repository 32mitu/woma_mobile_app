import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
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

    // 自分のチャットルームをリアルタイム監視
    const q = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', userProfile.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms: any[] = [];
      
      const promises = snapshot.docs.map(async (roomDoc) => {
        const data = roomDoc.data();
        const partnerId = data.members.find((id: string) => id !== userProfile.uid);
        
        // ★ 未読数の取得 (自分のIDのキーを見る)
        const unreadCount = data.unreadCounts?.[userProfile.uid] || 0;

        // 相手の名前などはキャッシュ(memberInfo)から取るのが理想だが、
        // 今回は既存実装に合わせて都度取得（または仮置き）
        let partnerName = 'ユーザー';
        let partnerAvatar = null;
        
        try {
            // N+1回避のため、本来は chatRooms に memberInfo を持たせるべき
            const userSnap = await getDoc(doc(db, 'users', partnerId));
            if (userSnap.exists()) {
                const uData = userSnap.data();
                partnerName = uData.username;
                partnerAvatar = uData.profileImageUrl;
            }
        } catch(e) {}

        return {
          id: roomDoc.id,
          partnerId,
          partnerName,
          partnerAvatar,
          lastMessage: data.lastMessage,
          updatedAt: data.updatedAt?.toDate(),
          unreadCount, // ★追加
        };
      });

      const results = await Promise.all(promises);
      setChatRooms(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
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
            <Image 
              source={{ uri: item.partnerAvatar || 'https://via.placeholder.com/50' }} 
              style={styles.avatar} 
            />
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.partnerName}</Text>
                <Text style={styles.date}>
                  {item.updatedAt ? item.updatedAt.toLocaleDateString() : ''}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
                
                {/* ★ 未読バッジの表示 */}
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
  name: { fontWeight: 'bold', fontSize: 16 },
  date: { fontSize: 12, color: '#999' },
  message: { fontSize: 14, color: '#666', flex: 1 },
  
  // ★ バッジのスタイル
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  }
});