import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons'; // 運動アイコン用

type Props = {
  userId: string;
};

export const ActivityLog = ({ userId }: Props) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Firestoreから自分の記録を取得 (Web版と同じクエリ)
    const q = query(
      collection(db, 'exerciseRecords'), // ※ useRecordSaverで修正したコレクション名と一致させる
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // 日付変換 (Firestore Timestamp -> Date)
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} color="#3B82F6" />;
  }

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>まだ記録がありません。</Text>
        <Text style={styles.emptyText}>「記録」タブから運動を登録してみよう！</Text>
      </View>
    );
  }

  // リストの各アイテム (カード)
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.logCard}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>
          {item.createdAt.toLocaleDateString('ja-JP')}
        </Text>
        <Text style={styles.timeText}>
          {item.createdAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* 運動リスト */}
      {item.activities && item.activities.map((act: any, index: number) => (
        <View key={index} style={styles.activityRow}>
          <FontAwesome5 name="running" size={16} color="#4B5563" style={{ width: 24 }} />
          <Text style={styles.activityName}>{act.name}</Text>
          <Text style={styles.activityDetail}>
            {act.intensity}強度 / {act.duration}分
          </Text>
        </View>
      ))}

      {/* コメントがあれば表示 */}
      {item.comment ? (
        <Text style={styles.comment}>"{item.comment}"</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>最近の活動</Text>
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false} // 親のScrollViewに任せるためスクロール無効
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    marginBottom: 4,
  },
  logCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6', // アクセントカラー
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  dateText: {
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    color: '#888',
    fontSize: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityName: {
    fontWeight: '600',
    marginRight: 8,
    color: '#374151',
  },
  activityDetail: {
    color: '#6B7280',
    fontSize: 12,
  },
  comment: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
    fontSize: 13,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
  },
});