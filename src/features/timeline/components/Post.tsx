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

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { Avatar } from '../../../ui/Avatar';
import { IconButton } from '../../../ui/IconButton';
import { Badge } from '../../../ui/Badge';
import { ListItem } from '../../../ui/ListItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PostData = {
  id: string;
  userId?: string;
  text: string;
  imageUrls?: string[];
  likes: number;
  reactions?: Record<string, ReactionType>;
  comments?: number;
  timestamp: any;
  user?: {
    displayName?: string;
    photoURL?: string;
  };
  activities?: {
    name: string;
    duration: number;
    mets?: number;
    steps?: number;
  }[];
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
  const [userInfo, setUserInfo] = useState<{ displayName: string; photoURL: string } | null>(
    post.user ? { displayName: post.user.displayName || '名無し', photoURL: post.user.photoURL || '' } : null
  );

  const currentUser = auth.currentUser;
  const isOwner = currentUser && post.userId === currentUser.uid;

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
    if (userInfo || !post.userId) return;
    let isMounted = true;
    getDoc(doc(db, 'users', post.userId)).then(snap => {
      if (snap.exists() && isMounted) {
        const data = snap.data();
        setUserInfo({ displayName: data.username || data.displayName || '名無し', photoURL: data.profileImageUrl || data.photoURL || '' });
      }
    });
    return () => { isMounted = false; };
  }, [post.userId, userInfo]);

  // リアクション処理
  const handleReaction = async (type: ReactionType) => {
    if (!currentUser) return Alert.alert(t('common.error'), t('auth.loginRequired'));

    // パレットを閉じる
    setShowReactionPalette(false);

    const previousReactions = { ...localReactions };
    const isRemoving = myReaction === type;

    // 即時反映
    setLocalReactions(prev => {
      const next = { ...prev };
      isRemoving ? delete next[currentUser.uid] : (next[currentUser.uid] = type);
      return next;
    });

    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        [`reactions.${currentUser.uid}`]: isRemoving ? deleteField() : type
      });

      if (!isRemoving && post.userId && post.userId !== currentUser.uid && (!previousReactions[currentUser.uid] || previousReactions[currentUser.uid] !== type)) {
        await sendPushNotification(post.userId, t('notification.reactionTitle'), `${userInfo?.displayName || '誰か'}が${reactionEmojis[type]}しました`);
      }
    } catch (error) {
      setLocalReactions(previousReactions);
    }
  };

  const handleDelete = async () => {
    Alert.alert(t('common.delete'), t('timeline.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteDoc(doc(db, 'posts', post.id)) },
    ]);
  };

  const handleUserPress = () => {
    if (post.userId) router.push({ pathname: '/public/[uid]', params: { uid: post.userId } });
  };

  return (
    <Card style={styles.card} padding="none">
      <ListItem
        leftElement={<Avatar uri={userInfo?.photoURL} size="sm" />}
        title={userInfo?.displayName || 'Loading...'}
        subtitle={timeAgo(post.timestamp)}
        rightElement={isOwner ? (
          <IconButton name="trash-outline" size={20} color="#9CA3AF" onPress={handleDelete} />
        ) : undefined}
        onPress={handleUserPress}
        style={styles.headerItem}
        titleStyle={styles.headerTitle}
      />

      {post.text ? (
        <View style={styles.content}>
          <RenderTextWithHashtags text={post.text} />
        </View>
      ) : null}

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

      {post.imageUrls && post.imageUrls.length > 0 && (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: post.imageUrls[0] }} style={styles.postImage} contentFit="cover" transition={200} />
          {post.imageUrls.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{post.imageUrls.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {/* アクションボタンエリア */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          {/* 1. パレット (表示制御は状態依存) */}
          <ReactionSelector
            visible={showReactionPalette}
            onSelect={handleReaction}
            currentReaction={myReaction}
          />

          {/* 2. メインリアクションボタン (タップでトグル) */}
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
                // IconButtonのonPressは無効化し、親のTouchableOpacityに任せる
                pointerEvents="none"
              />
            )}
            <Text style={[styles.actionText, myReaction && { color: mainIconColor, fontWeight: 'bold' }]}>
              {reactionCounts.total}
            </Text>
          </TouchableOpacity>

          {/* 3. パレット展開ボタン (新規追加: いいねの横に配置) */}
          <IconButton
            name="happy-outline" // スマイルアイコン
            size={22}
            color="#6B7280"
            onPress={() => setShowReactionPalette(prev => !prev)}
            style={styles.paletteTrigger}
          />
        </View>

        {/* 4. コメントボタン */}
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
  headerItem: {
    borderBottomWidth: 0,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 12,
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
    justifyContent: 'space-between', // 左のアクショングループと右のコメントを離す
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', // パレットの基準位置
    zIndex: 20,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    height: 32,
    marginRight: 4, // スマイルボタンとの間隔
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
    prev.post.timestamp === next.post.timestamp &&
    JSON.stringify(prev.post.reactions) === JSON.stringify(next.post.reactions)
  );
});