import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupDetail } from '../../src/features/groups/hooks/useGroupDetail';
import { useAuth } from '../../src/features/auth/useAuth';
import { Timeline } from '../../src/features/timeline/components/Timeline';

// 共通コンポーネント
import { Button } from '../../src/ui/Button';
import { IconButton } from '../../src/ui/IconButton';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const groupId = Array.isArray(id) ? id[0] : id;

  const { group, isMember, loading, toggleJoin } = useGroupDetail(groupId, userProfile?.uid);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text>グループが見つかりません</Text>
      </View>
    );
  }

  // ヘッダー部分をコンポーネントとして定義
  const GroupHeader = () => (
    <View>
      <View style={styles.coverPlaceholder}>
        <Ionicons name="people" size={48} color="#9CA3AF" />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.members?.length || 0}人のメンバー</Text>
        <Text style={styles.description}>{group.description}</Text>

        <Button
          title={isMember ? "脱退する" : "参加する"}
          // 参加中は赤枠(dangerっぽいoutline)、未参加はPrimary
          variant={isMember ? "outline" : "primary"}
          onPress={() => {
            if (isMember) {
              Alert.alert("確認", "グループを脱退しますか？", [
                { text: "キャンセル", style: "cancel" },
                { text: "脱退する", style: "destructive", onPress: toggleJoin }
              ]);
            } else {
              toggleJoin();
            }
          }}
          // 脱退ボタンの場合は赤色にスタイル上書き
          style={isMember ? { borderColor: '#EF4444' } : undefined}
          textStyle={isMember ? { color: '#EF4444' } : undefined}
        />
      </View>

      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>タイムライン</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton
          name="arrow-back"
          size={24}
          color="#333"
          onPress={() => router.back()}
        />
        <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Timeline
        groupId={groupId}
        ListHeaderComponent={<GroupHeader />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 16, fontWeight: 'bold', maxWidth: '70%' },

  coverPlaceholder: {
    height: 150,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoSection: { padding: 20 },
  groupName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  memberCount: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 24 },

  timelineSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
    paddingTop: 20
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});