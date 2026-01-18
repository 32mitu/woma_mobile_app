import { useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { compressImage } from '../../utils/imageCompressor'; // ★追加: 画像圧縮ユーティリティ

export const useRecordSaver = () => {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const saveRecord = async (
    data: {
      activities: any[];
      weight: string;
      comment: string;
      imageUris: string[];
      postToTimeline: boolean;
    }
  ) => {
    if (!auth.currentUser) return;
    setSaving(true);

    try {
      const { activities, weight, comment, imageUris, postToTimeline } = data;
      const uid = auth.currentUser.uid;

      // 1. 画像圧縮 & アップロード処理
      // FirestoreのBatchには含められないため、先行して実行します
      let uploadedImageUrls: string[] = [];
      if (imageUris.length > 0) {
        const uploadPromises = imageUris.map(async (uri, index) => {
          try {
            // ★ここが変更点: アップロード前に圧縮
            const compressedUri = await compressImage(uri);

            const response = await fetch(compressedUri);
            const blob = await response.blob();

            // ファイル名を安全に生成 (拡張子はjpg固定)
            const filename = `records/${uid}/${Date.now()}_${index}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
          } catch (uploadError) {
            console.error(`画像(${index})のアップロード失敗:`, uploadError);
            throw uploadError;
          }
        });
        uploadedImageUrls = await Promise.all(uploadPromises);
      }

      // 2. データのサニタイズ（数値変換など）
      const sanitizedActivities = activities.map(act => ({
        id: act.id,
        name: act.name || '名称不明',
        intensity: act.intensity || '中',
        duration: Number(act.duration) || 0,
        steps: act.steps ? Number(act.steps) : 0,
        mets: Number(act.mets) || 0,
        baseMets: {
          low: Number(act.baseMets?.low) || 0,
          mid: Number(act.baseMets?.mid) || 0,
          high: Number(act.baseMets?.high) || 0,
        }
      }));

      // 3. Batch処理の開始（データ不整合を防ぐため一括保存）
      const batch = writeBatch(db);

      // A. 運動記録の作成
      const recordRef = doc(collection(db, 'exerciseRecords'));
      const recordData = {
        uid,
        userId: uid, // グラフ表示用
        activities: sanitizedActivities,
        weight: weight ? Number(weight) : null,
        comment: comment || '',
        imageUrls: uploadedImageUrls,
        imageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null, // サムネイル用
        createdAt: serverTimestamp(),
      };
      batch.set(recordRef, recordData);

      // B. 体重記録 (ある場合)
      if (weight) {
        const weightRef = doc(collection(db, 'healthRecords'));
        batch.set(weightRef, {
          userId: uid,
          weight: Number(weight),
          createdAt: serverTimestamp(),
        });
      }

      // C. タイムライン投稿 (ある場合)
      if (postToTimeline) {
        const timelineRef = doc(collection(db, 'timeline'));
        batch.set(timelineRef, {
          ...recordData,
          recordId: recordRef.id, // 運動記録IDとの紐付け
          username: auth.currentUser.displayName || 'ユーザー',
          userIcon: auth.currentUser.photoURL || null,
          likes: 0,
          comments: 0,
          type: 'record',
        });
      }

      // 4. 一括コミット（ここで初めてFirestoreに書き込まれます）
      await batch.commit();

      router.replace('/(tabs)/home');

    } catch (error) {
      console.error("保存エラー:", error);
      Alert.alert("エラー", "記録の保存に失敗しました。通信環境を確認してもう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return { saveRecord, saving };
};