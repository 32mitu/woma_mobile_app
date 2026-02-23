import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ExerciseForm } from './Exercise/ExerciseForm'; // 新規作成したファイルをインポート
import { MealForm } from './Meal/MealForm';         // 新規作成したファイルをインポート
import { useTranslation } from 'react-i18next';

// --------------------------------------------------
// モード切り替えタブコンポーネント
// --------------------------------------------------
const SegmentedControl = ({
  value,
  onChange
}: {
  value: 'exercise' | 'meal';
  onChange: (v: 'exercise' | 'meal') => void
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          value === 'exercise' && styles.activeTab
        ]}
        onPress={() => onChange('exercise')}
      >
        <Text style={[
          styles.tabText,
          value === 'exercise' ? styles.activeTabText : styles.inactiveTabText
        ]}>{t('record.exercise')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          value === 'meal' && styles.activeTab
        ]}
        onPress={() => onChange('meal')}
      >
        <Text style={[
          styles.tabText,
          value === 'meal' ? styles.activeMealText : styles.inactiveTabText
        ]}>{t('record.meal')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// --------------------------------------------------
// メインコンテナ
// --------------------------------------------------
export default function RecordForm() {
  const [recordMode, setRecordMode] = useState<'exercise' | 'meal'>('exercise');

  return (
    <View style={styles.container}>
      {/* タブ切り替えUI */}
      <View style={styles.headerContainer}>
        <SegmentedControl value={recordMode} onChange={setRecordMode} />
      </View>

      {/* 選択されたモードに応じてフォームを切り替え */}
      <View style={styles.contentContainer}>
        {recordMode === 'exercise' ? (
          <ExerciseForm />
        ) : (
          <MealForm />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 999, // 丸みのあるデザイン
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
    color: '#3B82F6', // Primary Color
  },
  activeMealText: {
    color: '#F97316', // Orange for Meal
  },
  inactiveTabText: {
    color: '#6B7280', // Gray
  },
});