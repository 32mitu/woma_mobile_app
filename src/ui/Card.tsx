import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'flat'; // スタイルの種類
    padding?: 'none' | 'small' | 'medium' | 'large'; // 内部パディングの調整
    style?: ViewStyle;
}

export const Card = ({
    children,
    variant = 'elevated',
    padding = 'medium',
    style,
    ...props
}: CardProps) => {

    const getVariantStyle = () => {
        switch (variant) {
            case 'outlined':
                return styles.outlined;
            case 'flat':
                return styles.flat;
            case 'elevated':
            default:
                return styles.elevated;
        }
    };

    const getPaddingStyle = () => {
        switch (padding) {
            case 'none': return { padding: 0 };
            case 'small': return { padding: 12 };
            case 'large': return { padding: 24 };
            case 'medium':
            default: return { padding: 16 };
        }
    };

    return (
        <View
            style={[
                styles.base,
                getVariantStyle(),
                getPaddingStyle(),
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    // 浮き上がったカード (デフォルト)
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3, // Android用
        borderWidth: 0,
    },
    // 枠線付きカード
    outlined: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    // フラット (背景色のみ、影なし)
    flat: {
        backgroundColor: '#F9FAFB', // 薄いグレーなど
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
});