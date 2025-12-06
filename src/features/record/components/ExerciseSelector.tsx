import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  availableTypes: any[];
  onClose: () => void;
  onSelect: (type: any) => void;
  onCreateNew: () => void; // 新規作成への導線
};

export const ExerciseSelector = ({ visible, availableTypes, onClose, onSelect, onCreateNew }: Props) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>運動を選択</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={availableTypes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <TouchableOpacity style={styles.createBtn} onPress={onCreateNew}>
              <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
              <Text style={styles.createBtnText}>新しい運動種目を作成</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View style={[styles.iconContainer, item.isCustom && styles.customIcon]}>
                <Ionicons 
                  name={item.isCustom ? "star" : "fitness"} 
                  size={24} 
                  color={item.isCustom ? "#F59E0B" : "#3B82F6"} 
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.isCustom && <Text style={styles.customBadge}>カスタム</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  list: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  customIcon: { backgroundColor: '#FFFBEB' },
  itemName: { fontSize: 16, color: '#333' },
  customBadge: { fontSize: 10, color: '#F59E0B' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#3B82F6', borderStyle: 'dashed', borderRadius: 8 },
  createBtnText: { color: '#3B82F6', fontWeight: 'bold', marginLeft: 8 },
});