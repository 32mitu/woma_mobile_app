import React, { useState, useEffect, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { doc, updateDoc, deleteDoc, getDoc, deleteField } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';
import { RenderTextWithHashtags, timeAgo } from '../utils/timelineUtils';
import { CommentSection } from './CommentSection';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';
import { ReactionSelector } from './ReactionSelector';
import { ReactionType } from '../../../types';
// ★ BADGES マスターデータをインポート
import { BADGES } from '../../../data/badges';

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { Avatar } from '../../../ui/Avatar';
import { IconButton } from '../../../ui/IconButton';
import { Badge } from '../../../ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PostData = {
  id: string;
  userId?: string;
  uid?: string; // 互換性のため
  text: string;
  imageUrl?: string;
  imageUrls?: string[];
  likes: number;
  reactions?: Record<string, ReactionType>;
  comments?: number;
  timestamp: any;
  createdAt?: any;
  user?: {
    displayName?: string;
    photoURL?: string;
  };
  username?: string;
  userIcon?: string;
  activities?: {
    name: string;
    duration: number;
    mets?: number;
    steps?: number;
  }[];
  // ★ 追加されたフィールド
  streak?: number;
  displayBadges?: string[]; // useRecordSaver.ts で保存したキー名に合わせる
  earnedBadges?: string[]; // 古いデータとの互換性のため残す
};

type PostProps = {
  post: PostData;
};

const PostComponent = ({ post }: PostProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { sendPushNotification } = usePushNotifications();

  // State
  const [localReactions, setLocalReactions] = useState<Record<string, ReactionType>>(post.reactions || {});
  const [showReactionPalette, setShowReactionPalette] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // ユーザー情報の初期化
  const [userInfo, setUserInfo] = useState<{ displayName: string; photoURL: string } | null>(() => {
    if (post.username || post.userIcon) {
      return { displayName: post.username || '名無し', photoURL: post.userIcon || '' };
    }
    if (post.user) {
      return { displayName: post.user.displayName || '名無し', photoURL: post.user.photoURL || '' };
    }
    return null;
  });

  const currentUser = auth.currentUser;
  const targetUid = post.userId || post.uid;
  const isOwner = currentUser && targetUid === currentUser.uid;

  // リアクション計算
  const myReaction = useMemo(() => {
    if (!currentUser) return null;
    return localReactions[currentUser.uid] || null;
  }, [localReactions, currentUser]);

  const reactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    Object.values(localReactions).forEach(r => {
      counts[r] = (counts[r] || 0) + 1;
      total++;
    });
    if (total === 0 && post.likes > 0) return { total: post.likes, topReaction: 'like' as ReactionType };
    return { total, topReaction: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ReactionType || 'like', counts };
  }, [localReactions, post.likes]);

  const reactionEmojis: Record<string, string> = { like: '❤️', fire: '🔥', muscle: '💪', clap: '👏', love: '😍' };
  const mainIconColor = myReaction ? '#EF4444' : '#4B5563';

  // ユーザー情報取得
  useEffect(() => {
    if (userInfo || !targetUid) return;
    let isMounted = true;
    getDoc(doc(db, 'users', targetUid)).then(snap => {
      if (snap.exists() && isMounted) {
        const data = snap.data();
        setUserInfo({
          displayName: data.username || data.displayName || '名無し',
          photoURL: data.profileImageUrl || data.photoURL || ''
        });
      }
    });
    return () => { isMounted = false; };
  }, [targetUid, userInfo]);

  // リアクション処理
  const handleReaction = async (type: ReactionType) => {
    if (!currentUser) return Alert.alert(t('common.error'), t('auth.loginRequired'));

    setShowReactionPalette(false);
    const previousReactions = { ...localReactions };
    const isRemoving = myReaction === type;

    setLocalReactions(prev => {
      const next = { ...prev };
      isRemoving ? delete next[currentUser.uid] : (next[currentUser.uid] = type);
      return next;
    });

    try {
      const postRef = doc(db, 'timeline', post.id);
      await updateDoc(postRef, {
        [`reactions.${currentUser.uid}`]: isRemoving ? deleteField() : type
      });
      // 通知ロジック (省略せず実装)
      if (!isRemoving && targetUid && targetUid !== currentUser.uid && (!previousReactions[currentUser.uid] || previousReactions[currentUser.uid] !== type)) {
        await sendPushNotification(targetUid, t('notification.reactionTitle'), `${userInfo?.displayName || '誰か'}が${reactionEmojis[type]}しました`);
      }
    } catch (error) {
      setLocalReactions(previousReactions);
    }
  };

  const handleDelete = async () => {
    Alert.alert(t('common.delete'), t('timeline.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteDoc(doc(db, 'timeline', post.id)) },
    ]);
  };

  const handleUserPress = () => {
    if (targetUid) router.push({ pathname: '/public/[uid]', params: { uid: targetUid } });
  };

  // バッジリストの取得 (互換性対応)
  const badgesToShow = post.displayBadges || post.earnedBadges || [];

  return (
    <Card style={styles.card} padding="none">
      {/* カスタムヘッダー (ListItemを使わず実装してViewネスト問題を回避) */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleUserPress}>
          <Avatar uri={userInfo?.photoURL} size="sm" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {userInfo?.displayName || 'Loading...'}
            </Text>
            {/* ★★★ ストリーク表示 ★★★ */}
            {post.streak && post.streak > 0 ? (
              <View style={styles.streakBadgeSmall}>
                <Text style={styles.streakIconSmall}>🔥</Text>
                <Text style={styles.streakTextSmall}>
                  {t('profile.streak', { count: post.streak, defaultValue: `${post.streak}日` })}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.timestamp}>
            {timeAgo(post.timestamp || post.createdAt)}
          </Text>
        </View>

        {isOwner && (
          <IconButton name="trash-outline" size={20} color="#9CA3AF" onPress={handleDelete} />
        )}
      </View>

      {/* 投稿本文 */}
      {(post.text || post.comment) ? (
        <View style={styles.content}>
          <RenderTextWithHashtags text={post.text || post.comment} />
        </View>
      ) : null}

      {/* ★★★ 獲得バッジ表示セクション ★★★ */}
      {badgesToShow.length > 0 && (
        <View style={styles.earnedBadgesContainer}>
          <Text style={styles.earnedBadgesTitle}>🎉 バッジ獲得！</Text>
          <View style={styles.badgesRow}>
            {badgesToShow.map((badgeId) => {
              const badge = BADGES.find(b => b.id === badgeId);
              if (!badge) return null;
              return (
                <View key={badgeId} style={styles.badgeItem}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* アクティビティ表示 */}
      {post.activities && post.activities.length > 0 && (
        <View style={styles.activityContainer}>
          {post.activities.map((act, idx) => (
            <Badge
              key={idx}
              label={`${act.name} ${act.duration}分`}
              variant="default"
              color="primary"
              size="sm"
              icon={<Text style={styles.badgeEmoji}>🏃</Text>}
            />
          ))}
        </View>
      )}

      {/* 画像表示 */}
      {(post.imageUrls && post.imageUrls.length > 0) || post.imageUrl ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: post.imageUrl || (post.imageUrls && post.imageUrls[0]) }}
            style={styles.postImage}
            contentFit="cover"
            transition={200}
          />
          {post.imageUrls && post.imageUrls.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{post.imageUrls.length - 1}</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* アクションボタンエリア */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <ReactionSelector
            visible={showReactionPalette}
            onSelect={handleReaction}
            currentReaction={myReaction}
          />

          <TouchableOpacity
            style={styles.reactionButton}
            onPress={() => handleReaction(myReaction || 'like')}
            activeOpacity={0.7}
          >
            {myReaction && myReaction !== 'like' ? (
              <Text style={styles.reactionEmoji}>{reactionEmojis[myReaction]}</Text>
            ) : (
              <IconButton
                name={myReaction === 'like' ? "heart" : "heart-outline"}
                size={24}
                color={mainIconColor}
                style={{ margin: 0, padding: 0 }}
                pointerEvents="none"
              />
            )}
            <Text style={[styles.actionText, myReaction && { color: mainIconColor, fontWeight: 'bold' }]}>
              {reactionCounts.total}
            </Text>
          </TouchableOpacity>

          <IconButton
            name="happy-outline"
            size={22}
            color="#6B7280"
            onPress={() => setShowReactionPalette(prev => !prev)}
            style={styles.paletteTrigger}
          />
        </View>

        <TouchableOpacity style={styles.commentButton} onPress={() => setShowComments(!showComments)}>
          <IconButton
            name="chatbubble-outline"
            size={22}
            color="#4B5563"
            style={{ margin: 0, padding: 0 }}
            pointerEvents="none"
          />
          <Text style={styles.actionText}>{post.comments || 0}</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentSectionWrapper}>
          <CommentSection postId={post.id} />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'visible',
    zIndex: 1,
  },
  // カスタムヘッダー用のスタイル
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1F2937',
    maxWidth: '65%', // ストリーク表示用に幅制限
  },
  timestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  // ストリークバッジ (小)
  streakBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  streakIconSmall: {
    fontSize: 10,
    marginRight: 2,
  },
  streakTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  // 獲得バッジセクション
  earnedBadgesContainer: {
    marginHorizontal: 16,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  earnedBadgesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 3,
  },
  badgeName: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '500',
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  badgeEmoji: {
    fontSize: 10,
  },
  imageWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageCountBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 20,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    height: 32,
    marginRight: 4,
  },
  paletteTrigger: {
    margin: 0,
    padding: 4,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  actionText: {
    marginLeft: 6,
    color: '#4B5563',
    fontSize: 14,
  },
  reactionEmoji: {
    fontSize: 22,
    marginHorizontal: 2,
  },
  commentSectionWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    paddingBottom: 8,
    zIndex: 1,
  }
});

export const Post = memo(PostComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.likes === next.post.likes &&
    prev.post.comments === next.post.comments &&
    prev.post.text === next.post.text &&
    (prev.post.streak === next.post.streak) &&
    // displayBadges をチェック対象に追加
    (JSON.stringify(prev.post.displayBadges) === JSON.stringify(next.post.displayBadges)) &&
    JSON.stringify(prev.post.reactions) === JSON.stringify(next.post.reactions)
  );
});