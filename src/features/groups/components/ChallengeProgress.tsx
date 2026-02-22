import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../ui/Card'; // 共通コンポーネント
import { Badge } from '../../../ui/Badge'; // 共通コンポーネント
import { Challenge } from '../../../types';

type Props = {
    challenge: Challenge;
    currentValue: number; // 集計された現在値
};

export const ChallengeProgress = ({ challenge, currentValue }: Props) => {
    const { t } = useTranslation();
    // 進捗率の計算 (0〜100%)
    const progressRate = Math.min(Math.max(currentValue / challenge.target, 0), 1);
    const percent = Math.floor(progressRate * 100);
    const remaining = Math.max(challenge.target - currentValue, 0);

    // タイプごとの単位とアイコン設定
    const getMeta = () => {
        switch (challenge.type) {
            case 'steps': return { unit: t('group.challenge.steps'), icon: '👟', label: t('group.challenge.progressLabel', { label: t('group.challenge.steps') }) };
            case 'calories': return { unit: 'kcal', icon: '🔥', label: t('group.challenge.progressLabel', { label: t('group.challenge.calories') }) };
            case 'distance': return { unit: 'km', icon: '📍', label: t('group.challenge.progressLabel', { label: t('group.challenge.distance') }) };
            default: return { unit: '', icon: '🎯', label: t('group.challenge.progressLabel', { label: t('group.challenge.progressLabel', { label: '' }) }) };
        }
    };
    const { unit, icon, label } = getMeta();

    return (
        <Card style={styles.container}>
            {/* ヘッダー: タイトルと残りバッジ */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.title}>{label}</Text>
                </View>
                <Badge
                    label={percent >= 100 ? t('group.challenge.achieved') : t('group.challenge.remaining', { remaining: remaining.toLocaleString(), unit })}
                    color={percent >= 100 ? "success" : "primary"}
                    variant="default"
                    size="sm"
                />
            </View>

            {/* 数値表示 */}
            <View style={styles.statsRow}>
                <Text style={styles.current}>
                    {currentValue.toLocaleString()}
                    <Text style={styles.unit}> {unit}</Text>
                </Text>
                <Text style={styles.separator}>/</Text>
                <Text style={styles.target}>
                    {challenge.target.toLocaleString()}
                </Text>
            </View>

            {/* プログレスバー */}
            <View style={styles.progressBarBg}>
                <View
                    style={[
                        styles.progressBarFill,
                        {
                            width: `${percent}%`,
                            backgroundColor: percent >= 100 ? '#10B981' : '#3B82F6'
                        }
                    ]}
                />
            </View>

            {/* 期間表示 */}
            <Text style={styles.dateInfo}>
                {t('group.challenge.period', {
                    start: challenge.startDate.toDate().toLocaleDateString(),
                    end: challenge.endDate.toDate().toLocaleDateString()
                })}
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, marginBottom: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    icon: { fontSize: 20, marginRight: 8 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    statsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
    current: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    unit: { fontSize: 14, fontWeight: 'normal', color: '#6B7280' },
    separator: { fontSize: 16, color: '#9CA3AF', marginHorizontal: 4 },
    target: { fontSize: 16, color: '#6B7280' },
    progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', borderRadius: 4 },
    dateInfo: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
});