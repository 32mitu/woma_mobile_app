import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/Input';
import { Card } from '../../../../ui/Card';
import { ListItem } from '../../../../ui/ListItem';
import { IconButton } from '../../../../ui/IconButton';
import { Badge } from '../../../../ui/Badge';
import { BarcodeScanner, ScannedFoodData } from './BarcodeScanner';
import { useMealHistory, MealTemplate } from './useMealHistory';
import { NutritionChart } from './NutritionChart';
import { useDailyNutrition } from './useDailyNutrition';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';
import { useAuth } from '../../../auth/useAuth';
import { useTranslation } from 'react-i18next';

type TabType = 'scan' | 'history' | 'myset';

export const MealForm = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);

    const { nutrition, refetch } = useDailyNutrition();

    const { historyItems, templates, fetchHistory, fetchTemplates, saveTemplate, deleteTemplate } = useMealHistory();
    const [activeTab, setActiveTab] = useState<TabType>('scan');
    const [templateName, setTemplateName] = useState('');

    const { control, handleSubmit } = useForm({
        defaultValues: { comment: '' },
    });

    const [isScannerVisible, setScannerVisible] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedFoodData[]>([]);

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        if (activeTab === 'myset') fetchTemplates();
    }, [activeTab, fetchHistory, fetchTemplates]);

    const totalCalories = useMemo(() => {
        return scannedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    }, [scannedItems]);

    const sanitizeItems = (items: ScannedFoodData[]) => {
        return items.map(item => ({
            name: item.name,
            calories: item.calories || 0,
            barcode: item.barcode || "",
            source: item.source || "manual",
            imageUrl: item.imageUrl || null,
            unitType: item.unitType || 'manual',
            protein: item.protein || 0,
            fat: item.fat || 0,
            carbs: item.carbs || 0
        }));
    };

    const onSubmit = async (data: { comment: string }) => {
        if (!user) return;
        if (scannedItems.length === 0 && !data.comment.trim()) {
            Alert.alert(t('common.error'), t('meal.errorNoItems'));
            return;
        }

        setIsSaving(true);
        try {
            const cleanItems = sanitizeItems(scannedItems);

            await addDoc(collection(db, 'meal_records'), {
                userId: user.uid,
                uid: user.uid,
                type: 'meal',
                items: cleanItems,
                comment: data.comment,
                totalCalories: totalCalories,
                createdAt: serverTimestamp(),
                date: new Date().toISOString()
            });

            refetch();

            Alert.alert(t('meal.saveSuccess'), t('meal.saveSuccessMessage'), [{ text: t('common.ok'), onPress: () => router.back() }]);
        } catch (e: any) {
            console.error("保存エラー詳細:", e);
            Alert.alert(t('common.error'), t('meal.saveFailed', { error: e.message }));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddItem = (item: ScannedFoodData) => {
        setScannedItems(prev => [...prev, { ...item }]);
        if (!isScannerVisible) {
            Alert.alert(t('meal.addedItem'), t('meal.addedItemMessage', { name: item.name }));
        }
    };

    const handleLoadTemplate = (template: MealTemplate) => {
        setScannedItems(prev => [...prev, ...template.items]);
        Alert.alert(t('meal.appliedSet'), t('meal.appliedSetMessage', { name: template.name }));
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            Alert.alert(t('common.error'), t('meal.errorNoSetName'));
            return;
        }
        if (scannedItems.length === 0) {
            Alert.alert(t('common.error'), t('meal.errorNoFoodInList'));
            return;
        }
        try {
            const cleanItems = sanitizeItems(scannedItems);
            await saveTemplate(templateName, cleanItems);
            setTemplateName('');
            Alert.alert(t('meal.savedSet'), t('meal.savedSetMessage'));
            setActiveTab('myset');
        } catch (e) {
            console.error(e);
            Alert.alert(t('common.error'), t('meal.saveSetFailed'));
        }
    };

    const removeItem = (index: number) => {
        setScannedItems(prev => prev.filter((_, i) => i !== index));
    };

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <Badge label={t('meal.tabScan')} onPress={() => setActiveTab('scan')} selected={activeTab === 'scan'} />
            <Badge label={t('meal.tabHistory')} onPress={() => setActiveTab('history')} selected={activeTab === 'history'} />
            <Badge label={t('meal.tabMyset')} onPress={() => setActiveTab('myset')} selected={activeTab === 'myset'} />
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.pageTitle}>{t('meal.title')}</Text>

                {/* PFCバランスグラフ */}
                <NutritionChart data={nutrition} />

                {/* 食品リスト */}
                {scannedItems.length > 0 && (
                    <Card style={styles.listCard} padding="none">
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>{t('meal.selectedItems', { count: scannedItems.length })}</Text>
                            <TouchableOpacity onPress={() => setScannedItems([])}>
                                <Text style={{ color: '#EF4444', fontSize: 12 }}>{t('meal.removeAll')}</Text>
                            </TouchableOpacity>
                        </View>
                        {scannedItems.map((item, index) => (
                            <ListItem
                                key={index}
                                title={item.name}
                                subtitle={`${item.calories} kcal`}
                                imageUrl={item.imageUrl}
                                rightElement={
                                    <IconButton name="trash-outline" size={20} color="#EF4444" onPress={() => removeItem(index)} />
                                }
                                style={index === scannedItems.length - 1 ? { borderBottomWidth: 0 } : {}}
                            />
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t('meal.total')}</Text>
                            <Text style={styles.totalValue}>{totalCalories} kcal</Text>
                        </View>

                        <View style={styles.saveTemplateRow}>
                            <Input
                                placeholder={t('meal.setNamePlaceholder')}
                                value={templateName}
                                onChangeText={setTemplateName}
                                containerStyle={{ marginBottom: 0, flex: 1 }}
                            />
                            <Button title={t('meal.saveSet')} size="sm" variant="outline" onPress={handleSaveTemplate} />
                        </View>
                    </Card>
                )}

                {renderTabs()}

                <View style={styles.tabContent}>
                    {activeTab === 'scan' && (
                        <View style={styles.scanAction}>
                            <Button
                                title={t('meal.startCamera')}
                                onPress={() => setScannerVisible(true)}
                                variant="primary"
                                icon={<Text style={{ fontSize: 18, marginRight: 8, color: 'white' }}>📷</Text>}
                            />
                            <Text style={styles.helperText}>{t('meal.scanHelper')}</Text>
                        </View>
                    )}

                    {activeTab === 'history' && (
                        <View>
                            {historyItems.length === 0 ? (
                                <Text style={styles.emptyText}>{t('meal.noHistory')}</Text>
                            ) : (
                                historyItems.map((item, index) => (
                                    <ListItem
                                        key={index}
                                        title={item.name}
                                        subtitle={`${item.calories} kcal`}
                                        imageUrl={item.imageUrl}
                                        rightElement={<IconButton name="plus-circle" size={24} color="#3B82F6" onPress={() => handleAddItem(item)} />}
                                    />
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'myset' && (
                        <View>
                            {templates.length === 0 ? (
                                <Text style={styles.emptyText}>{t('meal.noMyset')}</Text>
                            ) : (
                                templates.map((tpl) => (
                                    <Card key={tpl.id} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{tpl.name}</Text>
                                            <IconButton name="trash-outline" size={18} color="#999" onPress={() => deleteTemplate(tpl.id)} />
                                        </View>
                                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                                            {tpl.items.map(i => i.name).join(', ')}
                                        </Text>
                                        <Button title={t('meal.addThisSet')} size="sm" onPress={() => handleLoadTemplate(tpl)} />
                                    </Card>
                                ))
                            )}
                        </View>
                    )}
                </View>

                <Card style={styles.section}>
                    <Controller
                        control={control}
                        name="comment"
                        render={({ field: { onChange, value } }) => (
                            <Input label={t('meal.memoLabel')} value={value} onChangeText={onChange} multiline placeholder={t('meal.memoPlaceholder')} containerStyle={{ marginBottom: 0 }} />
                        )}
                    />
                </Card>

                <Button title={isSaving ? t('meal.saving') : t('meal.save')} onPress={handleSubmit(onSubmit)} size="lg" disabled={isSaving} />

            </ScrollView>

            <BarcodeScanner visible={isScannerVisible} onClose={() => setScannerVisible(false)} onScanned={handleAddItem} />

            {isSaving && (
                <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },

    tabContainer: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    tabContent: { minHeight: 150, marginBottom: 20 },

    listCard: { marginBottom: 24 },
    listHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between' },
    sectionTitle: { fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    totalLabel: { marginRight: 8 },
    totalValue: { fontWeight: 'bold', color: '#10B981', fontSize: 18 },

    saveTemplateRow: { padding: 12, backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', gap: 8 },

    scanAction: { alignItems: 'center', padding: 20 },
    helperText: { marginTop: 10, color: '#666' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20, lineHeight: 20 },
    section: { marginBottom: 24 },
    savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});
