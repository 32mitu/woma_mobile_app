import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/useAuth';
import { useRecordSaver } from '../useRecordSaver';
import { useExerciseTypes } from '../../../hooks/useExerciseTypes'; // ★追加
import { ActivityInput } from './ActivityInput';
import { RecordFormInputs } from './RecordformInputs';
import { ExerciseSelector } from './ExerciseSelector';
import { CreateExerciseTypeForm } from './CreateExerciseTypeForm';
import { Ionicons } from '@expo/vector-icons';

export const RecordForm = () => {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  // マスタデータ取得 Hooks
  const { availableTypes, createNewExerciseType } = useExerciseTypes(userProfile);
  
  const { saveRecord, saving } = useRecordSaver();

  // State
  const [activities, setActivities] = useState<any[]>([]);
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [postToTimeline, setPostToTimeline] = useState(true);

  // Modals
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);

  // 運動を追加
  const handleSelectExercise = (type: any) => {
    const newActivity = {
      id: Date.now().toString(),
      typeId: type.id,
      name: type.name, // 表示用
      intensity: '中',
      duration: 30,
    };
    setActivities([...activities, newActivity]);
  };

  // 新規種目作成
  const handleCreateSubmit = async (data: any) => {
    await createNewExerciseType(data);
    setCreateVisible(false);
    // 作成後は自動的にセレクターに戻る
    setTimeout(() => setSelectorVisible(true), 500); 
  };

  const updateActivity = (id: string, field: string, value: any) => {
    setActivities(prev => prev.map(act => 
      act.id === id ? { ...act, [field]: value } : act
    ));
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(act => act.id !== id));
  };

  const handleSubmit = async () => {
    const success = await saveRecord({
      userProfile,
      availableTypes, // METs結合のために必要
      activities,
      weight,
      comment,
      imageUris,
      postToTimeline,
      selectedGroupId: null // グループ機能はまだなのでnull
    });

    if (success) {
      Alert.alert("記録完了！", "お疲れ様でした！", [
        { text: "ホームへ", onPress: () => router.push('/(tabs)/home') }
      ]);
      // リセット
      setActivities([]);
      setWeight('');
      setComment('');
      setImageUris([]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.pageTitle}>今日の記録</Text>

        {/* 1. 運動リスト */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>運動メニュー</Text>
          
          {activities.length === 0 && (
            <Text style={styles.emptyText}>まだ運動が追加されていません</Text>
          )}

          {activities.map((act, index) => (
            <ActivityInput
              key={act.id}
              index={index}
              activity={act}
              onUpdate={updateActivity}
              onRemove={removeActivity}
            />
          ))}
          
          <TouchableOpacity style={styles.addButton} onPress={() => setSelectorVisible(true)}>
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text style={styles.addText}>運動を追加する</Text>
          </TouchableOpacity>
        </View>

        {/* 2. その他の入力 */}
        <RecordFormInputs 
          weight={weight} setWeight={setWeight}
          comment={comment} setComment={setComment}
          imageUris={imageUris} setImageUris={setImageUris}
          postToTimeline={postToTimeline} setPostToTimeline={setPostToTimeline}
        />

        {/* 3. 送信ボタン */}
        <TouchableOpacity 
          style={[styles.submitButton, saving && styles.disabled]} 
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>記録を保存する</Text>}
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 運動選択モーダル */}
      <ExerciseSelector 
        visible={selectorVisible} 
        availableTypes={availableTypes}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleSelectExercise}
        onCreateNew={() => {
            setSelectorVisible(false);
            setCreateVisible(true);
        }}
      />

      {/* 新規作成モーダル */}
      <CreateExerciseTypeForm
        visible={createVisible}
        onSubmit={handleCreateSubmit}
        onCancel={() => setCreateVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginBottom: 12, fontSize: 14 },
  addButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 14, borderWidth: 1, borderColor: '#3B82F6', borderRadius: 12, 
    borderStyle: 'dashed', backgroundColor: '#EFF6FF' 
  },
  addText: { color: '#3B82F6', fontWeight: 'bold', marginLeft: 8 },
  submitButton: { 
    backgroundColor: '#3B82F6', padding: 16, borderRadius: 30, 
    alignItems: 'center', marginTop: 10, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  disabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});