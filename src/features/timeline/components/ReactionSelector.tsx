import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { ReactionType } from '../../../types';

type Props = {
    visible: boolean;
    onSelect: (reaction: ReactionType) => void;
    currentReaction?: ReactionType | null;
};

const REACTIONS: { type: ReactionType; icon: string }[] = [
    { type: 'like', icon: '❤️' },
    { type: 'fire', icon: '🔥' },
    { type: 'muscle', icon: '💪' },
    { type: 'clap', icon: '👏' },
    { type: 'love', icon: '😍' },
];

export const ReactionSelector = ({ visible, onSelect, currentReaction }: Props) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            {REACTIONS.map((item) => (
                <TouchableOpacity
                    key={item.type}
                    style={[
                        styles.item,
                        currentReaction === item.type && styles.selectedItem
                    ]}
                    onPress={() => onSelect(item.type)}
                >
                    <Text style={styles.emoji}>{item.icon}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50, // いいねボタンの上に表示
        left: 10,
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 8,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
    },
    item: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    selectedItem: {
        backgroundColor: '#DBEAFE', // 選択中は薄い青
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    emoji: {
        fontSize: 24,
    },
});