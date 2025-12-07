import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupDetail } from '../../src/features/groups/hooks/useGroupDetail';
import { useAuth } from '../../src/features/auth/useAuth';
import { Timeline } from '../../src/features/timeline/components/Timeline'; // ★追加

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const groupId = Array.isArray(id) ? id[0] : id;
  
  const { group, isMember, loading, toggleJoin } = useGroupDetail(groupId, userProfile?.uid);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  }

  if (!group) {
    return <View style={styles.center}><Text>グループが見つかりません</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.coverPlaceholder}>
          <Ionicons name="people" size={48} color="#9CA3AF" />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.memberCount}>{group.memberCount || 0}人のメンバー</Text>
          <Text style={styles.description}>{group.description}</Text>

          {userProfile ? (
            <TouchableOpacity 
              style={[styles.joinBtn, isMember ? styles.leaveBtn : styles.joinBtnActive]}
              onPress={toggleJoin}
            >
              <Text style={[styles.joinBtnText, isMember && styles.leaveBtnText]}>
                {isMember ? 'グループを抜ける' : 'グループに参加する'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.loginAlert}>参加するにはログインが必要です</Text>
          )}
        </View>
        
        {/* ★修正: メンバーならタイムラインを表示 */}
        {isMember && (
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <Text style={styles.sectionTitle}>グループの活動</Text>
            </View>
            {/* グループIDを渡して、このグループの投稿だけを表示 */}
            <Timeline groupId={groupId} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: 'bold', maxWidth: '70%' },
  content: { paddingBottom: 40 },
  coverPlaceholder: { height: 150, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 20 },
  groupName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  memberCount: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 24 },
  joinBtn: { padding: 14, borderRadius: 30, alignItems: 'center', borderWidth: 1 },
  joinBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  leaveBtn: { backgroundColor: 'white', borderColor: '#EF4444' },
  joinBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  leaveBtnText: { color: '#EF4444' },
  loginAlert: { textAlign: 'center', color: '#888' },
  
  // タイムライン周りのスタイル
  timelineSection: { borderTopWidth: 8, borderTopColor: '#F3F4F6' },
  timelineHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});