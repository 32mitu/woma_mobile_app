import { useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch, increment, getDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../../firebaseConfig';
import { Alert } from 'react-native';
import { compressImage } from '../../utils/imageCompressor';
import { calculateStreak, getLocalDateString, checkNewBadges } from '../../utils/gamificationUtils';
import { Badge } from '../../data/badges';

export interface SavedRecordResult {
  totalCalories: number;
  totalSteps: number;
  activities: any[];
  imageUrls: string[];
  streak: number;
  displayBadges: string[];
  newlyEarnedBadges: Badge[];
}

export const useRecordSaver = () => {
  const [saving, setSaving] = useState(false);

  const saveRecord = async (
    data: {
      activities: any[];
      weight: string;
      comment: string;
      imageUris: string[];
      postToTimeline: boolean;
    }
  ): Promise<SavedRecordResult | null> => {
    if (!auth.currentUser) return null;
    setSaving(true);

    try {
      const { activities, weight, comment, imageUris, postToTimeline } = data;
      const uid = auth.currentUser.uid;
      const userWeight = weight ? Number(weight) : 60;

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const currentUsername = userData.username || auth.currentUser.displayName || 'ユーザー';
      const currentUserIcon = userData.profileImageUrl || userData.photoURL || auth.currentUser.photoURL || null;

      // 1. 画像処理
      let uploadedImageUrls: string[] = [];
      if (imageUris.length > 0) {
        const uploadPromises = imageUris.map(async (uri, index) => {
          const compressedUri = await compressImage(uri);
          const response = await fetch(compressedUri);
          const blob = await response.blob();
          const filename = `records/${uid}/${Date.now()}_${index}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          return await getDownloadURL(storageRef);
        });
        const results = await Promise.allSettled(uploadPromises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            uploadedImageUrls.push(result.value);
          } else {
            console.error(`画像(${index})のアップロード失敗:`, result.reason);
          }
        });
      }

      // 2. データ集計
      let totalSteps = 0;
      let totalCalories = 0;
      let totalDistance = 0;

      const sanitizedActivities = activities.map(act => {
        const duration = Number(act.duration) || 0;
        const steps = act.steps ? Number(act.steps) : 0;
        const distance = act.distance ? Number(act.distance) : 0;
        const mets = Number(act.mets) || 0;
        let calories = act.calories ? Number(act.calories) : 0;

        if (calories === 0 && mets > 0 && duration > 0) {
          const hours = duration / 60;
          calories = Math.round(mets * userWeight * hours * 1.05);
        }

        totalSteps += steps;
        totalCalories += calories;
        totalDistance += distance;

        return {
          id: act.id,
          name: act.name || '名称不明',
          intensity: act.intensity || '中',
          duration: duration,
          steps: steps,
          calories: calories,
          distance: distance,
          mets: mets,
          baseMets: {
            low: Number(act.baseMets?.low) || 0,
            mid: Number(act.baseMets?.mid) || 0,
            high: Number(act.baseMets?.high) || 0,
          }
        };
      });

      // ストリーク・バッジ判定
      const todayStr = getLocalDateString();
      const currentStreak = userData.streak || 0;
      const lastLogDate = userData.lastLogDate;

      const streakAction = calculateStreak(lastLogDate, todayStr);

      let newStreak = currentStreak;
      if (streakAction === 'increment') {
        newStreak += 1;
      } else if (streakAction === 'reset' || typeof streakAction === 'number') {
        newStreak = 1;
      }

      const earnedBadges = checkNewBadges(userData.badges || [], {
        steps: totalSteps,
        streak: newStreak,
        totalCalories: totalCalories
      });

      // 3. Batch書き込み
      const batch = writeBatch(db);

      // A. 運動記録
      const recordRef = doc(collection(db, 'exerciseRecords'));
      const recordData = {
        uid,
        userId: uid,
        activities: sanitizedActivities,
        totalCalories,
        totalSteps,
        totalDistance,
        weight: weight ? Number(weight) : null,
        comment: comment || '',
        imageUrls: uploadedImageUrls,
        imageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null,
        createdAt: serverTimestamp(),
      };
      batch.set(recordRef, recordData);

      // B. 体重記録
      if (weight) {
        const weightRef = doc(collection(db, 'healthRecords'));
        batch.set(weightRef, {
          userId: uid,
          weight: Number(weight),
          createdAt: serverTimestamp(),
        });
      }

      // C. ユーザー更新
      const userUpdateData: any = {
        stats: {
          totalSteps: increment(totalSteps),
          totalCalories: increment(totalCalories),
          totalDistance: increment(totalDistance),
        },
        lastLogDate: todayStr,
      };

      if (streakAction !== undefined) {
        userUpdateData.streak = newStreak;
      }

      if (earnedBadges.length > 0) {
        const newBadgeIds = earnedBadges.map(b => b.id);
        userUpdateData.badges = arrayUnion(...newBadgeIds);
      }

      batch.set(userDocRef, userUpdateData, { merge: true });

      // D. タイムライン投稿
      if (postToTimeline) {
        const timelineRef = doc(collection(db, 'timeline'));
        batch.set(timelineRef, {
          ...recordData,
          recordId: recordRef.id,
          username: currentUsername,
          userIcon: currentUserIcon,
          likes: 0,
          comments: 0,
          type: 'record',
          streak: newStreak,
          displayBadges: earnedBadges.map(b => b.id),
        });
      }

      await batch.commit();

      return {
        totalCalories,
        totalSteps,
        activities: sanitizedActivities,
        imageUrls: uploadedImageUrls,
        streak: newStreak,
        displayBadges: earnedBadges.map(b => b.id),
        newlyEarnedBadges: earnedBadges,
      };

    } catch (error) {
      console.error("保存エラー:", error);
      Alert.alert("エラー", "記録の保存に失敗しました。");
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { saveRecord, saving };
};
