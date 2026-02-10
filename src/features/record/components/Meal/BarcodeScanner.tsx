import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { IconButton } from '../../../../ui/IconButton';
import { Button } from '../../../../ui/Button';
import { Card } from '../../../../ui/Card';
import { Input } from '../../../../ui/Input';
import { searchRakutenProduct } from '../../../../utils/rakutenApi';

interface BarcodeScannerProps {
    visible: boolean;
    onClose: () => void;
    onScanned: (data: ScannedFoodData) => void;
}

export interface ScannedFoodData {
    name: string;
    calories: number;
    barcode: string;
    source: 'openfoodfacts' | 'rakuten' | 'manual';
}

// 画面サイズとスキャン枠のサイズ定義
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_WIDTH = 280;
const SCAN_AREA_HEIGHT = 180;

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ visible, onClose, onScanned }) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('検索中...');

    // 誤検知防止用のState
    const [isScanReady, setIsScanReady] = useState(false);

    // --- 確認・編集モーダル用State ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [tempData, setTempData] = useState<ScannedFoodData | null>(null);
    const [inputName, setInputName] = useState('');
    const [inputCalories, setInputCalories] = useState('');

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        if (visible) {
            getPermissions();
            resetScanner();

            // 対策2: 起動直後の誤検知を防ぐため、1秒間はスキャンを無効化
            setIsScanReady(false);
            const timer = setTimeout(() => {
                setIsScanReady(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    // スキャン範囲の判定ロジック
    const isBarcodeInArea = (bounds: BarcodeScanningResult['bounds']) => {
        // boundsの原点（バーコードの左上）
        const { origin, size } = bounds;

        // バーコードの中心座標
        const barcodeCenterX = origin.x + size.width / 2;
        const barcodeCenterY = origin.y + size.height / 2;

        // スキャン枠の範囲（画面中央）
        const areaLeft = (SCREEN_WIDTH - SCAN_AREA_WIDTH) / 2;
        const areaRight = areaLeft + SCAN_AREA_WIDTH;
        const areaTop = (SCREEN_HEIGHT - SCAN_AREA_HEIGHT) / 2;
        const areaBottom = areaTop + SCAN_AREA_HEIGHT;

        // バーコードの中心が、スキャン枠の中に完全に入っているか（少し余裕を持たせる）
        // ※枠から少しでもはみ出したらNGにする場合は条件を厳しくする
        const margin = 20; // 許容誤差ピクセル

        return (
            barcodeCenterX >= (areaLeft - margin) &&
            barcodeCenterX <= (areaRight + margin) &&
            barcodeCenterY >= (areaTop - margin) &&
            barcodeCenterY <= (areaBottom + margin)
        );
    };

    const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
        // 読み取り済み、ロード中、モーダル表示中、または起動待機中は無視
        if (scanned || loading || showConfirmModal || !isScanReady) return;

        // 対策1: スキャン枠の外なら無視 (Android/iOSで座標系が異なる場合があるため、try-catchで安全に)
        try {
            if (result.bounds && !isBarcodeInArea(result.bounds)) {
                return;
            }
        } catch (e) {
            // 座標取得に失敗した場合は無視せずに通す（互換性維持）
            console.warn('Bounds check failed, skipping area check');
        }

        setScanned(true);
        setLoading(true);
        setLoadingMessage('商品情報を検索中...');
        const janCode = result.data;

        try {
            // 1. OpenFoodFacts検索
            const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${janCode}.json`);
            const offJson = await offResponse.json();

            if (offJson.status === 1) {
                const product = offJson.product;
                const name = product.product_name_ja || product.product_name || '名称不明';
                const calories = product.nutriments?.['energy-kcal_100g'] || 0;

                openConfirmModal({
                    name,
                    calories: Number(calories),
                    barcode: janCode,
                    source: 'openfoodfacts'
                });
                return;
            }

            // 2. 楽天API検索 (フォールバック)
            setLoadingMessage('楽天市場を検索中...');
            const rakutenData = await searchRakutenProduct(janCode);

            if (rakutenData) {
                openConfirmModal({
                    name: rakutenData.name,
                    calories: 0, // 楽天はカロリーがないので0
                    barcode: janCode,
                    source: 'rakuten'
                });
            } else {
                // 3. データなし -> 手動入力用として開く
                openConfirmModal({
                    name: '',
                    calories: 0,
                    barcode: janCode,
                    source: 'manual'
                });
            }

        } catch (error) {
            console.error(error);
            // エラー時も手動入力へ誘導
            openConfirmModal({
                name: '',
                calories: 0,
                barcode: janCode,
                source: 'manual'
            });
        } finally {
            setLoading(false);
        }
    };

    // 確認モーダルを開く処理
    const openConfirmModal = (data: ScannedFoodData) => {
        setLoading(false);
        setTempData(data);
        setInputName(data.name);
        setInputCalories(data.calories.toString());
        setShowConfirmModal(true);
    };

    // 確定してリストに追加
    const handleConfirm = () => {
        if (tempData) {
            onScanned({
                ...tempData,
                name: inputName || '名称不明',
                calories: Number(inputCalories) || 0,
            });
            closeAll();
        }
    };

    const closeAll = () => {
        setShowConfirmModal(false);
        setTempData(null);
        onClose();
    };

    const resetScanner = () => {
        setScanned(false);
        setLoading(false);
        setShowConfirmModal(false);
        setTempData(null);
        // リセット時も少し待機時間を設ける（連続スキャン時の誤爆防止）
        setIsScanReady(false);
        setTimeout(() => setIsScanReady(true), 1000);
    };

    if (hasPermission === null) return <View />;
    if (hasPermission === false) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[styles.centerContainer, { backgroundColor: 'white' }]}>
                    <Text style={{ marginBottom: 20 }}>カメラ権限が必要です</Text>
                    <Button title="閉じる" onPress={onClose} variant="secondary" />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {/* カメラビュー */}
                {!showConfirmModal && (
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8"] }}
                    />
                )}

                {/* スキャン画面のUI */}
                {!showConfirmModal && (
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <View style={styles.iconBackground}>
                                <IconButton name="close" color="white" size={32} onPress={onClose} />
                            </View>
                        </View>

                        <View style={styles.scanAreaContainer}>
                            {/* スキャン準備ができるまで枠の色を変えるなどのフィードバックも可能 */}
                            <View style={[styles.scanArea, !isScanReady && { borderColor: '#888' }]} />
                            <Text style={styles.instruction}>
                                {isScanReady ? 'バーコードを枠内に合わせてください' : '準備中...'}
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            <Button title="キャンセル" onPress={onClose} variant="ghost" textStyle={{ color: 'white' }} style={styles.cancelButton} />
                        </View>
                    </View>
                )}

                {/* ローディング */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>{loadingMessage}</Text>
                    </View>
                )}

                {/* 結果確認・編集モーダル */}
                <Modal visible={showConfirmModal} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                                <Card style={styles.confirmCard} padding="large">
                                    <Text style={styles.confirmTitle}>
                                        {tempData?.source === 'manual' ? '未登録の商品' : '商品が見つかりました'}
                                    </Text>

                                    <Text style={styles.confirmSubtitle}>
                                        内容を確認・修正して追加してください
                                    </Text>

                                    <Input
                                        label="商品名"
                                        value={inputName}
                                        onChangeText={setInputName}
                                        placeholder="例: 伊藤園 おーいお茶"
                                    />

                                    <Input
                                        label="カロリー (kcal)"
                                        value={inputCalories}
                                        onChangeText={setInputCalories}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        rightElement={<Text style={{ color: '#6B7280', marginRight: 8 }}>kcal</Text>}
                                    />

                                    {tempData?.source === 'rakuten' && (
                                        <Text style={styles.helperText}>※楽天APIにはカロリー情報が含まれません。パッケージ裏面を確認して入力してください。</Text>
                                    )}

                                    <View style={styles.buttonRow}>
                                        <Button
                                            title="再スキャン"
                                            onPress={resetScanner}
                                            variant="outline"
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Button
                                            title="追加する"
                                            onPress={handleConfirm}
                                            variant="primary"
                                            style={{ flex: 1, marginLeft: 8 }}
                                        />
                                    </View>
                                </Card>
                            </KeyboardAvoidingView>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingVertical: 50 },
    header: { alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 10 },
    iconBackground: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30, padding: 4 },

    // スキャン枠の位置調整
    scanAreaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
    scanArea: {
        width: SCAN_AREA_WIDTH,
        height: SCAN_AREA_HEIGHT,
        borderWidth: 2,
        borderColor: '#00FF00',
        borderRadius: 12
    },

    instruction: { color: 'white', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
    footer: { alignItems: 'center', marginBottom: 20 },
    cancelButton: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 30 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: 'white', marginTop: 16, fontWeight: 'bold', fontSize: 16 },

    // モーダル用スタイル
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    confirmCard: { width: '100%' },
    confirmTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#1F2937' },
    confirmSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
    helperText: { fontSize: 12, color: '#EF4444', marginBottom: 16 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});