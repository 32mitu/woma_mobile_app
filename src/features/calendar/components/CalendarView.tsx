import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';
import { CalendarBottomSheet } from './CalendarBottomSheet';

// 日本語化設定
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
    const fetchRecords = async () => {
      // ★ 修正: ユーザー情報がまだない場合でも、一旦ローディングは終了させる
      if (!userProfile?.uid) {
        setLoading(false);
        return;
      }

      try {
        // 自分の記録を全て取得
        // ※ useRecordSaver.ts で保存先を "exerciseRecords" にした場合はそれに合わせる
        const q = query(
          collection(db, 'exerciseRecords'),
          where('userId', '==', userProfile.uid)
        );
        
        const snapshot = await getDocs(q);
        const marks: any = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.createdAt?.toDate) {
            const date = data.createdAt.toDate();
            // YYYY-MM-DD 形式に変換 (タイムゾーンのズレ対策で簡易的に文字列化)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            // マークをつける
            marks[dateString] = {
              marked: true,
              dotColor: '#3B82F6',
            };
          }
        });

        setMarkedDates(marks);
      } catch (error) {
        console.error("カレンダーデータ取得エラー:", error);
      } finally {
        // ★ 修正: 成功しても失敗しても、必ずローディングを終わらせる
        setLoading(false);
      }
    };

    fetchRecords();
  }, [userProfile]);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />;
  }

  return (
    <View style={styles.container}>
      <Calendar
        // 今日の日付をセット
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingBottom: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 6,
  },
  legendText: {
    color: '#666',
    fontSize: 12,
  },
});