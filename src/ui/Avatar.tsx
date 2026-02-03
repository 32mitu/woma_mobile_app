import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
    uri?: string | null;
    size?: AvatarSize;
    style?: ViewStyle;
    imageStyle?: ImageStyle;
}

// サイズ定義
const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
    xxl: 128,
};

export const Avatar = ({ uri, size = 'md', style, imageStyle }: AvatarProps) => {
    const dimension = sizeMap[size];
    const borderRadius = dimension / 2;

    return (
        <View style={[
            styles.container,
            { width: dimension, height: dimension, borderRadius },
            style
        ]}>
            {uri ? (
                <Image
                    source={{ uri }}
                    style={[
                        styles.image,
                        { width: dimension, height: dimension, borderRadius },
                        imageStyle
                    ]}
                />
            ) : (
                // 画像がない場合のフォールバック (グレー背景 + アイコン)
                <View style={[
                    styles.fallback,
                    { width: dimension, height: dimension, borderRadius }
                ]}>
                    <Ionicons
                        name="person"
                        size={dimension * 0.5}
                        color="#9CA3AF" // Gray 400
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3F4F6', // ロード中の背景色
        overflow: 'hidden',
    },
    image: {
        resizeMode: 'cover',
    },
    fallback: {
        backgroundColor: '#E5E7EB', // Gray 200
        justifyContent: 'center',
        alignItems: 'center',
    },
});