import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTranslation } from 'react-i18next';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const partnerId = Array.isArray(id) ? id[0] : id;
  const { userProfile } = useAuth();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { messages, onSend, sendImage, markAsRead } = useChat(userProfile?.uid, partnerId);
  const { reportContent, blockUser } = useSafety();
  const { t } = useTranslation();

  const [partnerName, setPartnerName] = useState(t('dm.chat'));

  useEffect(() => {
    if (!partnerId) return;
    const fetchPartner = async () => {
      try {
        const docRef = doc(db, 'users', partnerId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setPartnerName(data.username || data.displayName || t('dm.chat'));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPartner();
  }, [partnerId]);

  // roomId が確定してから既読にする（partnerId と同じ useEffect に置くと roomId がまだ null）
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  useEffect(() => {
    navigation.setOptions({
      title: partnerName,
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
      t('common.menu'),
      '',
      [
        { text: t('common.report'), onPress: handleReport, style: 'destructive' },
        { text: t('common.block'), onPress: handleBlock, style: 'destructive' },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const handleReport = async () => {
    if (!partnerId) return;
    await reportContent(partnerId, 'user', t('dm.reportReason'));
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
      Alert.alert(t('common.error'), t('common.cameraRollPermission'));
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
        ? t('dm.sendImageConfirm')
        : t('dm.sendImagesConfirm', { count });

      Alert.alert(
        t('dm.sendImageTitle'),
        confirmMessage,
        [
          { text: t('common.cancel'), style: "cancel" },
          {
            text: t('common.ok'),
            onPress: async () => {
              const sendPromises = result.assets.map(asset => sendImage(asset.uri, user));
              const results = await Promise.allSettled(sendPromises);
              const failCount = results.filter(r => r.status === 'rejected').length;
              if (failCount > 0) {
                Alert.alert(t('common.error'), t('dm.sendImagePartialFailed', { count: failCount, defaultValue: `${failCount}枚の画像送信に失敗しました` }));
              }
            }
          }
        ]
      );
    }
  }, [userProfile, sendImage]);

  const renderActions = useCallback((props: any) => {
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
    name: userProfile?.username || t('dm.noName'),
    avatar: userProfile?.profileImageUrl || undefined,
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        /* ★調整箇所1：全体を押し上げる高さ
          Androidの高さが合わない場合は、以下のように数値を足し引きして調整してください。
          例（少し上げる）：(headerHeight - insets.bottom) + 15
          例（少し下げる）：(headerHeight - insets.bottom) - 15
        */
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : headerHeight - insets.bottom - 150}
        enabled={true}
      >
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={currentUser}
          renderUsernameOnMessage={false}
          alwaysShowSend
          renderActions={renderActions}
          placeholder={t('dm.placeholder')}
          textInputProps={{ style: styles.textInput }}
          isKeyboardInternallyHandled={false}
          keyboardShouldPersistTaps="handled"
          /* ★調整箇所2：入力欄の下の隙間
            Androidでもう少しキーボードとの間に余白が欲しい場合は、0 を 10 などに変更してください。
          */
          bottomOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        />
      </KeyboardAvoidingView>
    </View>
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