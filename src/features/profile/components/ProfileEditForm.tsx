import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebaseConfig';
import { useAuthStore } from '../../../store/authStore';
import { useTranslation } from 'react-i18next';

// Hook Form & Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormData } from '../../../utils/validationSchemas';

// UI
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';
import { Avatar } from '../../../ui/Avatar';
import { IconButton } from '../../../ui/IconButton';

export const ProfileEditForm = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);

  // フォーム設定
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      height: '',
      weight: '',
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username || user.displayName || '',
        bio: user.bio || '',
        height: user.height ? String(user.height) : '',
        weight: user.weight ? String(user.weight) : '',
      });
      setImageUri(user.profileImageUrl || user.photoURL || null);
    }
  }, [user, reset]);

  // 画像選択ロジック (変更なし)
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

  const onSubmit = async (data: any) => {
    // data.height, data.weight はスキーマ定義により既に number | null に変換されています
    if (!user?.uid) return;

    try {
      let downloadUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http') && imageUri !== null) {
        downloadUrl = await uploadImage(imageUri, user.uid);
      }

      const updatedData = {
        username: data.username,
        displayName: data.username,
        bio: data.bio,
        height: data.height,
        weight: data.weight,
        profileImageUrl: downloadUrl,
        photoURL: downloadUrl,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });

      if (data.weight) {
        await addDoc(collection(db, 'users', user.uid, 'weightHistory'), {
          weight: data.weight,
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
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage}>
          <View>
            <Avatar uri={imageUri} size="xl" />
            <View style={styles.cameraIcon}>
              <IconButton name="camera" size={16} color="white" variant="ghost" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>写真を変更</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('profile.name', '名前')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message as string}
              placeholder="ユーザー名"
              containerStyle={styles.inputGroup}
            />
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('profile.bio', '自己紹介')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.bio?.message as string}
              placeholder="ひとこと"
              multiline
              numberOfLines={3}
              containerStyle={styles.inputGroup}
            />
          )}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Controller
              control={control}
              name="height"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={`${t('profile.height', '身長')} (cm)`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.height?.message as string}
                  keyboardType="numeric"
                  placeholder="170"
                  containerStyle={styles.inputGroup}
                />
              )}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Controller
              control={control}
              name="weight"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={`${t('profile.weight', '体重')} (kg)`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.weight?.message as string}
                  keyboardType="numeric"
                  placeholder="60"
                  containerStyle={styles.inputGroup}
                />
              )}
            />
          </View>
        </View>

        <Button
          title={t('common.save', '保存する')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
          style={{ marginTop: 20 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageSection: { alignItems: 'center', paddingVertical: 24 },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6',
    borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white'
  },
  changePhotoText: { color: '#3B82F6', marginTop: 8, fontSize: 14, fontWeight: '600' },
  form: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row' },
});