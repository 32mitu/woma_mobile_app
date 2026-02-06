import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform, Switch, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Hooks & Logic (パス修正済み)
import { useAuth } from '../../../auth/useAuth';
import { useRecordSaver } from '../../useRecordSaver';
import { useExerciseTypes } from '../../../../hooks/useExerciseTypes';
import { useHealthKit } from '../../../../hooks/useHealthKit';

// React Hook Form & Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recordSchema, RecordFormData } from '../../../../utils/validationSchemas';

// Components (パス修正済み: 親階層へアクセス)
import { ActivityInput } from '../ActivityInput';
import { ExerciseSelector } from '../ExerciseSelector';
import { CreateExerciseTypeForm } from '../CreateExerciseTypeForm';
import { Button } from '../../../../ui/Button';
import { Card } from '../../../../ui/Card';
import { Input } from '../../../../ui/Input';
import { ListItem } from '../../../../ui/ListItem';
import { IconButton } from '../../../../ui/IconButton';

export const ExerciseForm = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { userProfile } = useAuth();

    // --- フォーム設定 (React Hook Form) ---
    const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RecordFormData>({
        resolver: zodResolver(recordSchema),
        defaultValues: {
            weight: '',
            comment: '',
            postToTimeline: true,
        }
    });

    // --- カスタムフック ---
    const { availableTypes, createNewExerciseType, deleteExerciseType } = useExerciseTypes(userProfile);
    const { saveRecord, saving } = useRecordSaver();
    const { getTodaySteps, loading: healthLoading } = useHealthKit();

    // --- ローカルステート (フォーム管理外の動的データ) ---
    const [activities, setActivities] = useState<any[]>([]);
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [createVisible, setCreateVisible] = useState(false);

    // プロフィールの体重を初期値としてセット
    useEffect(() => {
        if (userProfile?.weight) {
            setValue('weight', String(userProfile.weight));
        }
    }, [userProfile, setValue]);

    // ActivityInput等で計算に使うための現在の入力体重
    const currentWeightInput = watch('weight');
    const effectiveWeight = currentWeightInput || (userProfile?.weight ? String(userProfile.weight) : '');

    // --- 画像選択ロジック ---
    const pickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert("許可が必要です", "写真へのアクセス許可が必要です");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            selectionLimit: 4 - imageUris.length, // 残りの枚数分だけ選択可能
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImageUris(prev => [...prev, ...newUris]);
        }
    };

    // --- アクティビティ操作ロジック ---
    const handleAddActivity = () => {
        setSelectorVisible(true);
    };

    const handleSelectExercise = (type: any) => {
        // METs値の取得ロジック (既存維持)
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

    // --- 送信処理 ---
    const onSubmit = async (data: RecordFormData) => {
        // アクティビティも画像もコメントも体重もない場合はエラー
        if (activities.length === 0 && !data.comment && imageUris.length === 0 && !data.weight) {
            Alert.alert(t('common.error'), t('record.validationError'));
            return;
        }

        await saveRecord({
            activities,
            weight: data.weight || '',
            comment: data.comment || '',
            imageUris,
            postToTimeline: data.postToTimeline
        });

        router.back();
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>{t('record.todaysRecord')}</Text>

                {/* ヘルスケア連携 (iOSのみ) */}
                {Platform.OS === 'ios' && (
                    <View style={styles.headerButtons}>
                        <Button
                            title={healthLoading ? t('record.importing') : t('record.importHealth')}
                            onPress={handleImportHealthData}
                            loading={healthLoading}
                            icon={<Ionicons name="heart" size={16} color="white" />}
                            style={styles.healthButton}
                            textStyle={{ fontSize: 12 }}
                        />
                        <Text style={styles.attributionText}>{t('record.dataFromHealth')}</Text>
                    </View>
                )}

                {/* --- 運動メニューセクション --- */}
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
                        style={styles.addButton}
                    />
                </Card>

                {/* --- 詳細入力セクション --- */}
                <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>記録の詳細</Text>

                    {/* 体重入力 */}
                    <Controller
                        control={control}
                        name="weight"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                label={`${t('record.weight')} (kg)`}
                                placeholder="60.5"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                keyboardType="numeric"
                                error={errors.weight?.message}
                                containerStyle={styles.inputItem}
                            />
                        )}
                    />

                    {/* コメント入力 */}
                    <Controller
                        control={control}
                        name="comment"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                label="コメント"
                                placeholder="今日は調子が良かった！"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                multiline
                                numberOfLines={3}
                                error={errors.comment?.message}
                                containerStyle={styles.inputItem}
                            />
                        )}
                    />

                    {/* 画像選択 */}
                    <View style={styles.imageSection}>
                        <Text style={styles.label}>写真 (最大4枚)</Text>
                        <View style={styles.imageGrid}>
                            {imageUris.map((uri, index) => (
                                <View key={index} style={styles.thumbnailContainer}>
                                    <Image source={{ uri }} style={styles.thumbnail} />
                                    <IconButton
                                        name="close"
                                        size={12}
                                        color="white"
                                        style={styles.deleteBadge}
                                        onPress={() => setImageUris(prev => prev.filter((_, i) => i !== index))}
                                    />
                                </View>
                            ))}
                            {imageUris.length < 4 && (
                                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                                    <Ionicons name="camera" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* タイムライン投稿設定 (ListItem使用) */}
                    <Controller
                        control={control}
                        name="postToTimeline"
                        render={({ field: { onChange, value } }) => (
                            <ListItem
                                title="タイムラインに投稿する"
                                style={{ paddingHorizontal: 0, borderBottomWidth: 0, paddingVertical: 8 }}
                                rightElement={
                                    <Switch
                                        value={value}
                                        onValueChange={onChange}
                                        trackColor={{ false: '#767577', true: '#3B82F6' }}
                                        thumbColor={value ? '#ffffff' : '#f4f3f4'}
                                    />
                                }
                            />
                        )}
                    />
                </Card>

                {/* 保存ボタン */}
                <Button
                    title={t('record.saveRecord')}
                    onPress={handleSubmit(onSubmit)}
                    loading={saving || isSubmitting}
                    variant="primary"
                    style={styles.submitButton}
                    textStyle={{ fontSize: 18 }}
                />
            </ScrollView>

            {/* --- モーダルコンポーネント --- */}
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

// スタイルはコピー元のものを維持
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
    headerButtons: {
        marginBottom: 20,
        alignItems: 'flex-start'
    },
    healthButton: {
        backgroundColor: '#FA586A',
        borderRadius: 20,
        borderWidth: 0,
    },
    attributionText: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
        marginLeft: 4
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginVertical: 12,
        fontSize: 14
    },
    addButton: {
        marginTop: 12,
        borderStyle: 'dashed',
        backgroundColor: '#EFF6FF',
    },
    submitButton: {
        marginTop: 24,
        marginBottom: 40,
    },
    inputItem: {
        marginBottom: 20,
    },
    imageSection: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    deleteBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    addImageButton: {
        width: 70,
        height: 70,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
});