import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
    View
} from 'react-native';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg'; // サイズ定義がない場合はデフォルトmdとして扱いますが、拡張性を考慮して型のみ追加しておきます

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: ButtonVariant;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button = ({
    title,
    variant = 'primary',
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
    onPress,
    ...props
}: ButtonProps) => {

    const getVariantStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondary;
            case 'danger':
                return styles.danger;
            case 'outline':
                return styles.outline;
            case 'ghost':
                return styles.ghost;
            case 'primary':
            default:
                return styles.primary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'secondary':
            case 'outline':
                return styles.textPrimary;
            case 'ghost':
                return styles.textGhost;
            case 'danger':
            case 'primary':
            default:
                return styles.textWhite;
        }
    };

    // インジケーターの色決定
    const getIndicatorColor = () => {
        if (variant === 'outline' || variant === 'ghost' || variant === 'secondary') {
            return '#3B82F6'; // Primary Color
        }
        return '#FFFFFF';
    };

    // Hapticsを追加したプレスハンドラ
    const handlePress = (e: any) => {
        if (disabled || loading) return;

        // 軽量な触覚フィードバックを発火
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
            // Hapticsがサポートされていない環境などでのエラーは無視
        });

        if (onPress) {
            onPress(e);
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.base,
                getVariantStyle(),
                (disabled || loading) && styles.disabled,
                style
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getIndicatorColor()} />
            ) : (
                <>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={[styles.textBase, getTextStyle(), textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        height: 48,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // デフォルトの影 (Primaryなどで有効)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        marginRight: 8,
    },

    // Variants
    primary: {
        backgroundColor: '#3B82F6',
        borderWidth: 0,
    },
    secondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    danger: {
        backgroundColor: '#EF4444',
        borderWidth: 0,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3B82F6',
        shadowOpacity: 0,
        elevation: 0,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
    disabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
        borderColor: 'transparent',
    },

    // Text Styles
    textBase: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textPrimary: {
        color: '#3B82F6',
    },
    textGhost: {
        color: '#4B5563',
    },
});