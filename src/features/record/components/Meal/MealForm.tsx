import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/Input';
import { Card } from '../../../../ui/Card';

export const MealForm = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            comment: '',
        },
    });

    const onSubmit = (data: any) => {
        Alert.alert('開発中', '食事記録機能は次週実装予定です！\n(バーコード検索・栄養計算など)');
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>今日の食事</Text>

                {/* 開発中プレースホルダー */}
                <View style={styles.placeholderContainer}>
                    <Text style={styles.emoji}>🍱</Text>
                    <Text style={styles.placeholderTitle}>食事記録機能</Text>
                    <Text style={styles.placeholderText}>
                        バーコード読み取りや{'\n'}食品データベース検索を準備中です。{'\n'}次週のアップデートをお楽しみに！
                    </Text>
                    <View style={styles.disabledButtonContainer}>
                        <Button title="📸 写真で解析 (AI)" variant="outline" size="sm" disabled />
                    </View>
                </View>

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
                            />
                        )}
                    />
                </Card>

                {/* 保存ボタン（モック） */}
                <View style={styles.footer}>
                    <Button
                        title="食事を記録する"
                        onPress={handleSubmit(onSubmit)}
                        size="lg"
                        variant="secondary" // 食事は色を変えて区別
                    />
                </View>
            </ScrollView>
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
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 24,
    },
    emoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    placeholderTitle: {
        color: '#4B5563',
        fontWeight: 'bold',
        fontSize: 18,
    },
    placeholderText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    disabledButtonContainer: {
        marginTop: 24,
        opacity: 0.5,
    },
    section: {
        marginBottom: 24,
    },
    footer: {
        marginTop: 10,
        paddingBottom: 40,
    }
});