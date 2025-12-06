import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from "react-native-gifted-charts";

type Props = {
  exerciseRecords: any[];
  userWeight: number;
};

export const CalorieChart = ({ exerciseRecords, userWeight }: Props) => {
  // --- Web版の計算ロジックを移植 ---
  const calculateCalories = (records: any[], weight: number) => {
    if (!weight) return [];

    const caloriesByActivity: { [key: string]: number } = {};
    const oldMets: any = {
      running: { "低": 6, "中": 8, "高": 10 },
      walking: { "低": 3, "中": 4, "高": 5 },
      training: { "低": 3, "中": 5, "高": 8 }
    };

    records.forEach(record => {
      // 新データ形式 (activities配列)
      if (record.activities && record.activities.length > 0) {
        record.activities.forEach((activity: any) => {
          if (activity.duration > 0) {
            // METs値があれば使う、なければ0
            const metValue = activity.mets || 0;
            const durationHours = activity.duration / 60;
            const calories = metValue * durationHours * weight * 1.05;

            const name = activity.name || '不明';
            caloriesByActivity[name] = (caloriesByActivity[name] || 0) + calories;
          }
        });
      } 
      // 旧データ形式 (フォールバック)
      else {
        ['running', 'walking', 'training'].forEach(type => {
          if (record[type] && record[type].duration > 0) {
            const durationHours = record[type].duration / 60;
            // intensityが日本語キーになっている前提
            const intensity = record[type].intensity || '中'; 
            const metValue = oldMets[type]?.[intensity] || 3;
            const calories = metValue * durationHours * weight * 1.05;
            
            const nameMap: any = { running: 'ランニング', walking: 'ウォーキング', training: '筋トレ' };
            const name = nameMap[type];
            caloriesByActivity[name] = (caloriesByActivity[name] || 0) + calories;
          }
        });
      }
    });

    // グラフ用データ配列に変換
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return Object.keys(caloriesByActivity).map((key, index) => ({
      value: Math.round(caloriesByActivity[key]),
      text: `${Math.round(caloriesByActivity[key])}`,
      label: key, // 凡例用
      color: colors[index % colors.length],
    })).filter(item => item.value > 0);
  };

  const chartData = calculateCalories(exerciseRecords, userWeight);
  const totalCalories = chartData.reduce((sum, item) => sum + item.value, 0);

  // 凡例コンポーネント
  const renderLegend = () => {
    return (
      <View style={styles.legendContainer}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}: {item.value}kcal</Text>
          </View>
        ))}
      </View>
    );
  };

  if (totalCalories === 0) {
    return null; // データがなければ表示しない
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>消費カロリー内訳</Text>
      <View style={styles.chartWrapper}>
        <PieChart
          data={chartData}
          donut
          showText
          textColor="black"
          radius={80}
          innerRadius={50}
          textSize={10}
          centerLabelComponent={() => {
            return (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{totalCalories}</Text>
                <Text style={{ fontSize: 10 }}>kcal</Text>
              </View>
            );
          }}
        />
      </View>
      {renderLegend()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  chartWrapper: { alignItems: 'center', marginBottom: 16 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#555' },
});