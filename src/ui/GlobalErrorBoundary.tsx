import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from './Button'; // 既存の共通ボタンを使用

// エラー時に表示されるフォールバックUI
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>😢</Text>
            <Text style={styles.title}>予期せぬエラーが発生しました</Text>
            <Text style={styles.message}>{error.message}</Text>

            <Button
                title="アプリを再起動（リロード）"
                onPress={resetErrorBoundary}
                variant="primary"
                style={styles.button}
            />
        </View>
    );
};

// アプリ全体を囲むラッパーコンポーネント
export const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            // エラー発生時のログ送信などはここで行う
            onError={(error) => console.error("Global Error Caught:", error)}
        >
            {children}
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1F2937',
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#EF4444',
        marginBottom: 32,
        textAlign: 'center',
    },
    button: {
        width: '100%',
    }
});