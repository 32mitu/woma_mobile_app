import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import i18n from '../../../i18n';

/**
 * 経過時間を計算する (Web版と同ロジック)
 */
export const timeAgo = (date: any) => {
  if (!date) return "";
  // FirestoreのTimestamp型か、JSのDate型かを判定
  const targetDate = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  const t = i18n.t.bind(i18n);
  if (diff < 60) return t('timeAgo.secondsAgo', { count: diff });
  if (diff < 3600) return t('timeAgo.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('timeAgo.hoursAgo', { count: Math.floor(diff / 3600) });
  return t('timeAgo.daysAgo', { count: Math.floor(diff / 86400) });
};

/**
 * テキスト内のハッシュタグを検出して、検索画面へ遷移するリンクにするコンポーネント
 */
export const RenderTextWithHashtags = ({ text, style }: { text: string, style?: any }) => {
  const router = useRouter();
  if (!text) return null;

  const hashtagRegex = /(#[\p{L}\p{N}_]+)/gu;
  const parts = text.split(hashtagRegex);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          // ハッシュタグの場合は青色にしてタップ可能にする
          return (
            <Text
              key={index}
              style={{ color: '#3B82F6', fontWeight: 'bold' }}
              onPress={() => {
                // タグ検索画面へ遷移 (タグ名から#を除去して渡す)
                router.push(`/search?q=${encodeURIComponent(part.substring(1))}&type=tag`);
              }}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};