import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  activity: any;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  index: number;
  weight?: string; 
};

export const ActivityInput = ({ activity, onUpdate, onRemove, index, weight }: Props) => {
  
  // ★詳細ログ付きのカロリー計算ロジック
  const estimatedCalories = useMemo(() => {
    const logPrefix = `[Debug:Calorie][${activity.name}]`;
    console.log(`${logPrefix} 計算開始 ------------------`);

    // 1. 体重チェック
    const rawWeight = weight;
    const w = parseFloat(weight || '0');
    console.log(`${logPrefix} 体重: Raw="${rawWeight}", Parsed=${w}kg`);
    
    if (!w || isNaN(w) || w <= 0) {
      console.log(`${logPrefix} ❌ 計算中止: 体重が無効 (0または未入力)`);
      return 0; 
    }

    // 2. METsチェック
    let mets = parseFloat(activity.mets);
    console.log(`${logPrefix} METs(初期値): ${activity.mets} -> Parsed=${mets}`);

    // もしMETsが無効なら、baseMets.midを見る
    if (!mets || isNaN(mets) || mets <= 0) {
      console.log(`${logPrefix} ⚠️ METsが無効。baseMets.mid を参照します:`, activity.baseMets);
      mets = parseFloat(activity.baseMets?.mid);
      console.log(`${logPrefix} -> baseMetsからのMETs: ${mets}`);
    }
    // それでもダメなら最終手段で3.0を使う
    if (!mets || isNaN(mets) || mets <= 0) {
      console.log(`${logPrefix} ⚠️ METsが取得不可。デフォルト値 3.0 を使用します`);
      mets = 3.0; 
    }
    console.log(`${logPrefix} ✅ 使用するMETs: ${mets}`);

    // 3. 時間計算 (分)
    const rawDuration = activity.duration;
    const durationMinutes = parseFloat(activity.duration);
    console.log(`${logPrefix} 時間: Raw="${rawDuration}", Parsed=${durationMinutes}分`);

    if (durationMinutes && !isNaN(durationMinutes) && durationMinutes > 0) {
      const durationHour = durationMinutes / 60;
      const result = Math.round(mets * w * durationHour * 1.05);
      console.log(`${logPrefix} ✅ 時間計算式: ${mets} * ${w}kg * (${durationMinutes}/60)h * 1.05 = ${result}kcal`);
      return result;
    }

    // 4. 歩数計算 (時間が0の場合のみ)
    const rawSteps = activity.steps;
    const steps = parseFloat(activity.steps);
    console.log(`${logPrefix} 歩数: Raw="${rawSteps}", Parsed=${steps}歩`);
    
    if (steps && !isNaN(steps) && steps > 0) {
      // 6000歩 = 1時間換算
      const estimatedHour = steps / 6000;
      const result = Math.round(mets * w * estimatedHour * 1.05);
      console.log(`${logPrefix} ✅ 歩数計算式: ${mets} * ${w}kg * (${steps}/6000)h * 1.05 = ${result}kcal`);
      return result;
    }

    console.log(`${logPrefix} ❌ 計算中止: 時間も歩数も0です`);
    return 0;
  }, [weight, activity.duration, activity.steps, activity.mets, activity.baseMets]);

  // 強度の選択肢
  const levels = [
    { label: '低', desc: '楽に会話', value: activity.baseMets?.low },
    { label: '中', desc: '少し汗ばむ', value: activity.baseMets?.mid },
    { label: '高', desc: '息が上がる', value: activity.baseMets?.high },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>運動 {index + 1}: {activity.name}</Text>
        <TouchableOpacity onPress={() => onRemove(activity.id)}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {/* 強度選択ボタン */}
        <View style={styles.intensityContainer}>
          <Text style={styles.label}>強度:</Text>
          <View style={styles.intensityButtonGroup}>
            {levels.map((lvl) => (
              <TouchableOpacity
                key={lvl.label}
                style={[
                  styles.intensityButton,
                  activity.intensity === lvl.label && styles.intensityActive
                ]}
                onPress={() => onUpdate(activity.id, 'intensity', lvl.label)}
              >
                <Text style={[
                  styles.intensityText,
                  activity.intensity === lvl.label && styles.intensityTextActive
                ]}>
                  {lvl.label}
                </Text>
                <Text style={[
                  styles.intensitySubText,
                  activity.intensity === lvl.label && styles.intensityTextActive
                ]}>
                  {lvl.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 時間入力 */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>時間(分)</Text>
          <TextInput
            style={styles.input}
            value={activity.duration !== undefined && activity.duration !== null ? String(activity.duration) : ''}
            onChangeText={(text) => onUpdate(activity.id, 'duration', text)}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>
      </View>

      {/* 歩数入力 */}
      <View style={[styles.row, { marginTop: 12 }]}>
        <View style={[styles.inputWrapper, { flex: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="footsteps" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text style={styles.label}>歩数 (任意)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={activity.steps ? String(activity.steps) : ''}
            onChangeText={(text) => onUpdate(activity.id, 'steps', text)}
            keyboardType="numeric"
            placeholder="例: 5000"
          />
        </View>
      </View>

      {/* カロリー表示エリア */}
      {/* 0kcalでも、計算結果として表示するように変更してデバッグしやすくする */}
      <View style={styles.calorieInfo}>
        <Ionicons name="flame" size={16} color="#F97316" />
        <Text style={styles.calorieText}>
          推定消費: <Text style={styles.calorieValue}>{estimatedCalories} kcal</Text>
        </Text>
      </View>
      
      {/* 体重未入力時の警告 */}
      {parseFloat(weight || '0') <= 0 && (
        <Text style={styles.hintText}>⚠️ 体重が設定されていません (0kg扱いで計算中)</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  intensityContainer: {
    flex: 1,
  },
  intensityButtonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  intensityButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    flex: 1,
  },
  intensityActive: {
    backgroundColor: '#3B82F6',
  },
  intensityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  intensitySubText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  intensityTextActive: {
    color: 'white',
  },
  inputWrapper: {
    width: 80,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  calorieInfo: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#FFEDD5',
    padding: 8,
    borderRadius: 8,
  },
  calorieText: {
    fontSize: 14,
    color: '#C2410C',
    marginLeft: 4,
  },
  calorieValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  hintText: {
    marginTop: 8,
    fontSize: 11,
    color: '#EF4444', // 警告色に変更
    textAlign: 'right',
    fontWeight: 'bold',
  },
});