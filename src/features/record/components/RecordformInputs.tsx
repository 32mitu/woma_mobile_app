import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      // 既存のリストに追加
      setImageUris([...imageUris, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newUris = [...imageUris];
    newUris.splice(index, 1);
    setImageUris(newUris);
  };

  return (
    <View style={styles.section}>
      {/* 体重 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>今の体重 (kg) <Text style={styles.optional}>任意</Text></Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="60.5"
        />
      </View>

      {/* コメント */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>一言コメント <Text style={styles.optional}>任意</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          placeholder="頑張った！"
        />
      </View>

      {/* 画像選択 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>写真 <Text style={styles.optional}>任意</Text></Text>
        <View style={styles.imageContainer}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.thumbnailWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <Ionicons name="close" size={12} color="white" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* タイムライン投稿スイッチ */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>タイムラインに投稿する</Text>
        <Switch value={postToTimeline} onValueChange={setPostToTimeline} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginVertical: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  optional: { fontSize: 12, color: '#9CA3AF', fontWeight: 'normal' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 70, height: 70, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
});