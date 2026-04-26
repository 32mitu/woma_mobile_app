import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShareCardData,
  formatTotalDuration,
  getTopActivities,
  getBadgeEmojis,
  formatShareDate,
} from './shareCardUtils';

// amow デザインガイドライン カラー
const C = {
  blue: '#93c2e8',
  blueLight: '#cce3f5',
  bluePale: '#e8f4fc',
  pink: '#f3a8bb',
  pinkLight: '#fae1e7',
  cream: '#fdfbf0',
  navy: '#30324f',
  navyLight: 'rgba(48,50,79,0.65)',
  white: '#ffffff',
};

interface WorkoutShareCardProps {
  data: ShareCardData;
  lang?: 'ja' | 'en';
}

export const WorkoutShareCard = React.forwardRef<View, WorkoutShareCardProps>(
  ({ data, lang = 'ja' }, ref) => {
    const totalMinutes = formatTotalDuration(data.activities);
    const topActivities = getTopActivities(data.activities, 3);
    const badgeEmojis = getBadgeEmojis(data.displayBadges);
    const dateStr = formatShareDate(lang);
    const extraCount = data.activities.length - topActivities.length;
    const photoUrls = data.imageUrls.slice(0, 2);

    return (
      <View ref={ref} style={styles.card}>
        {/* グラデーション背景 */}
        <LinearGradient
          colors={[C.blue, C.blueLight, C.pinkLight]}
          locations={[0, 0.55, 1]}
          style={styles.bg}
        >
          {/* 装飾ドット */}
          <Text style={[styles.deco, { top: 60, right: 30 }]}>✦</Text>
          <Text style={[styles.deco, { top: 120, left: 24 }]}>·</Text>
          <Text style={[styles.deco, { top: 200, right: 60 }]}>✦</Text>
          <Text style={[styles.decoSm, { top: 80, left: 90 }]}>✦</Text>
          <Text style={[styles.deco, { bottom: 140, left: 32 }]}>✦</Text>
          <Text style={[styles.decoSm, { bottom: 200, right: 40 }]}>✦</Text>

          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.logoText}>WOMA</Text>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>
          </View>

          {/* メインカード */}
          <View style={styles.mainCard}>
            {/* カロリー ヒーロー */}
            <View style={styles.heroSection}>
              <Text style={styles.caloriesLabel}>
                {lang === 'ja' ? '消費カロリー' : 'Calories Burned'}
              </Text>
              <View style={styles.caloriesRow}>
                <Text style={styles.caloriesValue}>
                  {data.totalCalories.toLocaleString()}
                </Text>
                <Text style={styles.caloriesUnit}>kcal</Text>
              </View>
            </View>

            {/* 区切り線 */}
            <View style={styles.divider} />

            {/* 統計3列 */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.totalSteps.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{lang === 'ja' ? '👟 歩数' : '👟 Steps'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.streak}</Text>
                <Text style={styles.statLabel}>{lang === 'ja' ? '🔥 継続日数' : '🔥 Streak'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalMinutes}</Text>
                <Text style={styles.statLabel}>{lang === 'ja' ? '⏱ 分' : '⏱ min'}</Text>
              </View>
            </View>
          </View>

          {/* 種目タグ */}
          {topActivities.length > 0 && (
            <View style={styles.activitiesSection}>
              {topActivities.map((act, i) => (
                <View
                  key={i}
                  style={[styles.activityPill, i % 2 === 0 ? styles.pillBlue : styles.pillPink]}
                >
                  <Text style={[styles.activityPillText, i % 2 === 0 ? styles.pillBlueText : styles.pillPinkText]} numberOfLines={1}>
                    {act.name}
                    {'  '}
                    {act.duration}
                    {lang === 'ja' ? '分' : 'min'}
                  </Text>
                </View>
              ))}
              {extraCount > 0 && (
                <View style={[styles.activityPill, styles.pillBlue]}>
                  <Text style={[styles.activityPillText, styles.pillBlueText]}>
                    +{extraCount}
                    {lang === 'ja' ? '件' : ' more'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* コメント */}
          {Boolean(data.comment) && (
            <View style={styles.commentBubble}>
              <Text style={styles.commentQuote}>"</Text>
              <Text style={styles.commentText} numberOfLines={2}>{data.comment}</Text>
              <Text style={styles.commentQuote}>"</Text>
            </View>
          )}

          {/* ユーザー写真 (expo-image 不可 → react-native Image) */}
          {photoUrls.length > 0 && (
            <View style={styles.photosRow}>
              {photoUrls.map((uri, i) => (
                <View key={i} style={styles.photoFrame}>
                  <Image
                    source={{ uri }}
                    style={[
                      styles.photo,
                      photoUrls.length === 1 && styles.photoSingle,
                    ]}
                  />
                </View>
              ))}
            </View>
          )}

          {/* バッジ */}
          {badgeEmojis.length > 0 && (
            <View style={styles.badgesRow}>
              {badgeEmojis.map((emoji, i) => (
                <Text key={i} style={styles.badgeEmoji}>{emoji}</Text>
              ))}
            </View>
          )}

          {/* スペーサー */}
          <View style={styles.spacer} />

          {/* フッター */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>✦  Recorded on WOMA  ✦</Text>
            <Text style={styles.footerUrl}>woma-web-app.com</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }
);

WorkoutShareCard.displayName = 'WorkoutShareCard';

const styles = StyleSheet.create({
  card: {
    width: 540,
    height: 960,
    overflow: 'hidden',
    borderRadius: 0,
  },
  bg: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 52,
    paddingBottom: 40,
  },
  // 装飾ドット
  deco: {
    position: 'absolute',
    fontSize: 22,
    color: C.white,
    opacity: 0.5,
  },
  decoSm: {
    position: 'absolute',
    fontSize: 13,
    color: C.white,
    opacity: 0.4,
  },
  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: C.navy,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    opacity: 0.85,
  },
  datePill: {
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    color: C.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  // メインカード
  mainCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 28,
    marginBottom: 20,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  caloriesLabel: {
    color: C.pink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  caloriesValue: {
    color: C.navy,
    fontSize: 80,
    fontWeight: '900',
    lineHeight: 84,
  },
  caloriesUnit: {
    color: C.navyLight,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: C.pinkLight,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: C.navy,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: C.navyLight,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.pinkLight,
  },
  // 種目タグ
  activitiesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  activityPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillBlue: {
    backgroundColor: C.bluePale,
    borderWidth: 1,
    borderColor: C.blueLight,
  },
  pillPink: {
    backgroundColor: C.pinkLight,
    borderWidth: 1,
    borderColor: '#f3c7d4',
  },
  activityPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillBlueText: {
    color: '#4a7fa8',
  },
  pillPinkText: {
    color: '#b06080',
  },
  // コメント
  commentBubble: {
    backgroundColor: C.cream,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.pinkLight,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentQuote: {
    color: C.pink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  commentText: {
    flex: 1,
    color: C.navy,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // 写真
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: C.white,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  photo: {
    width: 180,
    height: 180,
    backgroundColor: C.blueLight,
  },
  photoSingle: {
    width: 280,
    height: 280,
  },
  // バッジ
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  badgeEmoji: {
    fontSize: 30,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  // フッター
  footer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  footerText: {
    color: C.navy,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.55,
    letterSpacing: 1,
  },
  footerUrl: {
    color: C.navy,
    fontSize: 11,
    opacity: 0.35,
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
