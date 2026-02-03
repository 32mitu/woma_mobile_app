import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { GiftedChat, Actions } from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc } from 'firebase/firestore';
import { useHeaderHeight } from '@react-navigation/elements';

import { db } from '../../firebaseConfig';
import { useAuth } from '../../src/features/auth/useAuth';
import { useChat } from '../../src/features/dm/hooks/useChat';
import { useSafety } from '../../src/hooks/useSafety';

// 共通コンポーネント
import { IconButton } from '../../src/ui/IconButton';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const partnerId = Array.isArray(id) ? id[0] : id;
  const { userProfile } = useAuth();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { messages, onSend, sendImage, markAsRead } = useChat(userProfile?.uid, partnerId);
  const { reportContent, blockUser } = useSafety();

  const [partnerName, setPartnerName] = useState('チャット');

  useEffect(() => {
    if (partnerId) {
      const fetchPartner = async () => {
        try {
          const docRef = doc(db, 'users', partnerId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setPartnerName(data.username || data.displayName || 'チャット');
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchPartner();
      markAsRead();
    }
  }, [partnerId]);

  useEffect(() => {
    navigation.setOptions({
      title: partnerName,
      // ヘッダー右上のメニューボタンをIconButtonに置き換え
      headerRight: () => (
        <IconButton
          name="ellipsis-horizontal"
          size={24}
          color="#333"
          onPress={showActionSheet}
          style={{ padding: 4 }}
        />
      ),
    });
  }, [navigation, partnerName]);

  const showActionSheet = () => {
    Alert.alert(
      'メニュー',
      '操作を選択してください',
      [
        { text: 'このユーザーを通報', onPress: handleReport, style: 'destructive' },
        { text: 'このユーザーをブロック', onPress: handleBlock, style: 'destructive' },
        { text: 'キャンセル', style: 'cancel' }
      ]
    );
  };

  const handleReport = async () => {
    if (!partnerId) return;
    await reportContent(partnerId, 'user', '不適切なDM');
  };

  const handleBlock = async () => {
    if (!partnerId) return;
    await blockUser(partnerId);
    navigation.goBack();
  };

  const handlePickImage = useCallback(async () => {
    if (!userProfile) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('エラー', '写真へのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const user = {
        _id: userProfile.uid,
        name: userProfile.username,
        avatar: userProfile.profileImageUrl
      };

      const count = result.assets.length;
      const confirmMessage = count === 1
        ? "この画像を送信しますか？"
        : `${count}枚の画像を送信しますか？`;

      Alert.alert(
        "画像の送信",
        confirmMessage,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "送信",
            onPress: async () => {
              try {
                const sendPromises = result.assets.map(asset => sendImage(asset.uri, user));
                await Promise.all(sendPromises);
              } catch (e) {
                console.error(e);
                Alert.alert("エラー", "画像の送信に失敗しました");
              }
            }
          }
        ]
      );
    }
  }, [userProfile, sendImage]);

  const renderActions = useCallback((props: any) => {
    // GiftedChatのActionsコンポーネントの代わりに、IconButtonを配置して見た目を統一
    return (
      <View style={styles.actionContainer}>
        <IconButton
          name="image"
          size={28}
          color="#3B82F6"
          onPress={handlePickImage}
        />
      </View>
    );
  }, [handlePickImage]);

  const currentUser = {
    _id: userProfile?.uid || '',
    name: userProfile?.username || '自分',
    avatar: userProfile?.profileImageUrl || undefined,
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={headerHeight}
      >
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={currentUser}
          renderUsernameOnMessage={false}
          alwaysShowSend
          renderActions={renderActions}
          placeholder="メッセージを入力..."
          textInputProps={{ style: styles.textInput }}
          isKeyboardInternallyHandled={false}
          keyboardShouldPersistTaps="never"
          bottomOffset={insets.bottom}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 0,
    marginRight: 10,
    paddingTop: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  actionContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginLeft: 4,
  }
});