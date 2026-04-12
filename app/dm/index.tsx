import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../src/features/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';

// 共通コンポーネント
import { ListItem } from '../../src/ui/ListItem';
import { Avatar } from '../../src/ui/Avatar';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';

export default function ChatListScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // ユーザー情報のメモリキャッシュ
  const userCache = useRef<{ [key: string]: { name: string, avatar: string | null } }>({});
  // 連続スナップショット発火時の競合防止用バージョンカウンター
  const snapshotVersion = useRef(0);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', userProfile.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // このスナップショットのバージョンを記録（後から古い結果が上書きするのを防ぐ）
      const version = ++snapshotVersion.current;

      (async () => {
        const promises = snapshot.docs.map(async (roomDoc) => {
          const data = roomDoc.data();
          const partnerId = data.members.find((id: string) => id !== userProfile.uid);

          let partnerName = 'Unknown';
          let partnerAvatar = null;

          if (partnerId) {
            if (userCache.current[partnerId]) {
              const cached = userCache.current[partnerId];
              partnerName = cached.name;
              partnerAvatar = cached.avatar;
            } else {
              // キャッシュになければ取得
              try {
                const userSnap = await getDoc(doc(db, 'users', partnerId));
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  partnerName = userData.username || userData.displayName || t('dm.noName');
                  partnerAvatar = userData.profileImageUrl || userData.photoURL || null;
                  // キャッシュ保存
                  userCache.current[partnerId] = { name: partnerName, avatar: partnerAvatar };
                }
              } catch (e) {
                console.error(e);
              }
            }
          }

          return {
            id: roomDoc.id,
            partnerId,
            partnerName,
            partnerAvatar,
            lastMessage: data.lastMessage || '',
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            unreadCount: data.unreadCounts?.[userProfile.uid] || 0,
          };
        });

        const results = await Promise.all(promises);
        // 最新のスナップショット分のみ反映（古い Promise.all が後から完了しても無視）
        if (version === snapshotVersion.current) {
          setChatRooms(results);
          setLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const renderItem = ({ item }: { item: any }) => {
    const timeAgo = getTimeString(item.updatedAt);
    // 既存データ（日本語の画像送信メッセージ）も含め、📷 を含む場合は翻訳キーを使用
    const subtitleText = !item.lastMessage || item.lastMessage.includes('📷')
      ? t('dm.imagesSent')
      : item.lastMessage;

    return (
      <ListItem
        title={item.partnerName}
        subtitle={subtitleText}
        leftElement={
          <Avatar
            uri={item.partnerAvatar}
            size="md"
          />
        }
        rightElement={
          <View style={styles.rightContent}>
            <Text style={styles.date}>{timeAgo}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        }
        showChevron
        onPress={() => router.push(`/dm/${item.partnerId}`)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" style={{ marginBottom: 12 }} />
            {/* ★ ここを修正して追加の案内テキストとスタイルを適用しました */}
            <Text style={styles.emptyTextTitle}>{t('dm.noMessages')}</Text>
            <Text style={styles.emptyTextSub}>{t('dm.followToMessage')}</Text>
          </View>
        }
      />
    </View>
  );
}

// 時間表示のヘルパー関数
function getTimeString(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diff < day) {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else if (diff < 7 * day) {
    return i18n.t('dm.daysAgo', { count: Math.floor(diff / day) });
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  rightContent: { alignItems: 'flex-end', justifyContent: 'center' },
  date: { fontSize: 12, color: '#999', marginBottom: 4 },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  // ★ ここに追加のスタイルを定義しました
  emptyTextTitle: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyTextSub: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  }
});