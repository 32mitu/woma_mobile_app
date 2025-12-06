import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  activity: any;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  index: number;
};

export const ActivityInput = ({ activity, onUpdate, onRemove, index }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>運動 {index + 1}: {activity.name}</Text>
        <TouchableOpacity onPress={() => onRemove(activity.id)}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {/* 強度選択 (ボタン式) */}
        <View style={styles.intensityContainer}>
          <Text style={styles.label}>強度:</Text>
          {['低', '中', '高'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.intensityButton,
                activity.intensity === level && styles.intensityActive
              ]}
              onPress={() => onUpdate(activity.id, 'intensity', level)}
            >
              <Text style={[
                styles.intensityText,
                activity.intensity === level && styles.intensityTextActive
              ]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 時間入力 */}
        <View style={styles.durationContainer}>
          <Text style={styles.label}>時間(分):</Text>
          <TextInput
            style={styles.input}
            value={String(activity.duration || '')}
            onChangeText={(text) => onUpdate(activity.id, 'duration', Number(text))}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  intensityButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  intensityActive: {
    backgroundColor: '#3B82F6',
  },
  intensityText: {
    fontSize: 12,
    color: '#374151',
  },
  intensityTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 6,
    width: 60,
    textAlign: 'center',
  },
});