import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/Input';
import { Card } from '../../../../ui/Card';
import { ListItem } from '../../../../ui/ListItem';
import { IconButton } from '../../../../ui/IconButton';
import { BarcodeScanner, ScannedFoodData } from './BarcodeScanner';

// --- Firebase / Auth ---
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../auth/useAuth';

export const MealForm = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const { control, handleSubmit } = useForm({
        defaultValues: {
            comment: '',
        },
    });

    const [isScannerVisible, setScannerVisible] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedFoodData[]>([]);

    // 保存処理
    const onSubmit = async (data: any) => {
        if (!user) {
            Alert.alert('エラー', 'ログインが必要です');
            return;
        }

        if (scannedItems.length === 0 && !data.comment) {
            Alert.alert('エラー', '食べたものかメモを入力してください');
            return;
        }

        setIsSaving(true);
        const totalCalories = scannedItems.reduce((sum, item) => sum + item.calories, 0);

        try {
            const db = getFirestore();

            // meal_records コレクションに保存
            await addDoc(collection(db, 'meal_records'), {
                userId: user.uid,             // ユーザーID
                type: 'meal',                 // 記録タイプ
                items: scannedItems,          // 食品リスト
                comment: data.comment,        // メモ
                totalCalories: totalCalories, // 合計カロリー
                createdAt: serverTimestamp(), // サーバー時間
                date: new Date().toISOString() // アプリ側の日時
            });

            Alert.alert('保存完了', '食事の記録を保存しました！', [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ]);

        } catch (e: any) {
            console.error("Error adding document: ", e);
            Alert.alert('保存エラー', 'データの保存に失敗しました。通信環境を確認してください。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleScanned = (data: ScannedFoodData) => {
        setScannedItems(prev => [...prev, data]);
    };

    const removeItem = (index: number) => {
        setScannedItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalCalories = scannedItems.reduce((sum, item) => sum + item.calories, 0);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>今日の食事</Text>

                <View style={styles.actionContainer}>
                    <Button
                        title="バーコードをスキャン"
                        onPress={() => setScannerVisible(true)}
                        variant="primary"
                        icon={<Text style={{ fontSize: 18, marginRight: 8 }}>📷</Text>}
                        disabled={isSaving}
                    />
                    <Text style={styles.helperText}>
                        商品バーコードを読み取って自動入力
                    </Text>
                </View>

                {scannedItems.length > 0 && (
                    <Card style={styles.listCard} padding="none">
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>食べたもの ({scannedItems.length})</Text>
                        </View>

                        {scannedItems.map((item, index) => (
                            <ListItem
                                key={index}
                                title={item.name}
                                subtitle={`${item.calories} kcal`}
                                rightElement={
                                    <IconButton
                                        name="trash-outline"
                                        size={20}
                                        color="#EF4444"
                                        onPress={() => removeItem(index)}
                                        disabled={isSaving}
                                    />
                                }
                                style={index === scannedItems.length - 1 ? { borderBottomWidth: 0 } : {}}
                            />
                        ))}

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>合計:</Text>
                            <Text style={styles.totalValue}>{totalCalories} kcal</Text>
                        </View>
                    </Card>
                )}

                <Card style={styles.section}>
                    <Controller
                        control={control}
                        name="comment"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                label="食事メモ"
                                placeholder="ランチは控えめに..."
                                multiline
                                numberOfLines={3}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                containerStyle={{ marginBottom: 0 }}
                                editable={!isSaving}
                            />
                        )}
                    />
                </Card>

                <View style={styles.footer}>
                    <Button
                        title={isSaving ? "保存中..." : "食事を記録する"}
                        onPress={handleSubmit(onSubmit)}
                        size="lg"
                        variant="secondary"
                        disabled={isSaving}
                    />
                </View>
            </ScrollView>

            {isSaving && (
                <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#fff' }}>クラウドに保存中...</Text>
                </View>
            )}

            <BarcodeScanner
                visible={isScannerVisible}
                onClose={() => setScannerVisible(false)}
                onScanned={handleScanned}
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
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#1F2937'
    },
    actionContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    helperText: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 8,
    },
    listCard: {
        marginBottom: 24,
        overflow: 'hidden',
    },
    listHeader: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    totalLabel: {
        fontSize: 16,
        color: '#374151',
        marginRight: 8,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
    },
    section: {
        marginBottom: 24,
    },
    footer: {
        marginTop: 10,
        paddingBottom: 40,
    },
    savingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    }
});