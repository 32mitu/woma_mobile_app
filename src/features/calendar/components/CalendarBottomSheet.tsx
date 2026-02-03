import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../features/auth/useAuth';
import { ActivityLog } from './ActivityLog';
// 共通コンポーネント
import { IconButton } from '../../../ui/IconButton';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD"
};

export const CalendarBottomSheet = ({ isVisible, onClose, selectedDate }: Props) => {
  const { userProfile } = useAuth();

  if (!selectedDate || !userProfile?.uid) return null;

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

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
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {selectedDate.replace('-', '年').replace('-', '月') + '日'} の記録
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