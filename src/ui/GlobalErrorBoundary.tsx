import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from './Button';
import i18n from '../i18n';

// エラー時に表示されるフォールバックUI
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>😢</Text>
            <Text style={styles.title}>{i18n.t('errorBoundary.title')}</Text>
            <Text style={styles.message}>{error.message}</Text>

            <Button
                title={i18n.t('errorBoundary.reload')}
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