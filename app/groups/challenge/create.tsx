import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Button } from '../../../src/ui/Button';
import { Input } from '../../../src/ui/Input';
import { Card } from '../../../src/ui/Card';
import { IconButton } from '../../../src/ui/IconButton';

type ChallengeType = 'steps' | 'calories' | 'distance';

export default function CreateChallengeScreen() {
    const router = useRouter();
    const { groupId } = useLocalSearchParams();
    const { t } = useTranslation();

    const [type, setType] = useState<ChallengeType>('steps');
    const [target, setTarget] = useState('');
    const [durationDays, setDurationDays] = useState('7'); // デフォルト1週間
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!target || !durationDays) {
            Alert.alert(t('common.error'), t('group.challenge.errorInputRequired'));
            return;
        }

        if (!groupId || typeof groupId !== 'string') {
            Alert.alert(t('common.error'), t('group.challenge.errorGroupRequired'));
            return;
        }

        const targetNum = parseInt(target, 10);
        const days = parseInt(durationDays, 10);

        if (isNaN(targetNum) || targetNum <= 0) {
            Alert.alert(t('common.error'), t('validation.invalidNumber'));
            return;
        }
        if (isNaN(days) || days <= 0 || days > 365) {
            Alert.alert(t('common.error'), t('group.challenge.errorInputRequired'));
            return;
        }

        setLoading(true);
        try {

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

            Alert.alert(t('common.success'), t('group.challenge.successMessage'), [
                { text: t('common.ok'), onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('group.challenge.errorFailed'));
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
                <Text style={styles.headerTitle}>{t('group.challenge.createTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>{t('group.challenge.step1')}</Text>
                <View style={styles.typeContainer}>
                    <TypeSelector value="steps" label={t('group.challenge.steps')} icon="👟" />
                    <TypeSelector value="calories" label={t('group.challenge.calories')} icon="🔥" />
                    <TypeSelector value="distance" label={t('group.challenge.distance')} icon="📍" />
                </View>

                <Text style={styles.sectionTitle}>{t('group.challenge.step2')}</Text>
                <Card padding="medium">
                    <Input
                        label={t('group.challenge.goalLabel', { unit: type === 'steps' ? t('group.challenge.steps') : type === 'calories' ? 'kcal' : 'km' })}
                        value={target}
                        onChangeText={setTarget}
                        keyboardType="numeric"
                        placeholder={type === 'steps' ? t('group.challenge.goalPlaceholderSteps') : t('group.challenge.goalPlaceholderOther')}
                        rightElement={<Text style={styles.unit}>{type === 'steps' ? t('group.challenge.steps') : type === 'calories' ? 'kcal' : 'km'}</Text>}
                    />
                    <Text style={styles.hint}>{t('group.challenge.goalHint')}</Text>
                </Card>

                <Text style={styles.sectionTitle}>{t('group.challenge.step3')}</Text>
                <Card padding="medium">
                    <Input
                        label={t('group.challenge.durationLabel')}
                        value={durationDays}
                        onChangeText={setDurationDays}
                        keyboardType="numeric"
                        placeholder={t('group.challenge.durationPlaceholder')}
                        rightElement={<Text style={styles.unit}>{t('group.challenge.durationUnit')}</Text>}
                    />
                </Card>

            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title={t('group.challenge.startButton')}
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