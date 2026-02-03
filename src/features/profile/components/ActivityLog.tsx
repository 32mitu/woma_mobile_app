import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { Card } from '../../../ui/Card';

type Props = {
  userId: string;
};

export const ActivityLog = ({ userId }: Props) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'exerciseRecords'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

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
  }, [userId]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} />;
  }

  const renderItem = ({ item }: { item: any }) => {
    const dateStr = `${item.createdAt.getMonth() + 1}/${item.createdAt.getDate()}`;

    return (
      <Card style={styles.logCard}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        {item.activities && item.activities.map((act: any, idx: number) => (
          <View key={idx} style={styles.activityRow}>
            <Text style={styles.activityName}>・{act.name}</Text>
            <Text style={styles.activityDetail}>
              {act.duration > 0 ? `${act.duration}分` : `${act.steps}歩`}
            </Text>
          </View>
        ))}

        {item.comment ? (
          <Text style={styles.comment}>📝 {item.comment}</Text>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>最近の活動</Text>

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          </View>
        }
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
  },
  logCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  dateHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 4,
  },
  dateText: {
    fontWeight: 'bold',
    color: '#3B82F6',
    fontSize: 16,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  activityDetail: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  comment: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});