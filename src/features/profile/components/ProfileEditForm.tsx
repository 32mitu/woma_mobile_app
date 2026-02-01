import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../../../firebaseConfig';
import { useAuthStore } from '../../../store/authStore'; // Zustandストア
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // i18nフック

export const ProfileEditForm = () => {
  const router = useRouter();
  const { t } = useTranslation();

  // Zustandからユーザー情報と更新アクションを取得
  // useAuth() の代わりに useAuthStore() を直接使うのがポイントです
  const { user, updateUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 初期値セット (userがnullでない場合のみ)
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setHeight(user.height ? String(user.height) : '');
      setWeight(user.weight ? String(user.weight) : '');
      setImageUri(user.profileImageUrl || null);
    }
  }, [user]);

  // 画像選択
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 保存処理
  const handleSave = async () => {
    if (!user || !auth.currentUser) return;
    setSaving(true);

    try {
      let finalImageUrl = user.profileImageUrl || null;

      // 1. 画像が変更されていればアップロード
      if (imageUri && imageUri !== user.profileImageUrl) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        // キャッシュ対策でファイル名にタイムスタンプ付与
        const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const newWeight = parseFloat(weight);
      const newHeight = parseFloat(height);

      const updateData = {
        username,
        bio,
        height: isNaN(newHeight) ? null : newHeight,
        weight: isNaN(newWeight) ? null : newWeight,
        profileImageUrl: finalImageUrl,
        updatedAt: serverTimestamp(), // Firestore用
      };

      // 2. Firestore更新
      const userRef = doc(db, 'users', user.uid);
      // 型エラー回避のため as any でキャストしつつマージ保存
      await setDoc(userRef, updateData, { merge: true });

      // 3. 体重が変わっていたら履歴にも保存
      const currentWeight = user.weight ? Number(user.weight) : 0;
      if (!isNaN(newWeight) && newWeight > 0 && newWeight !== currentWeight) {
        await addDoc(collection(db, 'healthRecords'), {
          userId: user.uid,
          weight: newWeight,
          createdAt: serverTimestamp(),
        });
      }

      // 4. ★ここがポイント: グローバルステートを即座に更新
      // FirestoreのonSnapshotを待たずにUIに反映させる
      updateUser({
        username,
        bio,
        height: isNaN(newHeight) ? undefined : newHeight,
        weight: isNaN(newWeight) ? undefined : newWeight,
        profileImageUrl: finalImageUrl,
      });

      // i18n対応したメッセージを表示
      Alert.alert(t('common.success', '成功'), t('profile.updateSuccess', 'プロフィールを更新しました'), [
        { text: "OK", onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error', 'エラー'), t('common.saveFailed', '保存に失敗しました'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={{ uri: imageUri || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>{t('profile.changePhoto', '写真を変更')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.username', 'ユーザー名')}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t('profile.usernamePlaceholder', 'ユーザー名')}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.bio', '自己紹介')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder={t('profile.bioPlaceholder', '自己紹介を入力')}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>{t('profile.height', '身長')} (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="170"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>{t('profile.weight', '体重')} (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="60"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveText}>{t('common.save', '保存する')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3B82F6', borderRadius: 15, width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white'
  },
  changePhotoText: { color: '#3B82F6', marginTop: 8, fontSize: 14, fontWeight: '600' },
  form: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, padding: 12, fontSize: 16, color: '#333'
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#3B82F6', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 12,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  disabled: { backgroundColor: '#9CA3AF' },
  saveText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});