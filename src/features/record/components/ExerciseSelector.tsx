import React from 'react';
import { View, Text, Modal, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// 修正: パスを components/ui から ui に変更
import { ListItem } from '../../../ui/ListItem';
import { IconButton } from '../../../ui/IconButton';
import { Button } from '../../../ui/Button';

type Props = {
  visible: boolean;
  availableTypes: any[];
  onClose: () => void;
  onSelect: (type: any) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
};

export const ExerciseSelector = ({ visible, availableTypes, onClose, onSelect, onCreateNew, onDelete }: Props) => {

  const handleDelete = (item: any) => {
    Alert.alert(
      "運動種目の削除",
      `「${item.name}」を削除しますか？\nこの操作は取り消せません。`,
      [
        { text: "キャンセル", style: "cancel" },
        { text: "削除", style: "destructive", onPress: () => onDelete(item.id) }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <ListItem
      title={item.name}
      subtitle={item.custom ? 'カスタム' : 'デフォルト'}
      leftElement={
        <View style={[styles.iconContainer, item.custom && styles.customIcon]}>
          <Ionicons name={item.custom ? "star" : "bicycle"} size={20} color={item.custom ? "#D97706" : "#3B82F6"} />
        </View>
      }
      rightElement={
        item.custom ? (
          <IconButton name="trash-outline" color="#EF4444" onPress={() => handleDelete(item)} />
        ) : undefined
      }
      onPress={() => onSelect(item)}
      showChevron={!item.custom}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>運動を選択</Text>
          <IconButton name="close" size={24} onPress={onClose} />
        </View>

        <FlatList
          data={availableTypes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>登録された運動がありません</Text>}
        />

        <View style={styles.footer}>
          <Button
            title="新しい運動を作成"
            variant="outline"
            icon={<Ionicons name="add" size={20} color="#3B82F6" />}
            onPress={onCreateNew}
            style={styles.createButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  listContent: { paddingBottom: 20 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  customIcon: { backgroundColor: '#FFFBEB' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  createButton: { borderStyle: 'dashed' }
});