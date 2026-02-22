import { useState } from 'react';
import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../features/auth/useAuth';
import { Alert } from 'react-native';
import i18n from '../i18n';

export const useSafety = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // 通報機能
  const reportContent = async (targetId: string, type: 'post' | 'user' | 'dm', reason: string = 'Inappropriate content') => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: userProfile.uid,
        targetId,
        type,
        reason,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ [Report] ${type} reported: ${targetId}`);
      Alert.alert(i18n.t('safety.reportThanks'), i18n.t('safety.reportMessage'));
    } catch (e) {
      console.error("Report failed:", e);
      Alert.alert(i18n.t('safety.error'), i18n.t('safety.reportFailed'));
    } finally {
      setLoading(false);
    }
  };

  // ブロック機能
  const blockUser = async (targetUserId: string) => {
    if (!userProfile?.uid) return;

    Alert.alert(
      i18n.t('safety.blockTitle'),
      i18n.t('safety.blockMessage'),
      [
        { text: i18n.t('common.cancel'), style: "cancel" },
        {
          text: i18n.t('safety.blockConfirm'),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              console.log(`🚫 [Block] Blocking user: ${targetUserId}`);
              const userRef = doc(db, 'users', userProfile.uid);

              // Firestore配列への追加
              await updateDoc(userRef, {
                blockedUsers: arrayUnion(targetUserId)
              });

              console.log("✅ [Block] Success. Firestore updated.");
              Alert.alert(i18n.t('safety.blockSuccess'), i18n.t('safety.blockSuccessMessage'));
            } catch (e) {
              console.error("Block failed:", e);
              Alert.alert(i18n.t('safety.error'), i18n.t('safety.blockFailed'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return { reportContent, blockUser, loading };
};