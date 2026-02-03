import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

type BadgeVariant = 'default' | 'outline' | 'ghost';
type BadgeColor = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    color?: BadgeColor;
    size?: BadgeSize;
    icon?: React.ReactNode; // 左側のアイコン（任意）
    onPress?: () => void;   // 指定するとボタン（Chip）として機能
    selected?: boolean;     // 選択状態（トグル用）
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Badge = ({
    label,
    variant = 'default',
    color = 'primary',
    size = 'md',
    icon,
    onPress,
    selected = false,
    style,
    textStyle
}: BadgeProps) => {

    // 背景色の決定
    const getBackgroundColor = () => {
        if (variant === 'outline' || variant === 'ghost') return 'transparent';

        // 選択状態またはDefaultバリアント
        if (selected || variant === 'default') {
            switch (color) {
                case 'danger': return '#FEE2E2'; // Red 100
                case 'success': return '#D1FAE5'; // Green 100
                case 'warning': return '#FEF3C7'; // Amber 100
                case 'secondary': return '#F3F4F6'; // Gray 100
                case 'primary':
                default: return '#DBEAFE'; // Blue 100
            }
        }
        return '#F3F4F6'; // 未選択時 (Gray 100)
    };

    // 文字色の決定
    const getTextColor = () => {
        // 選択されていないChipはグレー文字
        if (onPress && !selected && variant !== 'outline') {
            return '#6B7280';
        }

        switch (color) {
            case 'danger': return '#EF4444';
            case 'success': return '#059669';
            case 'warning': return '#D97706';
            case 'secondary': return '#4B5563';
            case 'primary':
            default: return '#2563EB'; // Blue 600
        }
    };

    const Component = onPress ? TouchableOpacity : View;
    const paddingVertical = size === 'sm' ? 2 : 4;
    const paddingHorizontal = size === 'sm' ? 8 : 12;
    const fontSize = size === 'sm' ? 11 : 12;

    return (
        <Component
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.base,
                {
                    backgroundColor: getBackgroundColor(),
                    paddingVertical,
                    paddingHorizontal,
                    borderColor: variant === 'outline' ? getTextColor() : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                style
            ]}
        >
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
                styles.text,
                { color: getTextColor(), fontSize },
                textStyle
            ]}>
                {label}
            </Text>
        </Component>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 9999, // 完全な丸み
        alignSelf: 'flex-start', // コンテンツ幅に合わせる
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    iconContainer: {
        marginRight: 4,
    }
});