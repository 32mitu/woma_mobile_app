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

// --- Firebase / Auth ---
// ★修正: getFirestore() は使わず、設定ファイルから db を読み込む
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';
import { useAuth } from '../../../auth/useAuth';

// タブ定義
type TabType = 'scan' | 'history' | 'myset';

export const MealForm = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // 履歴・マイセット用フック
    const { historyItems, templates, fetchHistory, fetchTemplates, saveTemplate, deleteTemplate } = useMealHistory();
    const [activeTab, setActiveTab] = useState<TabType>('scan');
    const [templateName, setTemplateName] = useState(''); // 新規マイセット名入力用

    const { control, handleSubmit } = useForm({
        defaultValues: { comment: '' },
    });

    const [isScannerVisible, setScannerVisible] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedFoodData[]>([]);

    // 初期ロード時に履歴とマイセットを取得
    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        if (activeTab === 'myset') fetchTemplates();
    }, [activeTab]);

    // 合計カロリー計算
    const totalCalories = useMemo(() => {
        return scannedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    }, [scannedItems]);

    // --- データクリーニング関数 ---
    // Firestoreは undefined を保存できないため、null や 0 に変換する
    const sanitizeItems = (items: ScannedFoodData[]) => {
        return items.map(item => ({
            name: item.name,
            calories: item.calories || 0,
            barcode: item.barcode || "",
            source: item.source || "manual",
            imageUrl: item.imageUrl || null, // undefinedならnullにする
            unitType: item.unitType || 'manual',
            protein: item.protein || 0, // undefinedなら0にする
            fat: item.fat || 0,
            carbs: item.carbs || 0
        }));
    };

    // 保存処理
    const onSubmit = async (data: { comment: string }) => {
        if (!user) return;
        if (scannedItems.length === 0 && !data.comment.trim()) {
            Alert.alert('エラー', '食べたものかメモを入力してください');
            return;
        }

        setIsSaving(true);
        try {
            // ★修正: データをクリーニングしてから保存
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
            Alert.alert('保存完了', '食事を記録しました！', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) {
            console.error("保存エラー詳細:", e);
            Alert.alert('エラー', `保存に失敗しました: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddItem = (item: ScannedFoodData) => {
        setScannedItems(prev => [...prev, { ...item }]);
        // スキャン以外の追加ならフィードバックを出す
        if (!isScannerVisible) {
            Alert.alert('追加しました', `${item.name} をリストに追加しました`);
        }
    };

    const handleLoadTemplate = (template: MealTemplate) => {
        setScannedItems(prev => [...prev, ...template.items]);
        Alert.alert('反映しました', `マイセット「${template.name}」を追加しました`);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            Alert.alert('エラー', 'マイセット名を入力してください');
            return;
        }
        if (scannedItems.length === 0) {
            Alert.alert('エラー', '保存する食品がリストにありません');
            return;
        }
        try {
            // ★修正: ここでもデータをクリーニングして保存
            const cleanItems = sanitizeItems(scannedItems);

            await saveTemplate(templateName, cleanItems);
            setTemplateName('');
            Alert.alert('完了', '現在のリストをマイセットに保存しました');
            setActiveTab('myset'); // マイセットタブへ移動
        } catch (e) {
            console.error(e);
            Alert.alert('エラー', '保存できませんでした');
        }
    };

    const removeItem = (index: number) => {
        setScannedItems(prev => prev.filter((_, i) => i !== index));
    };

    // タブ描画コンポーネント
    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <Badge label="スキャン" onPress={() => setActiveTab('scan')} selected={activeTab === 'scan'} />
            <Badge label="履歴" onPress={() => setActiveTab('history')} selected={activeTab === 'history'} />
            <Badge label="マイセット" onPress={() => setActiveTab('myset')} selected={activeTab === 'myset'} />
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.pageTitle}>食事入力</Text>

                {/* 食品リスト (常に表示) */}
                {scannedItems.length > 0 && (
                    <Card style={styles.listCard} padding="none">
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>選択中の食品 ({scannedItems.length})</Text>
                            <TouchableOpacity onPress={() => setScannedItems([])}>
                                <Text style={{ color: '#EF4444', fontSize: 12 }}>全削除</Text>
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
                            <Text style={styles.totalLabel}>合計:</Text>
                            <Text style={styles.totalValue}>{totalCalories} kcal</Text>
                        </View>

                        {/* マイセット保存ボタン */}
                        <View style={styles.saveTemplateRow}>
                            <Input
                                placeholder="セット名 (例: 朝の定番)"
                                value={templateName}
                                onChangeText={setTemplateName}
                                containerStyle={{ marginBottom: 0, flex: 1 }}
                            />
                            <Button title="セット保存" size="sm" variant="outline" onPress={handleSaveTemplate} />
                        </View>
                    </Card>
                )}

                {renderTabs()}

                {/* タブごとのコンテンツ */}
                <View style={styles.tabContent}>
                    {activeTab === 'scan' && (
                        <View style={styles.scanAction}>
                            <Button
                                title="カメラを起動"
                                onPress={() => setScannerVisible(true)}
                                variant="primary"
                                icon={<Text style={{ fontSize: 18, marginRight: 8, color: 'white' }}>📷</Text>}
                            />
                            <Text style={styles.helperText}>バーコードを読み取って追加</Text>
                        </View>
                    )}

                    {activeTab === 'history' && (
                        <View>
                            {historyItems.length === 0 ? (
                                <Text style={styles.emptyText}>履歴がありません</Text>
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
                                <Text style={styles.emptyText}>マイセットがありません。{'\n'}食品を選択して「セット保存」してください。</Text>
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
                                        <Button title="このセットを追加" size="sm" onPress={() => handleLoadTemplate(tpl)} />
                                    </Card>
                                ))
                            )}
                        </View>
                    )}
                </View>

                {/* コメントと保存ボタン */}
                <Card style={styles.section}>
                    <Controller
                        control={control}
                        name="comment"
                        render={({ field: { onChange, value } }) => (
                            <Input label="メモ" value={value} onChangeText={onChange} multiline placeholder="一言メモ..." containerStyle={{ marginBottom: 0 }} />
                        )}
                    />
                </Card>

                <Button title={isSaving ? "保存中..." : "記録する"} onPress={handleSubmit(onSubmit)} size="lg" disabled={isSaving} />

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

    // Tabs
    tabContainer: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    tabContent: { minHeight: 150, marginBottom: 20 },

    listCard: { marginBottom: 24 },
    listHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between' },
    sectionTitle: { fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    totalLabel: { marginRight: 8 },
    totalValue: { fontWeight: 'bold', color: '#10B981', fontSize: 18 },

    // My Set Save
    saveTemplateRow: { padding: 12, backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', gap: 8 },

    scanAction: { alignItems: 'center', padding: 20 },
    helperText: { marginTop: 10, color: '#666' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20, lineHeight: 20 },
    section: { marginBottom: 24 },
    savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});