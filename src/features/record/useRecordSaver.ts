import { useState } from 'react';
// ★ getDoc を追加
import { collection, doc, serverTimestamp, writeBatch, increment, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { compressImage } from '../../utils/imageCompressor';

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

      // カロリー計算用の体重 (入力があればそれを使用、なければ仮で60kg)
      const userWeight = weight ? Number(weight) : 60;

      // ★追加: 最新のユーザー情報をFirestoreから取得
      // (auth.currentUser.displayName は更新が遅れる/反映されないことがあるため)
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Firestoreのデータ > Authのデータ > デフォルト値 の優先順位で名前を決定
      const currentUsername = userData.name || auth.currentUser.displayName || 'ユーザー';
      // アイコンも同様 (フィールド名はアプリのデータ構造に合わせて iconUrl や photoURL を参照)
      const currentUserIcon = userData.iconUrl || userData.photoURL || auth.currentUser.photoURL || null;

      // 1. 画像圧縮 & アップロード処理
      let uploadedImageUrls: string[] = [];
      if (imageUris.length > 0) {
        const uploadPromises = imageUris.map(async (uri, index) => {
          try {
            // アップロード前に圧縮
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

      // 2. データのサニタイズ（数値変換 & 合計計算）
      let totalSteps = 0;
      let totalCalories = 0;
      let totalDistance = 0;

      const sanitizedActivities = activities.map(act => {
        // 数値変換
        const duration = Number(act.duration) || 0;
        const steps = act.steps ? Number(act.steps) : 0;
        const distance = act.distance ? Number(act.distance) : 0;
        const mets = Number(act.mets) || 0;

        // ★カロリー計算ロジック
        let calories = act.calories ? Number(act.calories) : 0;

        if (calories === 0 && mets > 0 && duration > 0) {
          // METs法: カロリー = METs × 体重(kg) × 時間(h) × 1.05
          const hours = duration / 60;
          calories = Math.round(mets * userWeight * hours * 1.05);
        }

        // 合計への加算
        totalSteps += steps;
        totalCalories += calories;
        totalDistance += distance;

        return {
          id: act.id,
          name: act.name || '名称不明',
          intensity: act.intensity || '中',
          duration: duration,
          steps: steps,
          calories: calories, // 計算後の値を保存
          distance: distance, // 距離も保存
          mets: mets,
          baseMets: {
            low: Number(act.baseMets?.low) || 0,
            mid: Number(act.baseMets?.mid) || 0,
            high: Number(act.baseMets?.high) || 0,
          }
        };
      });

      // 3. Batch処理の開始
      const batch = writeBatch(db);

      // A. 運動記録の作成
      const recordRef = doc(collection(db, 'exerciseRecords'));
      const recordData = {
        uid,
        userId: uid, // グラフ表示用
        activities: sanitizedActivities,
        totalCalories, // 合計カロリー (計算済み)
        totalSteps,    // 合計歩数
        totalDistance, // 合計距離
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

      // C. ユーザー統計情報の更新
      const userRef = doc(db, 'users', uid);
      batch.set(userRef, {
        stats: {
          totalSteps: increment(totalSteps),
          totalCalories: increment(totalCalories),
          totalDistance: increment(totalDistance),
        },
        lastLogDate: new Date().toISOString().split('T')[0]
      }, { merge: true });

      // D. タイムライン投稿 (ある場合)
      if (postToTimeline) {
        const timelineRef = doc(collection(db, 'timeline'));
        batch.set(timelineRef, {
          ...recordData,
          recordId: recordRef.id,
          // ★修正: 取得した最新のユーザー情報を使用
          username: currentUsername,
          userIcon: currentUserIcon,
          likes: 0,
          comments: 0,
          type: 'record',
        });
      }

      // 4. 一括コミット
      await batch.commit();

      // ★修正: replaceではなくnavigateを使用して、戻る動作のエラーを防ぐ
      router.navigate('/(tabs)/home');

    } catch (error) {
      console.error("保存エラー:", error);
      Alert.alert("エラー", "記録の保存に失敗しました。通信環境を確認してもう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return { saveRecord, saving };
};