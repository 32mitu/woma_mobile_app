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

// バリエーションの定義
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: ButtonVariant;
    loading?: boolean;
    icon?: React.ReactNode; // アイコンを左側に表示する場合
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

    // バリエーションごとのスタイル定義
    const getVariantStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondary;
            case 'danger':
                return styles.danger;
            case 'outline':
                return styles.outline;
            case 'primary':
            default:
                return styles.primary;
        }
    };

    // テキスト色の決定
    const getTextStyle = () => {
        switch (variant) {
            case 'secondary':
            case 'outline':
                return styles.textPrimary; // 青文字
            case 'primary':
            case 'danger':
            default:
                return styles.textWhite; // 白文字
        }
    };

    // 無効化状態の判定 (loading中も押せないようにする)
    const isButtonDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                getVariantStyle(),
                isButtonDisabled && styles.disabled, // 無効化スタイル
                variant === 'outline' && isButtonDisabled && styles.disabledOutline, // Outline用の無効化微調整
                style,
            ]}
            disabled={isButtonDisabled}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' || variant === 'secondary' ? '#3B82F6' : '#fff'}
                />
            ) : (
                <>
                    {icon && icon}
                    <Text
                        style={[
                            styles.textBase,
                            getTextStyle(),
                            isButtonDisabled && styles.textDisabled,
                            !!icon && { marginLeft: 8 }, // アイコンがある場合は余白を追加
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
    // ベースとなる形状
    base: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // 共通の影設定 (primary/danger用)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    // バリエーション: Primary (通常ボタン)
    primary: {
        backgroundColor: '#3B82F6', // Blue 500
        borderWidth: 0,
    },

    // バリエーション: Secondary (白背景、控えめなボタン)
    secondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB', // Gray 200
    },

    // バリエーション: Danger (削除・警告ボタン)
    danger: {
        backgroundColor: '#EF4444', // Red 500
        borderWidth: 0,
    },

    // バリエーション: Outline (枠線のみ、背景透過)
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3B82F6',
        shadowOpacity: 0, // Outlineは影なし
        elevation: 0,
    },

    // 状態: Disabled (無効化)
    disabled: {
        backgroundColor: '#9CA3AF', // Gray 400
        shadowOpacity: 0,
        elevation: 0,
        borderColor: 'transparent',
    },

    // OutlineのDisabled時は背景色を変えず、枠線をグレーにする
    disabledOutline: {
        backgroundColor: 'transparent',
        borderColor: '#9CA3AF',
    },

    // テキスト基本スタイル
    textBase: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // テキスト色
    textWhite: {
        color: '#FFFFFF',
    },
    textPrimary: {
        color: '#3B82F6',
    },
    textDisabled: {
        color: '#F3F4F6', // Gray 100 (背景がグレーの場合に見やすい色)
    },
});