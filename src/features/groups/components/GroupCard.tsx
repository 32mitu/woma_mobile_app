import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // ★追加
import { db } from '../../../../firebaseConfig'; // ★追加

type Props = {
  group: any;
};

export const GroupCard = ({ group }: Props) => {
  const router = useRouter();
  // 初期値はドキュメントの数字、その後リアルタイム取得した数字に書き換える
  const [memberCount, setMemberCount] = useState(group.memberCount || 0);

  useEffect(() => {
    // ★追加: このカードのグループIDに紐づくメンバー数をリアルタイム監視
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
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/groups/${group.id}`)}
    >
      <View style={styles.iconPlaceholder}>
        <Ionicons name="people" size={24} color="#3B82F6" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{group.description}</Text>
        {/* ★修正: stateのmemberCountを表示 */}
        <Text style={styles.members}>{memberCount}人のメンバー</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 12, color: '#666', marginBottom: 4 },
  members: { fontSize: 12, color: '#9CA3AF' },
});