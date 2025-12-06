import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

type Props = {
  records: any[]; // 履歴データ
};

export const WeightChart = ({ records }: Props) => {
  // 1. データをグラフ用に加工する
  // (体重が記録されているものだけを抽出し、日付順に並べる)
  const chartData = records
    .filter(r => r.weight && Number(r.weight) > 0) // 体重があるデータのみ
    .sort((a, b) => a.createdAt - b.createdAt) // 古い順に並び替え
    .map(r => {
      const date = r.createdAt;
      return {
        value: Number(r.weight),
        label: `${date.getMonth() + 1}/${date.getDate()}`, // "12/5" のようなラベル
        dataPointText: String(r.weight), // 点の上に数値を表示
      };
    });

  // データがない場合の表示
  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>体重の推移</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>データがありません</Text>
          <Text style={styles.emptySubText}>記録時に体重を入力するとグラフになります</Text>
        </View>
      </View>
    );
  }

  // データが1つだけだと線が引けないので、ダミー（同じ値）を足して線を引く小技
  // (これがないとエラーになることがあります)
  let finalData = chartData;
  if (chartData.length === 1) {
    finalData = [
      { ...chartData[0], label: '' }, 
      chartData[0]
    ];
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>体重の推移 (kg)</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={finalData}
          height={200}
          width={Dimensions.get('window').width - 80} // 画面幅に合わせて調整
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
          curved // 線を滑らかにする
          isAnimated // アニメーションON
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  chartWrapper: {
    alignItems: 'center',
    paddingRight: 10,
  },
  emptyBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  emptyText: {
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#aaa',
  },
});