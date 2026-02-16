import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

// 共通コンポーネント
import { Button } from '../../../src/ui/Button';
import { Input } from '../../../src/ui/Input';
import { Card } from '../../../src/ui/Card';
import { IconButton } from '../../../src/ui/IconButton';

type ChallengeType = 'steps' | 'calories' | 'distance';

export default function CreateChallengeScreen() {
    const router = useRouter();
    const { groupId } = useLocalSearchParams();

    const [type, setType] = useState<ChallengeType>('steps');
    const [target, setTarget] = useState('');
    const [durationDays, setDurationDays] = useState('7'); // デフォルト1週間
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!target || !durationDays) {
            Alert.alert('エラー', '目標値と期間を入力してください');
            return;
        }

        if (!groupId || typeof groupId !== 'string') {
            Alert.alert('エラー', 'グループ情報が取得できません');
            return;
        }

        setLoading(true);
        try {
            const targetNum = parseInt(target, 10);
            const days = parseInt(durationDays, 10);

            const startDate = new Date();
            // 時間を00:00:00に合わせる
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + days);
            // 終了日は23:59:59に合わせる
            endDate.setHours(23, 59, 59, 999);

            const challengeData = {
                type,
                target: targetNum,
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
                isActive: true,
            };

            // グループドキュメントを更新
            await updateDoc(doc(db, 'groups', groupId), {
                challenge: challengeData,
                updatedAt: serverTimestamp(),
            });

            Alert.alert('成功', 'チャレンジを作成しました！', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert('エラー', 'チャレンジの作成に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // タイプ選択ボタン
    const TypeSelector = ({ value, label, icon }: { value: ChallengeType, label: string, icon: string }) => (
        <TouchableOpacity
            style={[
                styles.typeCard,
                type === value && styles.typeCardSelected
            ]}
            onPress={() => setType(value)}
            activeOpacity={0.7}
        >
            <Text style={styles.typeIcon}>{icon}</Text>
            <Text style={[styles.typeLabel, type === value && styles.typeLabelSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton name="close" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>チャレンジ作成</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>1. 種目を選ぶ</Text>
                <View style={styles.typeContainer}>
                    <TypeSelector value="steps" label="歩数" icon="👟" />
                    <TypeSelector value="calories" label="カロリー" icon="🔥" />
                    <TypeSelector value="distance" label="距離" icon="📍" />
                </View>

                <Text style={styles.sectionTitle}>2. チーム目標を設定</Text>
                <Card padding="medium">
                    <Input
                        label={`目標の合計${type === 'steps' ? '歩数' : type === 'calories' ? 'カロリー' : '距離'}`}
                        value={target}
                        onChangeText={setTarget}
                        keyboardType="numeric"
                        placeholder={type === 'steps' ? "例: 100000" : "例: 5000"}
                        rightElement={<Text style={styles.unit}>{type === 'steps' ? '歩' : type === 'calories' ? 'kcal' : 'km'}</Text>}
                    />
                    <Text style={styles.hint}>
                        メンバー全員で達成する合計値を設定してください。
                    </Text>
                </Card>

                <Text style={styles.sectionTitle}>3. 期間</Text>
                <Card padding="medium">
                    <Input
                        label="チャレンジ期間 (日数)"
                        value={durationDays}
                        onChangeText={setDurationDays}
                        keyboardType="numeric"
                        placeholder="例: 7"
                        rightElement={<Text style={styles.unit}>日間</Text>}
                    />
                </Card>

            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="チャレンジを開始する"
                    onPress={handleCreate}
                    loading={loading}
                    disabled={loading}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 8, color: '#374151' },

    typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    typeCard: {
        width: '30%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    typeIcon: { fontSize: 24, marginBottom: 8 },
    typeLabel: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
    typeLabelSelected: { color: '#3B82F6' },

    unit: { color: '#6B7280', fontWeight: 'bold' },
    hint: { fontSize: 12, color: '#6B7280', marginTop: 8 },

    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    }
});