import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/Input';
import { Card } from '../../../../ui/Card';
import { ListItem } from '../../../../ui/ListItem'; // 追加
import { IconButton } from '../../../../ui/IconButton'; // 追加
import { BarcodeScanner, ScannedFoodData } from './BarcodeScanner';

export const MealForm = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            comment: '',
        },
    });

    const [isScannerVisible, setScannerVisible] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedFoodData[]>([]);

    const onSubmit = (data: any) => {
        console.log('保存データ:', { ...data, items: scannedItems });
        Alert.alert('保存完了', `食事: ${scannedItems.length}件\nメモ: ${data.comment}`);
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

                {/* スキャンボタンエリア */}
                <View style={styles.actionContainer}>
                    <Button
                        title="バーコードをスキャン"
                        onPress={() => setScannerVisible(true)}
                        variant="primary"
                        icon={<Text style={{ fontSize: 18, marginRight: 8 }}>📷</Text>}
                    />
                    <Text style={styles.helperText}>
                        商品バーコードを読み取って自動入力
                    </Text>
                </View>

                {/* スキャン済みリスト (ListItemを使用) */}
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

                {/* 食事メモ */}
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
                                containerStyle={{ marginBottom: 0 }} // Cardのpaddingがあるので調整
                            />
                        )}
                    />
                </Card>

                {/* 保存ボタン */}
                <View style={styles.footer}>
                    <Button
                        title="食事を記録する"
                        onPress={handleSubmit(onSubmit)}
                        size="lg" // Button.tsxにsize定義があれば有効、なければvariantで調整
                        variant="secondary"
                    />
                </View>
            </ScrollView>

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
        overflow: 'hidden', // 角丸を維持
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
    }
});