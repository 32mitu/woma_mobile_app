import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

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
            case 'primary':
            case 'danger':
            default:
                return styles.textWhite;
        }
    };

    const isButtonDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                getVariantStyle(),
                isButtonDisabled && styles.disabled,
                // outline/ghostの場合は無効時のボーダー色なども調整
                (variant === 'outline' || variant === 'ghost') && isButtonDisabled && styles.disabledTransparent,
                style,
            ]}
            disabled={isButtonDisabled}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' || variant === 'danger' ? '#fff' : '#3B82F6'}
                />
            ) : (
                <>
                    {icon && icon}
                    <Text
                        style={[
                            styles.textBase,
                            getTextStyle(),
                            isButtonDisabled && styles.textDisabled,
                            !!icon && { marginLeft: 8 },
                            textStyle
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        paddingVertical: 14,
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

    disabledTransparent: {
        backgroundColor: 'transparent',
        borderColor: '#9CA3AF',
    },

    textBase: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textWhite: { color: '#FFFFFF' },
    textPrimary: { color: '#3B82F6' },
    textGhost: { color: '#4B5563' },
    textDisabled: { color: '#F3F4F6' },
});