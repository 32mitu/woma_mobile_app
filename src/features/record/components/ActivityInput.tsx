import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// 共通コンポーネント
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { IconButton } from '../../../ui/IconButton';

type Activity = {
  id: string;
  name: string;
  intensity: '低' | '中' | '高';
  duration: number; // 分
  steps?: number;
  mets: number;
  baseMets: { low: number; mid: number; high: number }; // METs基準値
};

type Props = {
  index: number;
  activity: Activity;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  weight?: string | number;
};

export const ActivityInput = ({ index, activity, onUpdate, onRemove, weight }: Props) => {

  // カロリー概算
  const estimatedCalories = useMemo(() => {
    const w = parseFloat(String(weight) || '60');
    const mets = parseFloat(String(activity.mets || 3));
    const durationHours = (activity.duration || 0) / 60;
    const cal = mets * w * durationHours * 1.05;
    return Math.round(cal);
  }, [weight, activity.mets, activity.duration]);

  // 強度変更ハンドラ
  const handleIntensityChange = (level: '低' | '中' | '高') => {
    // 親コンポーネント(RecordForm)側で「強度が変わればMETsも再計算する」ロジックが入っているため、
    // ここでは強度(intensity)の更新のみを通知すればOKです。
    // 2回連続でonUpdateを呼ぶと、ステート更新が競合して片方が打ち消されることがあります。
    onUpdate(activity.id, 'intensity', level);
  };

  const handleDurationChange = (text: string) => {
    const val = parseInt(text, 10);
    onUpdate(activity.id, 'duration', isNaN(val) ? 0 : val);
  };

  const handleStepsChange = (text: string) => {
    const val = parseInt(text, 10);
    onUpdate(activity.id, 'steps', isNaN(val) ? 0 : val);
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー: 連番・運動名・削除ボタン */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.index}>#{index + 1}</Text>
          <Text style={styles.name}>{activity.name}</Text>
        </View>
        <IconButton
          name="trash-outline"
          size={20}
          color="#EF4444"
          onPress={() => onRemove(activity.id)}
        />
      </View>

      {/* 強度選択ボタン */}
      <View style={styles.section}>
        <Text style={styles.label}>強度</Text>
        <View style={styles.intensityRow}>
          {(['低', '中', '高'] as const).map((level) => (
            <Button
              key={level}
              title={level}
              // 選択中は primary (青), 未選択は outline (枠線のみ)
              variant={activity.intensity === level ? 'primary' : 'outline'}
              onPress={() => handleIntensityChange(level)}
              style={styles.intensityButton}
              textStyle={{ fontSize: 13 }}
            />
          ))}
        </View>
      </View>

      {/* 数値入力 (時間・歩数) */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Input
            label="時間 (分)"
            value={activity.duration > 0 ? String(activity.duration) : ''}
            onChangeText={handleDurationChange}
            keyboardType="numeric"
            placeholder="0"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Input
            label="歩数 (任意)"
            value={activity.steps && activity.steps > 0 ? String(activity.steps) : ''}
            onChangeText={handleStepsChange}
            keyboardType="numeric"
            placeholder="0"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* カロリー表示 */}
      <View style={styles.footer}>
        <Text style={styles.calorieText}>
          推定消費カロリー: <Text style={styles.calorieValue}>{estimatedCalories} kcal</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  index: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 0,
    height: 32,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  footer: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  calorieText: {
    fontSize: 12,
    color: '#6B7280',
  },
  calorieValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginLeft: 4,
  },
});