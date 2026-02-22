import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Query } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
// 共通コンポーネント
import { Card } from '../../../ui/Card';

type Props = {
  userId?: string;
  customQuery?: Query;
};

const ActivityLogComponent = ({ userId, customQuery }: Props) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
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
  }, [userId, customQuery]);

  // renderItemのメモ化
  const renderItem = useCallback(({ item }: { item: any }) => {
    const dayNames = i18n.language === 'ja'
      ? ['日', '月', '火', '水', '木', '金', '土']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateStr = `${item.createdAt.getMonth() + 1}/${item.createdAt.getDate()} (${dayNames[item.createdAt.getDay()]})`;

    return (
      <Card style={styles.logCard}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        {item.activities && item.activities.map((act: any, idx: number) => (
          <View key={idx} style={styles.activityRow}>
            <Text style={styles.activityName}>・{act.name}</Text>
            <Text style={styles.activityDetail}>
              {act.duration > 0 ? t('activityLog.minutes', { count: act.duration }) : t('activityLog.steps', { count: act.steps })}
            </Text>
          </View>
        ))}

        {item.comment ? (
          <Text style={styles.comment}>📝 {item.comment}</Text>
        ) : null}
      </Card>
    );
  }, [i18n.language, t]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} color="#3B82F6" />;
  }

  return (
    <View style={styles.container}>
      {!customQuery && <Text style={styles.sectionTitle}>{t('activityLog.recentActivity')}</Text>}

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false} // 親がScrollViewの場合はfalseでOK
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('activityLog.noRecords')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#888', marginBottom: 4 },
  logCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  dateText: { fontWeight: 'bold', color: '#3B82F6', fontSize: 16 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  activityName: { fontSize: 14, color: '#333', flex: 1 },
  activityDetail: { fontSize: 14, color: '#666', fontWeight: '500' },
  comment: { fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },
});

export const ActivityLog = memo(ActivityLogComponent);