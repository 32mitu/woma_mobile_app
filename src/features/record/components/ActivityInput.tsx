import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// 修正: パスを components/ui から ui に変更
import { Badge } from '../../../ui/Badge';
import { IconButton } from '../../../ui/IconButton';

type Props = {
  activity: any;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  index: number;
  weight?: string;
};

export const ActivityInput = ({ activity, onUpdate, onRemove, index, weight }: Props) => {
  const estimatedCalories = useMemo(() => {
    const w = parseFloat(weight || '0');
    if (!w || isNaN(w) || w <= 0) return 0;
    const mets = parseFloat(activity.mets);
    const durationHours = (activity.duration || 30) / 60;
    return Math.round(mets * w * durationHours * 1.05);
  }, [weight, activity.mets, activity.duration]);

  const handleIntensityChange = (level: 'low' | 'mid' | 'high') => {
    const newMets = activity[level];
    onUpdate(activity.uniqueId, 'intensity', level);
    onUpdate(activity.uniqueId, 'mets', newMets);
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.calorieText}>
            🔥 {estimatedCalories} kcal ({activity.duration || 30}分)
          </Text>
        </View>
        <IconButton
          name="close-circle"
          size={24}
          color="#9CA3AF"
          onPress={() => onRemove(activity.uniqueId)}
        />
      </View>

      {/* 強度選択 */}
      <View style={styles.controlsRow}>
        <Text style={styles.label}>強度</Text>
        <View style={styles.badges}>
          <Badge
            label="弱"
            variant={activity.intensity === 'low' ? 'default' : 'outline'}
            color={activity.intensity === 'low' ? 'success' : 'secondary'}
            onPress={() => handleIntensityChange('low')}
            style={styles.badge}
          />
          <Badge
            label="中"
            variant={activity.intensity === 'mid' ? 'default' : 'outline'}
            color={activity.intensity === 'mid' ? 'primary' : 'secondary'}
            onPress={() => handleIntensityChange('mid')}
            style={styles.badge}
          />
          <Badge
            label="強"
            variant={activity.intensity === 'high' ? 'default' : 'outline'}
            color={activity.intensity === 'high' ? 'danger' : 'secondary'}
            onPress={() => handleIntensityChange('high')}
            style={styles.badge}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calorieText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  controlsRow: {
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    minWidth: 48,
    justifyContent: 'center',
  },
});