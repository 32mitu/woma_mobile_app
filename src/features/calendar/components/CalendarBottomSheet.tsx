import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../features/auth/useAuth';
import { ActivityLog } from './ActivityLog';
import { useTranslation } from 'react-i18next';
// 共通コンポーネント
import { IconButton } from '../../../ui/IconButton';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD"
};

const CalendarBottomSheetComponent = ({ isVisible, onClose, selectedDate }: Props) => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();

  // クエリのメモ化 (これが無いとレンダリング毎にActivityLogが再マウントされてしまいます)
  const dailyQuery = useMemo(() => {
    if (!selectedDate || !userProfile?.uid) return undefined;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return query(
      collection(db, 'exerciseRecords'),
      where('userId', '==', userProfile.uid),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('createdAt', 'desc')
    );
  }, [selectedDate, userProfile?.uid]);

  if (!selectedDate || !userProfile?.uid) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {i18n.language === 'ja'
                    ? selectedDate.replace('-', '年').replace('-', '月') + '日の記録'
                    : t('calendar.recordsForDate', { date: new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
                  }
                </Text>
                {/* 共通の閉じるボタン */}
                <IconButton
                  name="close"
                  size={24}
                  color="#999"
                  onPress={onClose}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.content}>
                {/* queryがundefinedでない場合のみ表示 */}
                {dailyQuery && <ActivityLog customQuery={dailyQuery} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    marginRight: -8,
  },
  content: {
    flex: 1,
  },
});

export const CalendarBottomSheet = memo(CalendarBottomSheetComponent);