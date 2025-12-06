import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

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
  const [maxWeight, setMaxWeight] = useState(100);

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
            const mets = act.mets || 3;
            const w = data.weight || userWeight || 60;
            total += mets * w * (act.duration / 60) * 1.05;
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

      // 体重の穴埋め (線をつなぐため)
      let lastW = userWeight; 
      for(let i=0; i<daysInMonth; i++) {
        if (dailyWeights[i] !== null) lastW = dailyWeights[i];
        // 未来の日付は埋めない
        if (i < new Date().getDate() || currentDate < new Date()) {
            dailyWeights[i] = lastW;
        }
      }

      // 3. スケール計算 (2軸用)
      const maxCal = Math.max(...dailyCalories, 500); // 最低でも500
      // 体重の最大・最小（グラフの表示範囲を調整するため）
      const validWeights = dailyWeights.filter(w => w !== null) as number[];
      const maxW = validWeights.length > 0 ? Math.max(...validWeights) + 2 : 100; // 少し余裕を持たせる
      const minW = validWeights.length > 0 ? Math.min(...validWeights) - 2 : 40;

      setMaxCalorie(maxCal);
      setMaxWeight(maxW);

      // 4. データ変換
      // 体重データを、カロリー軸のスケールに合わせて変換する
      // 公式: 変換後 = (体重 / 体重最大値) * カロリー最大値
      const scaleFactor = maxCal / maxW;

      const formattedBarData = dailyCalories.map((cal, i) => ({
        value: cal,
        label: (i + 1) % 5 === 0 ? (i + 1).toString() : '',
        frontColor: 'rgba(255, 99, 132, 0.6)', 
        spacing: 4,
        labelTextStyle: { color: '#999', fontSize: 10 }
      }));

      const formattedLineData = dailyWeights.map((w, i) => ({
        value: w ? w * scaleFactor : 0, // スケーリング
        dataPointText: '', // 点の上の文字はごちゃつくので消す
        hideDataPoint: (i + 1) % 5 !== 0,
      }));

      setBarData(formattedBarData);
      setLineData(formattedLineData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, currentDate, refreshTrigger]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // 右軸（体重）の目盛りをレンダリングするコンポーネント
  const RightYAxis = () => {
    // 5分割くらいで目盛りを表示
    const steps = 4;
    const labels = [];
    for (let i = 0; i <= steps; i++) {
        const val = Math.round((maxWeight / steps) * i);
        labels.push(val);
    }
    // 上から順に表示するため反転
    return (
      <View style={styles.rightAxisContainer}>
        {labels.reverse().map((val, i) => (
          <Text key={i} style={styles.rightAxisText}>{val}kg</Text>
        ))}
        {/* 下の余白調整 */}
        <View style={{height: 20}} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 99, 132, 0.6)' }]} />
          <Text style={styles.legendText}>カロリー (左軸)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#36A2EB' }]} />
          <Text style={styles.legendText}>体重 (右軸)</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ height: 220 }} />
      ) : (
        <View style={styles.chartRow}>
            {/* メイングラフ (左軸: カロリー) */}
            <BarChart
                data={barData}
                barWidth={6}
                spacing={4}
                roundedTop
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                yAxisTextStyle={{ color: '#999', fontSize: 10 }}
                noOfSections={4}
                maxValue={maxCalorie} // 左軸の最大値
                
                // 折れ線 (体重: スケール変換済み)
                showLine
                lineData={lineData}
                lineConfig={{
                    color: '#36A2EB',
                    thickness: 3,
                    curved: true,
                    hideDataPoints: false,
                    dataPointsColor: '#36A2EB',
                    dataPointsRadius: 3,
                }}
                
                height={200}
                width={Dimensions.get('window').width - 100} // 右軸のスペース分引く
                isAnimated
            />
            
            {/* 右軸 (体重) */}
            <RightYAxis />
        </View>
      )}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendLine: { width: 16, height: 3, borderRadius: 1.5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#555' },

  chartRow: { flexDirection: 'row', alignItems: 'flex-start' },
  
  // 右軸のスタイル
  rightAxisContainer: {
    height: 200, 
    justifyContent: 'space-between',
    marginLeft: 4,
    paddingBottom: 20, // X軸ラベルの高さ分くらい調整
  },
  rightAxisText: {
    fontSize: 10,
    color: '#36A2EB', // 体重の色に合わせる
    fontWeight: 'bold',
  }
});