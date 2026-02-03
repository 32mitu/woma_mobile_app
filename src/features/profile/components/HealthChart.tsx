import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useFocusEffect } from 'expo-router';

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { IconButton } from '../../../ui/IconButton';

type Props = {
  userId: string;
  userWeight: number;
  refreshTrigger?: any;
};

export const HealthChart = ({ userId, userWeight, refreshTrigger }: Props) => {
  const [loading, setLoading] = useState(true);
  const [barData, setBarData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 軸のスケール計算用
  const [maxCalorie, setMaxCalorie] = useState(1000);
  const [minWeightAxis, setMinWeightAxis] = useState(0);
  const [maxWeightAxis, setMaxWeightAxis] = useState(100);

  const [rawWeights, setRawWeights] = useState<(number | null)[]>([]);

  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const fetchData = async () => {
    setLoading(true);

    const { start, end } = getMonthRange(currentDate);
    const daysInMonth = end.getDate();

    try {
      // 1. カロリー取得
      const exerciseQ = query(
        collection(db, 'exerciseRecords'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      );

      const exerciseSnap = await getDocs(exerciseQ);
      const dailyCalories = new Array(daysInMonth).fill(0);

      exerciseSnap.docs.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt.toDate();
        const idx = date.getDate() - 1;

        let total = 0;
        if (data.activities) {
          data.activities.forEach((act: any) => {
            const mets = Number(act.mets) || 3;
            const w = Number(data.weight) || userWeight || 60;
            let durationHours = 0;
            if (Number(act.duration) > 0) durationHours = Number(act.duration) / 60;
            else if (Number(act.steps) > 0) durationHours = Number(act.steps) / 6000;
            if (durationHours > 0) total += mets * w * durationHours * 1.05;
          });
        }
        dailyCalories[idx] += total;
      });

      // 2. 体重取得
      const weightQ = query(
        collection(db, 'healthRecords'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end)),
        orderBy('createdAt', 'asc')
      );

      const weightSnap = await getDocs(weightQ);
      const dailyWeights = new Array(daysInMonth).fill(null);
      weightSnap.docs.forEach(doc => {
        const d = doc.data();
        const idx = d.createdAt.toDate().getDate() - 1;
        dailyWeights[idx] = d.weight;
      });

      // 体重の穴埋め
      let lastW = userWeight || 60;
      for (let i = 0; i < daysInMonth; i++) {
        if (dailyWeights[i] !== null) lastW = dailyWeights[i];
        else dailyWeights[i] = lastW;
      }
      setRawWeights(dailyWeights);

      // --- 3. 自動スケール計算 ---

      // A. カロリーの最大値計算
      let localMaxCal = Math.max(...dailyCalories);
      if (localMaxCal < 500) localMaxCal = 500;
      localMaxCal = Math.ceil(localMaxCal / 100) * 100;

      // B. 体重の軸計算 (基準体重 ± 5kg)
      const validWeights = dailyWeights.filter(w => w !== null) as number[];

      let baseWeight = userWeight || 60;
      if (validWeights.length > 0) {
        const sum = validWeights.reduce((a, b) => a + b, 0);
        baseWeight = sum / validWeights.length;
      }

      let calcMinW = Math.floor(baseWeight - 5);
      let calcMaxW = Math.ceil(baseWeight + 5);

      if (validWeights.length > 0) {
        const dataMin = Math.min(...validWeights);
        const dataMax = Math.max(...validWeights);
        if (dataMin < calcMinW) calcMinW = Math.floor(dataMin - 1);
        if (dataMax > calcMaxW) calcMaxW = Math.ceil(dataMax + 1);
      }

      calcMinW = Math.floor(calcMinW / 5) * 5;
      calcMaxW = Math.ceil(calcMaxW / 5) * 5;

      if (calcMaxW - calcMinW < 10) {
        calcMaxW = calcMinW + 10;
      }

      setMaxCalorie(localMaxCal);
      setMinWeightAxis(calcMinW);
      setMaxWeightAxis(calcMaxW);

      // 4. データ変換
      const formattedBarData = dailyCalories.map((cal, i) => ({
        value: cal,
        label: (i + 1) % 5 === 0 ? (i + 1).toString() : '',
        frontColor: 'rgba(255, 99, 132, 0.6)',
        spacing: 4,
        labelTextStyle: { color: '#999', fontSize: 10, width: 20, textAlign: 'center' }
      }));

      // 体重データを正規化
      const weightRange = calcMaxW - calcMinW;
      const formattedLineData = dailyWeights.map((w, i) => {
        if (w === null) return { value: 0, hideDataPoint: true };

        let scaledValue = 0;
        if (weightRange > 0) {
          scaledValue = ((w - calcMinW) / weightRange) * localMaxCal;
        }

        return {
          value: scaledValue,
          dataPointText: '',
          hideDataPoint: (i + 1) % 5 !== 0,
          customDataPoint: undefined,
        };
      });

      setBarData(formattedBarData);
      setLineData(formattedLineData);

    } catch (e) {
      console.error("[HealthChart] Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [userId, currentDate, refreshTrigger])
  );

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const RightYAxis = () => {
    const sections = 4;
    const labels = [];
    const range = maxWeightAxis - minWeightAxis;

    for (let i = 0; i <= sections; i++) {
      const val = minWeightAxis + (range * (i / sections));
      labels.push(Math.round(val * 10) / 10);
    }

    return (
      <View style={styles.rightAxisAbsContainer}>
        {labels.reverse().map((val, i) => (
          <Text key={i} style={styles.rightAxisText}>{val}</Text>
        ))}
      </View>
    );
  };

  const renderTooltip = (item: any, index: number) => {
    return (
      <View style={styles.tooltipContainer}>
        <Text style={styles.tooltipDate}>
          {currentDate.getMonth() + 1}/{index + 1}
        </Text>
        <Text style={styles.tooltipText}>
          カロリー: {Math.round(item.value)} kcal
        </Text>
        <Text style={styles.tooltipText}>
          体重: {rawWeights[index] ? `${rawWeights[index]} kg` : '--'}
        </Text>
      </View>
    );
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 100; // Cardのpaddingなどを考慮

  return (
    <Card style={styles.container}>
      {/* ヘッダー: 月移動 */}
      <View style={styles.header}>
        <IconButton
          name="chevron-back"
          onPress={() => changeMonth(-1)}
          style={styles.navBtn}
          color="#3B82F6"
        />
        <Text style={styles.monthTitle}>
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </Text>
        <IconButton
          name="chevron-forward"
          onPress={() => changeMonth(1)}
          style={styles.navBtn}
          color="#3B82F6"
        />
      </View>

      {/* 軸タイトル */}
      <View style={styles.axisTitleContainer}>
        <Text style={styles.leftAxisTitle}>消費カロリー (kcal)</Text>
        <Text style={styles.rightAxisTitle}>体重 (kg)</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ height: 220 }} />
      ) : (
        <View style={[styles.chartRow, { paddingRight: 40 }]}>
          <BarChart
            data={barData}
            barWidth={6}
            spacing={4}
            roundedTop
            hideRules={false}
            rulesColor="#eee"
            rulesType="solid"
            xAxisThickness={1}
            yAxisThickness={0}
            yAxisTextStyle={{ color: '#999', fontSize: 10 }}
            noOfSections={4}
            maxValue={maxCalorie}

            renderTooltip={renderTooltip}
            leftShiftForTooltip={20}
            autoCenterTooltip

            showLine
            lineData={lineData}
            lineConfig={{
              color: '#36A2EB',
              thickness: 2,
              curved: true,
              hideDataPoints: false,
              dataPointsColor: '#36A2EB',
              dataPointsRadius: 3,
            }}

            height={200}
            width={chartWidth}
            isAnimated
          />
          {/* 右軸 (絶対配置) */}
          <RightYAxis />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    // Cardがデフォルトで持つパディングと背景色を利用するため、ここでは最低限の上書きのみ
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  navBtn: {
    padding: 4
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },

  axisTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  leftAxisTitle: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  rightAxisTitle: { fontSize: 10, color: '#36A2EB', fontWeight: 'bold' },

  chartRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  rightAxisAbsContainer: {
    position: 'absolute',
    right: 0,
    top: -6,
    bottom: 20,
    height: 200,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: 40,
  },
  rightAxisText: {
    fontSize: 10,
    color: '#36A2EB',
    fontWeight: 'bold',
    textAlign: 'right',
    backgroundColor: 'rgba(255,255,255,0.8)'
  },
  tooltipContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  tooltipDate: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  tooltipText: {
    color: 'white',
    fontSize: 11,
  }
});