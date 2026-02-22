import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
// 修正: srcフォルダまで戻るため ../ を4つにする
import { Card } from '../../../../ui/Card';
// 修正: 同じフォルダにあるため ./ に変更
import { DailyNutrition } from './useDailyNutrition';

interface NutritionChartProps {
    data: DailyNutrition;
}

export const NutritionChart: React.FC<NutritionChartProps> = ({ data }) => {
    const { t } = useTranslation();
    const { protein, fat, carbs } = data;

    // カロリー換算 (P:4kcal, F:9kcal, C:4kcal)
    const pCal = protein * 4;
    const fCal = fat * 9;
    const cCal = carbs * 4;
    const totalCal = pCal + fCal + cCal || 1; // 0除算防止

    // パーセンテージ計算
    const pPercent = Math.round((pCal / totalCal) * 100);
    const fPercent = Math.round((fCal / totalCal) * 100);
    const cPercent = Math.round((cCal / totalCal) * 100);

    // グラフ用データ
    const pieData = [
        { value: pPercent, color: '#FF6B6B', text: `${pPercent}%`, shiftTextX: -10 }, // Protein (赤)
        { value: fPercent, color: '#4ECDC4', text: `${fPercent}%`, shiftTextX: -10 }, // Fat (緑/青)
        { value: cPercent, color: '#FFE66D', text: `${cPercent}%`, shiftTextX: -10 }, // Carbs (黄)
    ];

    // データが空の場合のプレースホルダー
    const isEmpty = protein === 0 && fat === 0 && carbs === 0;
    const displayData = isEmpty
        ? [{ value: 100, color: '#E5E7EB', text: '' }]
        : pieData;

    return (
        <Card style={styles.container}>
            <Text style={styles.title}>{t('chart.pfcTitle')}</Text>

            <View style={styles.chartRow}>
                {/* ドーナツグラフ */}
                <View style={styles.chartWrapper}>
                    <PieChart
                        data={displayData}
                        donut
                        radius={70}
                        innerRadius={45}
                        showText={!isEmpty}
                        textColor="black"
                        textSize={12}
                        fontWeight="bold"
                        centerLabelComponent={() => (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.totalLabel}>{t('chart.intake')}</Text>
                                <Text style={styles.totalValue}>{data.calories}</Text>
                                <Text style={styles.totalUnit}>kcal</Text>
                            </View>
                        )}
                    />
                </View>

                {/* 凡例と詳細数値 */}
                <View style={styles.legendContainer}>
                    <LegendItem color="#FF6B6B" label={t('chart.protein')} value={`${protein}g`} sub={t('chart.proteinGoal')} />
                    <LegendItem color="#4ECDC4" label={t('chart.fat')} value={`${fat}g`} sub={t('chart.fatGoal')} />
                    <LegendItem color="#FFE66D" label={t('chart.carbs')} value={`${carbs}g`} sub={t('chart.carbsGoal')} />
                </View>
            </View>

            {/* 簡易アドバイス */}
            {!isEmpty && (
                <View style={styles.adviceBox}>
                    <Text style={styles.adviceText}>
                        {fPercent > 30 ? t('chart.adviceHighFat') :
                            pPercent < 13 ? t('chart.adviceLowProtein') :
                                t('chart.adviceGood')}
                    </Text>
                </View>
            )}
        </Card>
    );
};

const LegendItem = ({ color, label, value, sub }: { color: string, label: string, value: string, sub: string }) => (
    <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View>
            <Text style={styles.legendLabel}>{label}</Text>
            <Text style={styles.legendSub}>{sub}</Text>
        </View>
        <Text style={styles.legendValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { marginBottom: 16, padding: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#374151' },
    chartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chartWrapper: { alignItems: 'center', width: 150 },

    totalLabel: { fontSize: 12, color: '#666' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    totalUnit: { fontSize: 10, color: '#666' },

    legendContainer: { flex: 1, marginLeft: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    legendLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    legendSub: { fontSize: 10, color: '#9CA3AF' },
    legendValue: { marginLeft: 'auto', fontSize: 16, fontWeight: 'bold', color: '#374151' },

    adviceBox: { marginTop: 16, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
    adviceText: { fontSize: 13, color: '#4B5563', textAlign: 'center' }
});