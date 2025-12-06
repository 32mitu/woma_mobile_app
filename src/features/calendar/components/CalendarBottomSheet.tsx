import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../features/auth/useAuth';
import { ActivityLog } from './ActivityLog';
import { FontAwesome5 } from '@expo/vector-icons';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD" 形式
};

export const CalendarBottomSheet = ({ isVisible, onClose, selectedDate }: Props) => {
  const { userProfile } = useAuth();

  // 日付が選択されていない、またはユーザーがいない場合は何もしない
  if (!selectedDate || !userProfile?.uid) return null;

  // ▼ 日付文字列から、その日の 00:00:00 と 23:59:59 のTimestampを作成
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // ▼ その日の記録だけを取得するクエリを作成
  const dailyQuery = query(
    collection(db, 'exerciseRecords'),
    where('userId', '==', userProfile.uid),
    where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
    where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('createdAt', 'desc')
  );

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
              {/* ヘッダー部分 */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {selectedDate.replace('-', '年').replace('-', '月') + '日'} の記録
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <FontAwesome5 name="times" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              {/* ActivityLog にクエリを渡して表示 */}
              <View style={styles.content}>
                <ActivityLog customQuery={dailyQuery} />
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
    backgroundColor: '#F3F4F6', // 少しグレーにしてカードを目立たせる
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%', // 画面の6割くらいの高さ
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
    padding: 4,
  },
  content: {
    flex: 1,
  },
});