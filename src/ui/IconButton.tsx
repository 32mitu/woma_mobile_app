import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps extends TouchableOpacityProps {
  name: IconName; // Ioniconsの名前
  size?: number;
  color?: string;
  variant?: 'ghost' | 'filled' | 'outlined';
  style?: ViewStyle;
}

export const IconButton = ({
  name,
  size = 24,
  color = '#4B5563', // Gray 600
  variant = 'ghost',
  style,
  ...props
}: IconButtonProps) => {

  const getContainerStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: '#F3F4F6',
          borderRadius: size, // 丸くする
          padding: 8,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: size,
          padding: 8,
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
          padding: 4,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getContainerStyle(),
        style
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // タップ領域を広げる
      activeOpacity={0.6}
      {...props}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});