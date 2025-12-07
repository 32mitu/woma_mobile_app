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
  const [minWeightAxis, setMinWeightAxis] = useState(0);
  const [maxWeightAxis, setMaxWeightAxis] = useState(100);

  // ツールチップ用データ
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

      // 体重の穴埋め (線が0に落ちないようにする)
      let lastW = userWeight || 60;
      
      // データがない日も前回の体重で埋めて、線を平らに維持する
      for(let i=0; i<daysInMonth; i++) {
        if (dailyWeights[i] !== null) {
            lastW = dailyWeights[i];
        } else {
            dailyWeights[i] = lastW;
        }
      }
      setRawWeights(dailyWeights);

      // 3. スケール計算
      let localMaxCal = Math.max(...dailyCalories);
      if (localMaxCal < 500) localMaxCal = 500;
      localMaxCal = Math.ceil(localMaxCal / 100) * 100;

      const validWeights = dailyWeights.filter(w => w !== null) as number[];
      let localMinW = 0;
      let localMaxW = 100;

      if (validWeights.length > 0) {
          const minVal = Math.min(...validWeights);
          const maxVal = Math.max(...validWeights);
          
          const padding = 2; 
          localMinW = Math.floor(minVal) - padding;
          localMaxW = Math.ceil(maxVal) + padding;
          
          if (localMinW < 0) localMinW = 0;
          if (localMaxW - localMinW < 5) {
              localMaxW = localMinW + 5;
          }
      } else {
           const base = userWeight || 60;
           localMinW = Math.max(0, base - 5);
           localMaxW = base + 5;
      }

      setMaxCalorie(localMaxCal);
      setMinWeightAxis(localMinW);
      setMaxWeightAxis(localMaxW);

      // 4. データ変換
      const formattedBarData = dailyCalories.map((cal, i) => ({
        value: cal,
        label: (i + 1) % 5 === 0 ? (i + 1).toString() : '',
        frontColor: 'rgba(255, 99, 132, 0.6)', 
        spacing: 4,
        labelTextStyle: { color: '#999', fontSize: 10, width: 20, textAlign: 'center' } 
      }));

      const weightRange = localMaxW - localMinW;
      const formattedLineData = dailyWeights.map((w, i) => {
        if (w === null) return { value: 0, hideDataPoint: true };
        
        let scaledValue = 0;
        if (weightRange > 0) {
            scaledValue = ((w - localMinW) / weightRange) * localMaxCal;
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

  const RightYAxis = () => {
    const sections = 4;
    const labels = [];
    const range = maxWeightAxis - minWeightAxis;
    
    for (let i = 0; i <= sections; i++) {
        const val = minWeightAxis + (range * (i / sections));
        labels.push(Math.round(val * 10) / 10);
    }
    
    return (
      <View style={styles.rightAxisContainer}>
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

  // 画面幅
  const screenWidth = Dimensions.get('window').width;
  // グラフの幅を計算: 画面幅 - (コンテナ左右パディング32 + 右軸幅50 + 予備マージン20)
  const chartWidth = screenWidth - 110;

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

      <View style={styles.axisTitleContainer}>
        <Text style={styles.leftAxisTitle}>消費カロリー (kcal)</Text>
        <Text style={styles.rightAxisTitle}>体重 (kg)</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ height: 220 }} />
      ) : (
        <View style={styles.chartRow}>
            {/* メイングラフ */}
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
                width={chartWidth} // 計算した幅を適用
                isAnimated
            />
            {/* 右軸 (固定幅) */}
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
  
  axisTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  leftAxisTitle: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  rightAxisTitle: { fontSize: 10, color: '#36A2EB', fontWeight: 'bold' },

  chartRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    // グラフと軸がはみ出さないようにラップ
    overflow: 'hidden', 
  },
  
  rightAxisContainer: {
    height: 200, 
    justifyContent: 'space-between',
    marginLeft: 4,
    width: 50, // 固定幅を確保
  },
  rightAxisText: {
    fontSize: 9, 
    color: '#36A2EB',
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100%',
    transform: [{ translateY: -5 }] 
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