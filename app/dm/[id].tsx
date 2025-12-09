import React, { useState, useEffect } from 'react';
import { 
  View, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Text 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../src/features/auth/useAuth';
import { useChat } from '../../src/features/dm/hooks/useChat';
import { Ionicons } from '@expo/vector-icons';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const partnerId = Array.isArray(id) ? id[0] : id;
  const { userProfile } = useAuth();
  const navigation = useNavigation();
  
  // ★自作入力バー用のステート
  const [inputText, setInputText] = useState('');

  const { messages, onSend, markAsRead } = useChat(userProfile?.uid, partnerId);

  // 相手情報の取得
  useEffect(() => {
    const fetchPartnerName = async () => {
      if (!partnerId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', partnerId));
        if (userDoc.exists()) {
          const name = userDoc.data().username || 'チャット';
          navigation.setOptions({ title: name });
        }
      } catch (e) { console.log(e); }
    };
    fetchPartnerName();
  }, [partnerId]);

  // 既読処理
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages.length]);

  // ★自作の送信処理
  const handleSendRaw = () => {
    if (!inputText.trim() || !userProfile?.uid) return;

    // GiftedChatの形式に合わせてメッセージを作成
    const newMessage: IMessage = {
      _id: Math.random().toString(36).substring(7),
      text: inputText.trim(),
      createdAt: new Date(),
      user: {
        _id: userProfile.uid,
        name: userProfile.username || '自分',
      }
    };

    onSend([newMessage]); // 送信フックを実行
    setInputText('');     // 入力欄を空にする
  };

  if (!userProfile?.uid || !partnerId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <GiftedChat
            messages={messages}
            user={{
              _id: userProfile.uid,
            }}
            // ★重要: ライブラリ内蔵の入力を消す
            renderInputToolbar={() => null}
            minInputToolbarHeight={0}
            alwaysShowSend={false}
            scrollToBottom
            locale='ja'
          />
        </View>

        {/* ★自作の入力バー */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendRaw}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  chatContainer: { flex: 1 }, // チャット部分を広げる
  
  // 自作入力バーのスタイル
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#333',
    maxHeight: 100, // 長文のときはスクロール
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});