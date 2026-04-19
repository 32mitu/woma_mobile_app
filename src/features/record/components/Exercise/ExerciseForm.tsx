import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Switch, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Hooks & Logic
import { useAuth } from '../../../auth/useAuth';
import { useRecordSaver, SavedRecordResult } from '../../useRecordSaver';
import { useExerciseTypes } from '../../../../hooks/useExerciseTypes';
import { useWorkoutShare } from '../../../share/useWorkoutShare';

// React Hook Form & Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recordSchema, RecordFormData } from '../../../../utils/validationSchemas';

// Components
import { ActivityInput } from '../ActivityInput';
import { ExerciseSelector } from '../ExerciseSelector';
import { CreateExerciseTypeForm } from '../CreateExerciseTypeForm';
import { Button } from '../../../../ui/Button';
import { Card } from '../../../../ui/Card';
import { Input } from '../../../../ui/Input';
import { ListItem } from '../../../../ui/ListItem';
import { IconButton } from '../../../../ui/IconButton';

// Share
import { WorkoutShareCard } from '../../../share/WorkoutShareCard';
import { WorkoutShareModal } from '../../../share/WorkoutShareModal';
import { ShareCardData } from '../../../share/shareCardUtils';

export const ExerciseForm = () => {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { userProfile } = useAuth();
    const lang = i18n.language === 'en' ? 'en' : 'ja';

    // --- フォーム設定 ---
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
    const { cardRef, isCapturing, shareToInstagram, shareGeneric } = useWorkoutShare();

    // --- ローカルステート ---
    const [activities, setActivities] = useState<any[]>([]);
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [createVisible, setCreateVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareData, setShareData] = useState<SavedRecordResult | null>(null);

    // プロフィールの体重を初期値としてセット
    useEffect(() => {
        if (userProfile?.weight) {
            setValue('weight', String(userProfile.weight));
        }
    }, [userProfile, setValue]);

    const currentWeightInput = watch('weight');
    const effectiveWeight = currentWeightInput || (userProfile?.weight ? String(userProfile.weight) : '');

    // SavedRecordResult → ShareCardData 変換
    const toShareCardData = useCallback((result: SavedRecordResult): ShareCardData => ({
        activities: result.activities.map(act => ({
            name: act.name,
            duration: act.duration,
            calories: act.calories,
        })),
        totalCalories: result.totalCalories,
        totalSteps: result.totalSteps,
        comment: '',
        imageUrls: result.imageUrls,
        streak: result.streak,
        displayBadges: result.displayBadges,
    }), []);

    // --- 画像選択 ---
    const pickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert(t('common.permissionRequired'), t('common.cameraRollPermission'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            selectionLimit: 4 - imageUris.length,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImageUris(prev => [...prev, ...newUris]);
        }
    };

    // --- アクティビティ操作 ---
    const handleAddActivity = () => {
        setSelectorVisible(true);
    };

    const handleSelectExercise = (type: any) => {
        const lowVal = type.metsValues?.['低'];
        const midVal = type.metsValues?.['中'];
        const highVal = type.metsValues?.['高'];

        const low = parseFloat(lowVal) || 3.0;
        const mid = parseFloat(midVal) || 3.5;
        const high = parseFloat(highVal) || 5.0;

        setActivities([
            ...activities,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: type.name || t('exercise.walking'),
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

    const handleCreateSubmit = async (data: { name: string, low: number, mid: number, high: number }) => {
        await createNewExerciseType(data);
        setCreateVisible(false);
    };

    // シェアモーダルを閉じてホームへ遷移
    const handleShareDismiss = useCallback(() => {
        setShareModalVisible(false);
        const badges = shareData?.newlyEarnedBadges || [];
        setShareData(null);

        if (badges.length > 0) {
            Alert.alert(
                '🎉 バッジ獲得！',
                `おめでとうございます！\n以下のバッジを獲得しました：\n\n${badges.map(b => `・${b.name}`).join('\n')}`,
                [{ text: 'OK', onPress: () => router.navigate('/(tabs)/home') }]
            );
        } else {
            router.navigate('/(tabs)/home');
        }
    }, [shareData, router]);

    // --- 送信処理 ---
    const onSubmit = async (data: RecordFormData) => {
        if (activities.length === 0 && !data.comment && imageUris.length === 0 && !data.weight) {
            Alert.alert(t('common.error'), t('record.validationError'));
            return;
        }

        const result = await saveRecord({
            activities,
            weight: data.weight || '',
            comment: data.comment || '',
            imageUris,
            postToTimeline: data.postToTimeline
        });

        if (result) {
            setShareData(result);
            setShareModalVisible(true);
        }
    };

    const cardData = shareData ? toShareCardData(shareData) : null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>{t('record.todaysRecord')}</Text>

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
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{t('record.details')}</Text>

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
                                placeholder={t('record.commentInputPlaceholder')}
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
                        <Text style={styles.label}>{t('record.photos')}</Text>
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

                    {/* タイムライン投稿設定 */}
                    <Controller
                        control={control}
                        name="postToTimeline"
                        render={({ field: { onChange, value } }) => (
                            <ListItem
                                title={t('record.postToTimelineTitle')}
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

            {/* --- オフスクリーン キャプチャ用カード (Modal の外に置くこと) --- */}
            {cardData && (
                <View style={styles.offscreenContainer} pointerEvents="none">
                    <WorkoutShareCard ref={cardRef} data={cardData} lang={lang} />
                </View>
            )}

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
            <WorkoutShareModal
                visible={shareModalVisible}
                data={cardData}
                isCapturing={isCapturing}
                lang={lang}
                onShareInstagram={shareToInstagram}
                onShareGeneric={shareGeneric}
                onDismiss={handleShareDismiss}
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
    offscreenContainer: {
        position: 'absolute',
        left: -9999,
        top: 0,
    },
});
