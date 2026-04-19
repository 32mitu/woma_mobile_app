import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutShareCard } from './WorkoutShareCard';
import { ShareCardData } from './shareCardUtils';

// amow カラー
const C = {
  blue: '#93c2e8',
  blueLight: '#cce3f5',
  bluePale: '#e8f4fc',
  pink: '#f3a8bb',
  pinkLight: '#fae1e7',
  cream: '#fdfbf0',
  navy: '#30324f',
  navyLight: 'rgba(48,50,79,0.5)',
  white: '#ffffff',
};

interface WorkoutShareModalProps {
  visible: boolean;
  data: ShareCardData | null;
  isCapturing: boolean;
  lang?: 'ja' | 'en';
  onShareInstagram: () => void;
  onShareGeneric: () => void;
  onDismiss: () => void;
}

export const WorkoutShareModal: React.FC<WorkoutShareModalProps> = ({
  visible,
  data,
  isCapturing,
  lang = 'ja',
  onShareInstagram,
  onShareGeneric,
  onDismiss,
}) => {
  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* ドラッグハンドル */}
        <View style={styles.handle} />

        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {lang === 'ja' ? '✦  記録をシェアしよう  ✦' : '✦  Share Your Workout  ✦'}
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={C.navyLight} />
          </TouchableOpacity>
        </View>

        {/* カードプレビュー */}
        <View style={styles.previewWrapper}>
          <View style={styles.previewShadow}>
            <View style={styles.previewContainer}>
              <WorkoutShareCard data={data} lang={lang} />
            </View>
          </View>
        </View>

        {/* 説明テキスト */}
        <Text style={styles.hintText}>
          {lang === 'ja'
            ? 'シェアしてInstagramストーリーズを選んでね🎀'
            : 'Tap Share → Instagram Stories 🎀'}
        </Text>

        {/* ボタン群 */}
        <View style={styles.buttonsSection}>
          {/* Instagramシェアボタン */}
          <TouchableOpacity
            style={[styles.instagramButton, isCapturing && styles.buttonDisabled]}
            onPress={onShareInstagram}
            disabled={isCapturing}
            activeOpacity={0.85}
          >
            {isCapturing ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Ionicons name="logo-instagram" size={20} color={C.white} />
            )}
            <Text style={styles.instagramButtonText}>
              {isCapturing
                ? (lang === 'ja' ? '画像を作成中...' : 'Creating image...')
                : (lang === 'ja' ? 'Instagramストーリーズでシェア' : 'Share to Instagram Stories')}
            </Text>
          </TouchableOpacity>

          {/* その他のアプリ */}
          <TouchableOpacity
            style={[styles.genericButton, isCapturing && styles.buttonDisabled]}
            onPress={onShareGeneric}
            disabled={isCapturing}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={18} color={C.navy} />
            <Text style={styles.genericButtonText}>
              {lang === 'ja' ? 'その他のアプリでシェア' : 'Share to Other Apps'}
            </Text>
          </TouchableOpacity>

          {/* スキップ */}
          <TouchableOpacity onPress={onDismiss} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>
              {lang === 'ja' ? 'スキップ' : 'Skip'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.pink,
    marginTop: 12,
    marginBottom: 8,
    opacity: 0.6,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: C.navy,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
  },
  // カードプレビュー
  previewWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewShadow: {
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    borderRadius: 20,
    overflow: 'visible',
  },
  previewContainer: {
    // 540x960 → 38% = 205x365
    transform: [{ scale: 0.38 }],
    borderRadius: 20,
    overflow: 'hidden',
  },
  // ヒントテキスト
  hintText: {
    fontSize: 13,
    color: C.navyLight,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 10,
  },
  // ボタン
  buttonsSection: {
    width: '100%',
    gap: 10,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.pink,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  instagramButtonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  genericButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.bluePale,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: C.blueLight,
  },
  genericButtonText: {
    color: C.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    color: C.navyLight,
    fontSize: 14,
  },
});
