import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { ListItem } from '../../../ui/ListItem';

type Props = {
  group: any;
};

export const GroupCard = ({ group }: Props) => {
  const router = useRouter();
  const { t } = useTranslation();
  // 初期値はドキュメントの数字、その後リアルタイム取得した数字に書き換える
  const [memberCount, setMemberCount] = useState(group.memberCount || 0);

  useEffect(() => {
    // このカードのグループIDに紐づくメンバー数をリアルタイム監視
    const q = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', group.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemberCount(snapshot.size); // 実際のデータ数で上書き
    });

    return () => unsubscribe();
  }, [group.id]);

  return (
    <Card padding="none" style={styles.cardContainer}>
      <ListItem
        title={group.name}
        subtitle={`${t('group.memberCount', { count: memberCount })}${group.description ? ` • ${group.description}` : ''}`}
        leftElement={
          <View style={styles.iconPlaceholder}>
            <Ionicons name="people" size={24} color="#3B82F6" />
          </View>
        }
        onPress={() => router.push(`/groups/${group.id}`)}
        showChevron
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    overflow: 'hidden', // Cardの角丸に合わせてListItemをクリッピング
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF', // 薄い青背景
    justifyContent: 'center',
    alignItems: 'center',
  },
});