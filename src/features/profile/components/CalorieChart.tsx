import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from "react-native-gifted-charts";
import { Card } from '../../../ui/Card';

type Props = {
  exerciseRecords: any[];
  userWeight: number;
};

export const CalorieChart = ({ exerciseRecords, userWeight }: Props) => {
  const calculateCalories = (records: any[], weight: number) => {
    if (!weight) return [];

    const caloriesByActivity: { [key: string]: number } = {};
    const oldMets: any = {
      running: { "低": 6, "中": 8, "高": 10 },
      walking: { "低": 3, "中": 4, "高": 5 },
      training: { "低": 3, "中": 5, "高": 8 }
    };

    records.forEach(record => {
      if (record.activities && record.activities.length > 0) {
        record.activities.forEach((activity: any) => {
          let durationHours = 0;
          if (activity.duration > 0) {
            durationHours = activity.duration / 60;
          } else if (activity.steps > 0) {
            durationHours = (activity.steps * 0.0008) / 4;
          }
          const mets = Number(activity.mets || 3);
          const cal = mets * weight * durationHours * 1.05;
          if (cal > 0) {
            const name = activity.name || 'その他';
            caloriesByActivity[name] = (caloriesByActivity[name] || 0) + cal;
          }
        });
      } else if (record.type) {
        // 旧データ形式対応
        let durationHours = record.duration / 60;
        const typeMets = oldMets[record.type] || { "中": 3 };
        const mets = typeMets[record.intensity || "中"] || 3;
        const cal = mets * weight * durationHours * 1.05;
        if (cal > 0) {
          const name = record.type;
          caloriesByActivity[name] = (caloriesByActivity[name] || 0) + cal;
        }
      }
    });

    const total = Object.values(caloriesByActivity).reduce((a, b) => a + b, 0);
    const chartData = Object.keys(caloriesByActivity).map((key, index) => ({
      value: caloriesByActivity[key],
      text: `${Math.round((caloriesByActivity[key] / total) * 100)}%`,
      color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
      name: key,
    }));

    return chartData.filter(d => d.value > 0);
  };

  const chartData = calculateCalories(exerciseRecords, userWeight);
  const totalCalories = Math.round(chartData.reduce((acc, cur) => acc + cur.value, 0));

  const renderLegend = () => {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
        {chartData.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 6 }} />
            <Text style={{ color: '#666', fontSize: 12 }}>{item.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (totalCalories === 0) {
    return null;
  }

  return (
    <Card style={styles.container}>
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
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  chartWrapper: { alignItems: 'center' },
});