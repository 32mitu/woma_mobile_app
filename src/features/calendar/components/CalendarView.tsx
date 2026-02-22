import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../auth/useAuth';
import { CalendarBottomSheet } from './CalendarBottomSheet';
import { useTranslation } from 'react-i18next';
// 共通コンポーネント
import { Card } from '../../../ui/Card';

// 日本語ロケール登録
LocaleConfig.locales['jp'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日'
};
// 英語ロケール登録（react-native-calendarsのデフォルト）
LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};

const CalendarViewComponent = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  // 言語に応じてカレンダーロケールを切り替え
  LocaleConfig.defaultLocale = i18n.language === 'ja' ? 'jp' : 'en';

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

  // Calendarに渡す関数を固定（重要）
  const handleDayPress = useCallback((day: any) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />;
  }

  return (
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
        <Text style={styles.legendText}>{t('calendar.legend')}</Text>
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

export const CalendarView = memo(CalendarViewComponent);