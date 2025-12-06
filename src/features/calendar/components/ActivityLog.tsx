import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Query } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';

type Props = {
  userId?: string;
  customQuery?: Query; // ★追加: 外部からクエリを受け取れるようにする
};

export const ActivityLog = ({ userId, customQuery }: Props) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // customQueryがあればそれを優先、なければデフォルト（全件）
    let q;
    if (customQuery) {
      q = customQuery;
    } else if (userId) {
      q = query(
        collection(db, 'exerciseRecords'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, customQuery]); // 依存配列に追加

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} color="#3B82F6" />;
  }

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>この日の記録はありません。</Text>
      </View>
    );
  }

  // --- (以下、renderItem などの表示ロジックは変更なし) ---
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

      {item.activities && item.activities.map((act: any, index: number) => (
        <View key={index} style={styles.activityRow}>
          <FontAwesome5 name="running" size={16} color="#4B5563" style={{ width: 24 }} />
          <Text style={styles.activityName}>{act.name}</Text>
          <Text style={styles.activityDetail}>
            {act.intensity}強度 / {act.duration}分
          </Text>
        </View>
      ))}

      {item.comment ? (
        <Text style={styles.comment}>"{item.comment}"</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* customQueryがある場合（カレンダー詳細）は見出しを変えるか隠す */}
      {!customQuery && <Text style={styles.sectionTitle}>最近の活動</Text>}
      
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (スタイルはそのまま維持)
  container: { marginTop: 10 }, // 少し調整
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#888', marginBottom: 4 },
  logCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  dateText: { fontWeight: 'bold', color: '#333' },
  timeText: { color: '#888', fontSize: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  activityName: { fontWeight: '600', marginRight: 8, color: '#374151' },
  activityDetail: { color: '#6B7280', fontSize: 12 },
  comment: { marginTop: 8, fontStyle: 'italic', color: '#666', fontSize: 13, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6 },
});