import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { Image } from 'expo-image';
import { doc, updateDoc, increment, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';
import { RenderTextWithHashtags, timeAgo } from '../utils/timelineUtils';
import { CommentSection } from './CommentSection';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { Avatar } from '../../../ui/Avatar';
import { IconButton } from '../../../ui/IconButton';
import { Badge } from '../../../ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Propsの型定義を明確化
type PostData = {
  id: string;
  userId?: string;
  text: string;
  imageUrls?: string[];
  likes: number;
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

// コンポーネント定義
const PostComponent = ({ post }: PostProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { sendPushNotification } = usePushNotifications();
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [userInfo, setUserInfo] = useState<{ displayName: string; photoURL: string } | null>(
    post.user ? { displayName: post.user.displayName || '名無し', photoURL: post.user.photoURL || '' } : null
  );

  const currentUser = auth.currentUser;
  const isOwner = currentUser && post.userId === currentUser.uid;

  // ユーザー情報の非同期取得 (post.userがない場合のみ)
  useEffect(() => {
    if (userInfo) return; // 既に情報があればスキップ
    if (!post.userId) return;

    let isMounted = true;
    const fetchUser = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', post.userId!));
        if (userSnap.exists() && isMounted) {
          const data = userSnap.data();
          setUserInfo({
            displayName: data.username || data.displayName || '名無し',
            photoURL: data.profileImageUrl || data.photoURL || '',
          });
        }
      } catch (error) {
        console.log('User fetch error:', error);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [post.userId, userInfo]);

  // 「いいね」機能
  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }
    if (liked) return; // 連打防止（簡易版）

    // UIの即時反映 (Optimistic UI)
    setLiked(true);
    setLikes((prev) => prev + 1);

    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { likes: increment(1) });

      // 通知送信 (自分以外の場合)
      if (post.userId && post.userId !== currentUser.uid) {
        await sendPushNotification(
          post.userId,
          t('notification.likeTitle', 'いいね！'),
          t('notification.likeBody', 'あなたの投稿にいいねがつきました！')
        );
      }
    } catch (error) {
      console.error('Like error:', error);
      // エラー時はロールバック
      setLiked(false);
      setLikes((prev) => prev - 1);
    }
  };

  // 削除機能
  const handleDelete = async () => {
    Alert.alert(
      t('common.delete'),
      t('timeline.deleteConfirm', '本当に削除しますか？'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', post.id));
              // 親側で再取得が必要だが、Firestoreリスナーなら自動消滅する
            } catch (error) {
              Alert.alert(t('common.error'), t('common.errorOccurred'));
            }
          },
        },
      ]
    );
  };

  const handleUserPress = () => {
    if (post.userId) {
      // (tabs)外への遷移の場合があるのでパスを調整
      // または router.push(`/public/${post.userId}`) でも可
      // 現在の構造に合わせて遷移
      router.push({ pathname: '/public/[uid]', params: { uid: post.userId } });
    }
  };

  return (
    <Card style={styles.card} padding="none">
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar
            uri={userInfo?.photoURL}
            size="sm"
          // Avatar自体にonPressはないためTouchableOpacityでラップするか、Avatarの実装依存
          // ここではAvatarタップイベントがないので外側をラップする想定ですが、
          // Avatarの仕様次第。ここでは簡易的にViewのまま、名前部分をタップ可能にします。
          />
          <View style={styles.texts}>
            <Text style={styles.username} onPress={handleUserPress}>
              {userInfo?.displayName || 'Loading...'}
            </Text>
            <Text style={styles.date}>{timeAgo(post.timestamp)}</Text>
          </View>
        </View>

        {isOwner && (
          <IconButton
            name="trash-outline"
            size={20}
            color="#9CA3AF"
            onPress={handleDelete}
          />
        )}
      </View>

      {/* テキストコンテンツ */}
      {post.text ? (
        <View style={styles.content}>
          <RenderTextWithHashtags text={post.text} />
        </View>
      ) : null}

      {/* アクティビティタグ */}
      {post.activities && post.activities.length > 0 && (
        <View style={styles.activityContainer}>
          {post.activities.map((act, idx) => (
            <Badge
              key={idx}
              label={`${act.name} ${act.duration}分`}
              variant="default"
              color="primary"
              size="sm"
              icon={<Text style={{ fontSize: 10 }}>🏃</Text>}
            />
          ))}
        </View>
      )}

      {/* 画像 */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: post.imageUrls[0] }}
            style={styles.postImage}
            contentFit="cover"
            transition={200}
          />
          {post.imageUrls.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{post.imageUrls.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {/* アクションボタン */}
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <IconButton
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? "#EF4444" : "#4B5563"}
            onPress={handleLike}
          />
          <Text style={styles.actionText}>{likes}</Text>
        </View>

        <View style={styles.actionButton}>
          <IconButton
            name="chatbubble-outline"
            size={22}
            color="#4B5563"
            onPress={() => setShowComments(!showComments)}
          />
          <Text style={styles.actionText}>{post.comments || 0}</Text>
        </View>
      </View>

      {/* コメントセクション */}
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
    marginHorizontal: 16, // 画面端に少し余白を持たせる
    overflow: 'hidden', // 画像の角丸用
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  texts: {
    marginLeft: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1F2937',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  imageWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.8, // アスペクト比固定
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 4,
    color: '#4B5563',
    fontSize: 14,
  },
  commentSectionWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    paddingBottom: 8,
  }
});

// React.memo でラップし、再レンダリングを制御
export const Post = memo(PostComponent, (prevProps, nextProps) => {
  // id, likes, comments, text, 画像URLなどが変わっていないかチェック
  // 深い比較 (activitiesなど) はコストがかかるため、主要な更新ポイントだけ比較
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes === nextProps.post.likes &&
    prevProps.post.comments === nextProps.post.comments &&
    prevProps.post.text === nextProps.post.text &&
    prevProps.post.timestamp === nextProps.post.timestamp
  );
});