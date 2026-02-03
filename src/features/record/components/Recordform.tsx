import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/useAuth';
import { useRecordSaver } from '../useRecordSaver';
import { useExerciseTypes } from '../../../hooks/useExerciseTypes';
import { ActivityInput } from './ActivityInput';
import { RecordFormInputs } from './RecordformInputs';
import { ExerciseSelector } from './ExerciseSelector';
import { CreateExerciseTypeForm } from './CreateExerciseTypeForm';
import { Ionicons } from '@expo/vector-icons';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';

export const RecordForm = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  const { availableTypes, createNewExerciseType, deleteExerciseType } = useExerciseTypes(userProfile);
  const { saveRecord, saving } = useRecordSaver();
  const { getTodaySteps, loading: healthLoading } = useHealthKit();

  const [activities, setActivities] = useState<any[]>([]);
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [postToTimeline, setPostToTimeline] = useState(true);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);

  // 体重の決定
  const effectiveWeight = weight || (userProfile?.weight ? String(userProfile.weight) : '');

  const handleAddActivity = () => {
    setSelectorVisible(true);
  };

  const handleSelectExercise = (type: any) => {
    let lowVal, midVal, highVal;
    if (type.metsValues) {
      lowVal = type.metsValues['低'];
      midVal = type.metsValues['中'];
      highVal = type.metsValues['高'];
    } else {
      lowVal = type.low;
      midVal = type.mid;
      highVal = type.high;
    }

    const low = parseFloat(lowVal) || 3.0;
    const mid = parseFloat(midVal) || 3.5;
    const high = parseFloat(highVal) || 5.0;

    setActivities([
      ...activities,
      {
        id: Date.now().toString(),
        name: type.name || '名称不明',
        intensity: '中',
        duration: 30,
        steps: 0,
        mets: mid,
        baseMets: { low, mid, high }
      }
    ]);
    setSelectorVisible(false);
  };

  const handleUpdateActivity = (id: string, field: string, value: any) => {
    setActivities(activities.map(act => {
      if (act.id !== id) return act;
      if (field === 'intensity') {
        const newMets = act.baseMets[value === '低' ? 'low' : value === '高' ? 'high' : 'mid'] ?? 3.5;
        return { ...act, intensity: value, mets: newMets };
      }
      return { ...act, [field]: value };
    }));
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const handleImportHealthData = async () => {
    try {
      const steps = await getTodaySteps();
      if (!steps || steps === 0) {
        Alert.alert(t('record.healthAlertTitle'), t('record.healthNoData'));
        return;
      }

      const walkIndex = activities.findIndex(a => a.name.includes('ウォーキング') || a.name.includes('歩行'));

      if (walkIndex >= 0) {
        const updated = [...activities];
        updated[walkIndex].steps = steps;
        setActivities(updated);
        Alert.alert(t('record.healthAlertTitle'), t('record.healthSuccessUpdate', { steps: steps.toLocaleString() }));
      } else {
        const walkType = availableTypes.find(t => t.name.includes('ウォーキング'));
        // ... (省略: METs取得ロジック) ...
        // 既存のロジックと同じ
        const wLow = walkType?.metsValues?.['低'] || walkType?.low || 3.0;
        const wMid = walkType?.metsValues?.['中'] || walkType?.mid || 3.5;
        const wHigh = walkType?.metsValues?.['高'] || walkType?.high || 4.0;

        const newActivity = {
          id: Date.now().toString(),
          name: walkType?.name || 'ウォーキング',
          intensity: '中',
          duration: 0,
          steps: steps,
          mets: Number(wMid),
          baseMets: { low: Number(wLow), mid: Number(wMid), high: Number(wHigh) }
        };
        setActivities([...activities, newActivity]);
        Alert.alert(t('record.healthAlertTitle'), t('record.healthSuccessNew', { steps: steps.toLocaleString() }));
      }
    } catch (error) {
      console.error("HealthKit Error:", error);
      Alert.alert(t('common.error'), t('record.healthError'));
    }
  };

  const handleCreateSubmit = async (data: { name: string, low: number, mid: number, high: number }) => {
    await createNewExerciseType(data);
    setCreateVisible(false);
  };

  const handleSave = async () => {
    if (activities.length === 0 && !comment.trim() && imageUris.length === 0 && !weight) {
      Alert.alert(t('common.error'), t('record.validationError'));
      return;
    }
    await saveRecord({ activities, weight, comment, imageUris, postToTimeline });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('record.todaysRecord')}</Text>

        {/* ヘルスケア連携ボタン (iOSのみ) */}
        {Platform.OS === 'ios' && (
          <View style={styles.headerButtons}>
            <Button
              title={healthLoading ? t('record.importing') : t('record.importHealth')}
              onPress={handleImportHealthData}
              loading={healthLoading}
              icon={<Ionicons name="heart" size={16} color="white" />}
              // 共通ボタンのレイアウトを活かしつつ、色と角丸だけ上書き
              style={styles.healthButton}
              textStyle={styles.healthButtonText}
            />
            <Text style={styles.attributionText}>{t('record.dataFromHealth')}</Text>
          </View>
        )}

        {/* 運動リスト */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('record.exerciseMenu')}</Text>
          </View>

          {activities.length === 0 ? (
            <Text style={styles.emptyText}>{t('record.noActivity')}</Text>
          ) : (
            activities.map((act, index) => (
              <ActivityInput
                key={act.id}
                index={index}
                activity={act}
                onUpdate={handleUpdateActivity}
                onRemove={handleRemoveActivity}
                weight={effectiveWeight}
              />
            ))
          )}

          <Button
            title={t('record.addExercise')}
            variant="outline"
            icon={<Ionicons name="add" size={20} color="#3B82F6" />}
            onPress={handleAddActivity}
            // styleでflexなどを再定義せず、Button内部に任せる
            style={styles.addButton}
          />
        </Card>

        {/* 入力フォーム */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{t('record.weight')}</Text>
          <RecordFormInputs
            weight={weight}
            setWeight={setWeight}
            comment={comment}
            setComment={setComment}
            imageUris={imageUris}
            setImageUris={setImageUris}
            postToTimeline={postToTimeline}
            setPostToTimeline={setPostToTimeline}
          />
        </Card>

        {/* 保存ボタン */}
        <Button
          title={t('record.saveRecord')}
          onPress={handleSave}
          loading={saving}
          variant="primary"
          // Buttonのvariant="primary"に影が含まれているため、追加のstyleは最小限にする
          style={styles.submitButton}
          textStyle={{ fontSize: 18 }}
        />
      </ScrollView>

      {/* モーダル */}
      <ExerciseSelector
        visible={selectorVisible}
        availableTypes={availableTypes}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleSelectExercise}
        onCreateNew={() => { setSelectorVisible(false); setCreateVisible(true); }}
        onDelete={deleteExerciseType}
      />
      <CreateExerciseTypeForm
        visible={createVisible}
        onSubmit={handleCreateSubmit}
        onCancel={() => setCreateVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1F2937'
  },
  section: {
    marginTop: 24
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  // ヘッダーボタン周り
  headerButtons: {
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  healthButton: {
    backgroundColor: '#FA586A', // 専用色
    borderRadius: 20,
    borderWidth: 0,
    // paddingやflex系はButtonコンポーネントのデフォルトを使用
  },
  healthButtonText: {
    fontSize: 12,
  },
  attributionText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 4
  },
  // リスト周り
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginVertical: 12,
    fontSize: 14
  },
  addButton: {
    marginTop: 12,
    borderStyle: 'dashed', // outlineバリアントに追加するスタイルのみ記述
    backgroundColor: '#EFF6FF',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 40,
    // variant="primary"で影がついているため、ここでは余白のみ調整
  },
});