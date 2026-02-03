import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Card } from '../../../ui/Card';

type Props = {
  records: any[];
};

export const WeightChart = ({ records }: Props) => {
  const chartData = records
    .filter(r => r.weight && Number(r.weight) > 0)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(r => {
      const date = r.createdAt;
      return {
        value: Number(r.weight),
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        dataPointText: String(r.weight),
      };
    });

  if (chartData.length === 0) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>体重の推移</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>データがありません</Text>
          <Text style={styles.emptySubText}>記録時に体重を入力するとグラフになります</Text>
        </View>
      </Card>
    );
  }

  let finalData = chartData;
  if (chartData.length === 1) {
    finalData = [
      { value: chartData[0].value, label: '' },
      chartData[0]
    ];
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>体重の推移 (kg)</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={finalData}
          height={200}
          width={Dimensions.get('window').width - 80}
          color="#3B82F6"
          thickness={3}
          dataPointsColor="#3B82F6"
          textColor="#333"
          textFontSize={12}
          hideRules
          hideYAxisText
          yAxisColor="transparent"
          xAxisColor="#ccc"
          initialSpacing={20}
          endSpacing={20}
          curved
          isAnimated
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  emptyBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});