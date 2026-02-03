import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebaseConfig';
import { useAuthStore } from '../../../store/authStore';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';
import { Avatar } from '../../../ui/Avatar';
import { IconButton } from '../../../ui/IconButton';

export const ProfileEditForm = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || user.displayName || '');
      setBio(user.bio || '');
      setHeight(user.height ? String(user.height) : '');
      setWeight(user.weight ? String(user.weight) : '');
      setImageUri(user.profileImageUrl || user.photoURL || null);
    }
  }, [user]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("許可が必要です", "カメラロールへのアクセス許可が必要です");
      return;
    }
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

  const uploadImage = async (uri: string, uid: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${uid}/${Date.now()}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);

    try {
      let downloadUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        downloadUrl = await uploadImage(imageUri, user.uid);
      }

      const updatedData: any = {
        username,
        displayName: username,
        bio,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        profileImageUrl: downloadUrl,
        photoURL: downloadUrl,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });

      if (weight) {
        await addDoc(collection(db, 'users', user.uid, 'weightHistory'), {
          weight: Number(weight),
          date: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      updateUser(updatedData);
      Alert.alert(t('common.success', '成功'), t('common.saved', 'プロフィールを更新しました'));
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error', 'エラー'), t('common.saveFailed', '保存に失敗しました'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage}>
          <View>
            <Avatar uri={imageUri} size="xl" />
            <View style={styles.cameraIcon}>
              <IconButton
                name="camera"
                size={16}
                color="white"
                variant="ghost"
              />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>写真を変更</Text>
      </View>

      <View style={styles.form}>
        <Input
          label={t('profile.name', '名前')}
          value={username}
          onChangeText={setUsername}
          placeholder="ユーザー名"
          containerStyle={styles.inputGroup}
        />

        <Input
          label={t('profile.bio', '自己紹介')}
          value={bio}
          onChangeText={setBio}
          placeholder="ひとこと"
          multiline
          numberOfLines={3}
          containerStyle={styles.inputGroup}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label={`${t('profile.height', '身長')} (cm)`}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="170"
              containerStyle={styles.inputGroup}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              label={`${t('profile.weight', '体重')} (kg)`}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="60"
              containerStyle={styles.inputGroup}
            />
          </View>
        </View>

        <Button
          title={t('common.save', '保存する')}
          onPress={handleSave}
          loading={saving}
          variant="primary"
          style={{ marginTop: 20 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  changePhotoText: {
    color: '#3B82F6',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600'
  },
  form: {
    padding: 16
  },
  inputGroup: {
    marginBottom: 20
  },
  row: {
    flexDirection: 'row'
  },
});