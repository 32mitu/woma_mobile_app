import React from 'react';
import {
    View,
    Text,
    TextInput,
    TextInputProps,
    StyleSheet,
    ViewStyle,
    TextStyle
} from 'react-native';

interface InputProps extends TextInputProps {
    label?: string; // ラベル（任意）
    error?: string; // エラーメッセージ（ある場合のみ赤文字で表示）
    containerStyle?: ViewStyle; // 外側のコンテナスタイル
    labelStyle?: TextStyle;
    inputStyle?: TextStyle;
    rightElement?: React.ReactNode; // パスワード表示切替アイコンなどを置くためのスロット
}

export const Input = ({
    label,
    error,
    containerStyle,
    labelStyle,
    inputStyle,
    rightElement,
    style,
    ...props
}: InputProps) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {/* ラベル */}
            {label && (
                <Text style={[styles.label, error ? styles.textError : null, labelStyle]}>
                    {label}
                </Text>
            )}

            {/* 入力エリア */}
            <View style={[
                styles.inputContainer,
                error ? styles.borderError : styles.borderDefault,
                props.editable === false && styles.disabled,
                props.multiline && styles.textAreaContainer
            ]}>
                <TextInput
                    style={[
                        styles.input,
                        props.multiline && styles.textArea,
                        props.editable === false && styles.textDisabled,
                        style,
                    ]}
                    placeholderTextColor="#9CA3AF"
                    {...props}
                />
                {/* 右側のアイコンなど（必要な場合） */}
                {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
            </View>

            {/* エラーメッセージ */}
            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151', // Gray 700
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1F2937', // Gray 800
        minHeight: 48, // タップ領域確保
    },
    textAreaContainer: {
        alignItems: 'flex-start',
    },
    textArea: {
        textAlignVertical: 'top', // Androidで複数行の際、上詰めにする
        minHeight: 80,
    },
    rightElement: {
        paddingRight: 12,
    },
    // ボーダースタイル
    borderDefault: {
        borderColor: '#D1D5DB', // Gray 300
    },
    borderError: {
        borderColor: '#EF4444', // Red 500
    },
    // エラースタイル
    textError: {
        color: '#EF4444',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
    },
    // 無効化スタイル
    disabled: {
        backgroundColor: '#F3F4F6', // Gray 100
        borderColor: '#E5E7EB',
    },
    textDisabled: {
        color: '#9CA3AF',
    },
});
