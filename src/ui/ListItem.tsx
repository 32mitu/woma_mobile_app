import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ListItemProps {
    title: string;
    subtitle?: string;
    leftElement?: React.ReactNode; // 左側のアイコンやAvatar
    rightElement?: React.ReactNode; // 右側のスイッチ、バッジ、チェックマーク等
    onPress?: () => void; // 指定がない場合はタップ不可の行として表示
    showChevron?: boolean; // 右端に矢印を表示するか
    danger?: boolean; // 削除アクションなどの場合（赤文字）
    style?: ViewStyle;
    titleStyle?: TextStyle;
}

export const ListItem = ({
    title,
    subtitle,
    leftElement,
    rightElement,
    onPress,
    showChevron = false,
    danger = false,
    style,
    titleStyle,
}: ListItemProps) => {
    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component
            style={[styles.container, style]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.7}
        >
            {/* 左側要素 (アイコンなど) */}
            {leftElement && <View style={styles.left}>{leftElement}</View>}

            {/* メインテキスト */}
            <View style={styles.content}>
                <Text
                    style={[
                        styles.title,
                        danger && styles.textDanger,
                        titleStyle
                    ]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                {subtitle && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {subtitle}
                    </Text>
                )}
            </View>

            {/* 右側要素 */}
            <View style={styles.right}>
                {rightElement}
                {showChevron && (
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF" // Gray 400
                        style={styles.chevron}
                    />
                )}
            </View>
        </Component>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F3F4F6', // Gray 100
    },
    left: {
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        color: '#1F2937', // Gray 800
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280', // Gray 500
        marginTop: 2,
    },
    textDanger: {
        color: '#EF4444', // Red 500
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    chevron: {
        marginLeft: 4,
    }
});