import { useRef, useState, useCallback } from 'react';
import { View, InteractionManager, Alert } from 'react-native';

// ネイティブモジュールは遅延 require で読み込む。
// 旧 dev client に native module が存在しない場合でも起動時クラッシュを防ぐ。
const getCaptureRef = (): ((ref: any, options: any) => Promise<string>) | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-view-shot').captureRef;
  } catch {
    return null;
  }
};

const getSharing = (): typeof import('expo-sharing') | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-sharing');
  } catch {
    return null;
  }
};

export interface UseWorkoutShareReturn {
  cardRef: React.RefObject<View | null>;
  isCapturing: boolean;
  shareToInstagram: () => Promise<void>;
  shareGeneric: () => Promise<void>;
}

export const useWorkoutShare = (): UseWorkoutShareReturn => {
  const cardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureCard = useCallback((): Promise<string | null> => {
    return new Promise(resolve => {
      InteractionManager.runAfterInteractions(async () => {
        const captureRef = getCaptureRef();
        if (!captureRef) {
          Alert.alert(
            'アップデートが必要です',
            '最新のアプリをインストールするとシェア機能が使えます。',
          );
          resolve(null);
          return;
        }
        try {
          const uri = await captureRef(cardRef, {
            format: 'jpg',
            quality: 0.92,
            result: 'tmpfile',
          });
          resolve(uri);
        } catch (error) {
          console.error('ViewShot capture error:', error);
          resolve(null);
        }
      });
    });
  }, []);

  const doShare = useCallback(async () => {
    const uri = await captureCard();
    if (!uri) return;

    const Sharing = getSharing();
    if (!Sharing) {
      Alert.alert(
        'アップデートが必要です',
        '最新のアプリをインストールするとシェア機能が使えます。',
      );
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('エラー', 'シェア機能が利用できません');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      dialogTitle: '今日のワークアウトをシェア',
      UTI: 'public.jpeg',
    });
  }, [captureCard]);

  const shareToInstagram = useCallback(async () => {
    setIsCapturing(true);
    try {
      await doShare();
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [doShare]);

  const shareGeneric = useCallback(async () => {
    setIsCapturing(true);
    try {
      await doShare();
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [doShare]);

  return { cardRef, isCapturing, shareToInstagram, shareGeneric };
};
