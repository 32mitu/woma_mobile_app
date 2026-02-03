import React, { useState, useEffect } from 'react';
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

type PostProps = {
  post: {
    id: string;
    userId?: string;
    text: string;
    imageUrls?: string[];
    likes: number;
    comments?: number;
    timestamp: any;
    user?: { // 投稿者情報がpostオブジェクトに含まれている場合への対応
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
};

export const Post = ({ post }: PostProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { sendPushNotification } = usePushNotifications();

  const [likes, setLikes] = useState(post.likes || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [liked, setLiked] = useState(false); // 本来はサブコレクションで確認すべきだが簡易実装
  const [showComments, setShowComments] = useState(false);
  const [author, setAuthor] = useState<{ name: string; photo: string | null }>({
    name: post.user?.displayName || "ユーザー",
    photo: post.user?.photoURL || null
  });

  const currentUser = auth.currentUser;
  const isMyPost = currentUser?.uid === post.userId;

  useEffect(() => {
    // 投稿者情報の取得 (postに情報が含まれていない場合のフォールバック)
    const fetchAuthor = async () => {
      if (post.user) return; // 既に情報があればスキップ
      if (post.userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", post.userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setAuthor({
              name: data.displayName || data.username || "ユーザー",
              photo: data.profileImageUrl || data.photoURL || null
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchAuthor();
  }, [post.userId, post.user]);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const postRef = doc(db, "timeline", post.id);
      await updateDoc(postRef, {
        likes: increment(newLiked ? 1 : -1)
      });

      if (newLiked && post.userId && post.userId !== currentUser?.uid) {
        const authorDoc = await getDoc(doc(db, "users", post.userId));
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          if (authorData.pushToken) {
            await sendPushNotification(
              authorData.pushToken,
              "いいね！",
              `${currentUser?.displayName || "誰か"}があなたの投稿にいいねしました`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error updating like: ", error);
      // ロールバック
      setLiked(!newLiked);
      setLikes((prev) => (newLiked ? prev - 1 : prev + 1));
    }
  };

  const handleDelete = () => {
    Alert.alert("削除の確認", "この投稿を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "timeline", post.id));
          } catch (e) {
            Alert.alert("エラー", "削除に失敗しました");
          }
        }
      }
    ]);
  };

  const handleUserPress = () => {
    if (post.userId) {
      router.push(`/public/${post.userId}`);
    }
  };

  return (
    <Card padding="none" style={styles.card}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.userInfo} onTouchEnd={handleUserPress}>
          <Avatar uri={author.photo} size="sm" />
          <View style={styles.texts}>
            <Text style={styles.username}>{author.name}</Text>
            <Text style={styles.date}>
              {post.timestamp ? timeAgo(post.timestamp) : '投稿中...'}
            </Text>
          </View>
        </View>

        {isMyPost && (
          <IconButton
            name="trash-outline"
            size={20}
            color="#EF4444"
            onPress={handleDelete}
          />
        )}
      </View>

      {/* 本文 */}
      <View style={styles.content}>
        <RenderTextWithHashtags text={post.text} />
      </View>

      {/* 活動タグ (Badgeを使用) */}
      {post.activities && post.activities.length > 0 && (
        <View style={styles.activityContainer}>
          {post.activities.map((act, idx) => (
            <Badge
              key={idx}
              label={`${act.name} ${act.duration > 0 ? act.duration + '分' : (act.steps || 0) + '歩'}`}
              variant="outline"
              color="primary"
              size="sm"
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
            transition={500}
          />
          {/* 複数枚ある場合のインジケーターなどは省略またはBadgeで実装可能 */}
          {post.imageUrls.length > 1 && (
            <View style={styles.imageCounter}>
              <Badge label={`1 / ${post.imageUrls.length}`} variant="ghost" color="secondary" />
            </View>
          )}
        </View>
      )}

      {/* フッターアクション (IconButtonを使用) */}
      <View style={styles.footer}>
        <View style={styles.actionItem}>
          <IconButton
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? "#EF4444" : "#4B5563"}
            onPress={handleLike}
          />
          <Text style={styles.actionText}>{likes}</Text>
        </View>

        <View style={styles.actionItem}>
          <IconButton
            name="chatbubble-outline"
            size={22}
            color="#4B5563"
            onPress={() => setShowComments(!showComments)}
          />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </View>
      </View>

      {/* コメントセクション */}
      {showComments && (
        <View style={styles.commentSection}>
          <CommentSection
            postId={post.id}
            postAuthorId={post.userId}
            onCommentAdded={() => setCommentsCount(prev => prev + 1)}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
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
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  imageWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.8, // アスペクト比調整
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  commentSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});