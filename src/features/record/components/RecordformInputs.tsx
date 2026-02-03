import React from 'react';
import { View, Text, StyleSheet, Switch, Alert, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
// 修正: パスを components/ui から ui に変更
import { Input } from '../../../ui/Input';

type Props = {
  weight: string;
  setWeight: (v: string) => void;
  comment: string;
  setComment: (v: string) => void;
  imageUris: string[];
  setImageUris: (uris: string[]) => void;
  postToTimeline: boolean;
  setPostToTimeline: (v: boolean) => void;
};

export const RecordFormInputs = ({
  weight, setWeight,
  comment, setComment,
  imageUris, setImageUris,
  postToTimeline, setPostToTimeline
}: Props) => {

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("アクセス許可が必要です", "カメラロールへのアクセスを許可してください。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImageUris([...imageUris, ...newUris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    const newUris = [...imageUris];
    newUris.splice(index, 1);
    setImageUris(newUris);
  };

  return (
    <View style={styles.container}>
      <Input
        label="今日の体重 (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="例: 60.5"
        containerStyle={styles.inputGap}
        rightElement={<Text style={styles.unitText}>kg</Text>}
      />

      <Input
        label="ひとことメモ"
        value={comment}
        onChangeText={setComment}
        placeholder="今日の運動の感想や体調など"
        multiline
        numberOfLines={4}
        containerStyle={styles.inputGap}
      />

      <View style={styles.section}>
        <Text style={styles.label}>写真 (最大5枚)</Text>
        <View style={styles.imageContainer}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.thumbnailWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          {imageUris.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>タイムラインに投稿する</Text>
        <Switch
          value={postToTimeline}
          onValueChange={setPostToTimeline}
          trackColor={{ false: "#767577", true: "#3B82F6" }}
          thumbColor={postToTimeline ? "#fff" : "#f4f3f4"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  inputGap: { marginBottom: 20 },
  unitText: { color: '#6B7280', fontWeight: 'bold' },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginVertical: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#eee' },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 12 },
  addImageButton: {
    width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
  },
});