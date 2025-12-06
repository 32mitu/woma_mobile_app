import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const useExerciseTypes = (userProfile: any) => {
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // デフォルトの運動種目（マスタデータとしてコードで持つか、Firestoreの共通マスタから引くのが一般的ですが、今回はコード定義）
  const defaultTypes = [
    { id: 'run', name: 'ランニング', metsValues: { 低: 6.0, 中: 8.3, 高: 10.5 }, isCustom: false },
    { id: 'walk', name: 'ウォーキング', metsValues: { 低: 3.0, 中: 4.0, 高: 5.0 }, isCustom: false },
    { id: 'muscle', name: '筋トレ', metsValues: { 低: 3.5, 中: 5.0, 高: 6.0 }, isCustom: false },
    { id: 'yoga', name: 'ヨガ/ストレッチ', metsValues: { 低: 2.5, 中: 3.0, 高: 4.0 }, isCustom: false },
    { id: 'cycle', name: 'サイクリング', metsValues: { 低: 4.0, 中: 8.0, 高: 10.0 }, isCustom: false },
    { id: 'swim', name: '水泳', metsValues: { 低: 6.0, 中: 8.0, 高: 10.0 }, isCustom: false },
  ];

  useEffect(() => {
    if (!userProfile) {
      setAvailableTypes(defaultTypes);
      setLoading(false);
      return;
    }

    // ユーザー作成のカスタム種目を監視
    const q = query(
      collection(db, 'exerciseTypes'),
      where('createdBy', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customTypes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isCustom: true
      }));
      setAvailableTypes([...defaultTypes, ...customTypes]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // 新規作成
  const createNewExerciseType = async (data: { name: string, low: number, mid: number, high: number }) => {
    if (!userProfile) return;
    await addDoc(collection(db, 'exerciseTypes'), {
      name: data.name,
      metsValues: {
        低: Number(data.low),
        中: Number(data.mid),
        高: Number(data.high)
      },
      createdBy: userProfile.uid,
      createdAt: serverTimestamp()
    });
  };

  // 削除
  const deleteExerciseType = async (typeId: string) => {
    await deleteDoc(doc(db, 'exerciseTypes', typeId));
  };

  return { availableTypes, loading, createNewExerciseType, deleteExerciseType };
};