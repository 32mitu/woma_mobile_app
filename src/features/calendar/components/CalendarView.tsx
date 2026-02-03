import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';
import { CalendarBottomSheet } from './CalendarBottomSheet';
// 共通コンポーネント
import { Card } from '../../../ui/Card';

LocaleConfig.locales['jp'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'jp';

export const CalendarView = () => {
  const { userProfile } = useAuth();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const fetchMonthlyData = async () => {
      try {
        const q = query(
          collection(db, 'exerciseRecords'),
          where('userId', '==', userProfile.uid)
        );
        const snapshot = await getDocs(q);
        const marks: any = {};

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.createdAt) {
            const date = data.createdAt.toDate();
            const dateStr = date.toISOString().split('T')[0];
            marks[dateStr] = {
              marked: true,
              dotColor: '#3B82F6',
            };
          }
        });
        setMarkedDates(marks);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [userProfile?.uid]);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />;
  }

  return (
    // カレンダー全体を共通のCardでラップ
    <Card style={styles.container}>
      <Calendar
        current={new Date().toISOString().split('T')[0]}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#3B82F6',
          arrowColor: '#3B82F6',
          textDayFontWeight: 'bold',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
        }}
        onDayPress={handleDayPress}
      />

      <View style={styles.legend}>
        <View style={styles.dot} />
        <Text style={styles.legendText}>記録がある日</Text>
      </View>

      <CalendarBottomSheet
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    // Cardのデフォルトパディングや影を使用するため、独自スタイルは最小限に
    padding: 10,
    marginVertical: 10,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});