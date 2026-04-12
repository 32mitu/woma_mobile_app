import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Dimensions, Alert, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../../../../ui/IconButton';
import { Button } from '../../../../ui/Button';
import { Card } from '../../../../ui/Card';
import { Input } from '../../../../ui/Input';
import { Badge } from '../../../../ui/Badge';
// 楽天APIユーティリティのインポート
import { searchRakutenProduct } from '../../../../utils/rakutenApi';
// Firestore関連
import { db } from '../../../../../firebaseConfig';
import { collection, query, where, getDocs, limit, setDoc, doc } from 'firebase/firestore';

interface BarcodeScannerProps {
    visible: boolean;
    onClose: () => void;
    onScanned: (data: ScannedFoodData) => void;
}

export interface ScannedFoodData {
    name: string;
    calories: number;
    barcode: string;
    source: 'openfoodfacts' | 'rakuten' | 'firestore' | 'manual';
    imageUrl?: string;
    unitType?: 'serving' | '100g' | 'manual'; // 単位の管理用
    protein?: number;
    fat?: number;
    carbs?: number;
}

// 画面サイズ定義
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = 280;

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ visible, onClose, onScanned }) => {
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // 誤検知防止用のState
    const [isScanReady, setIsScanReady] = useState(false);

    // UI状態
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [scannedData, setScannedData] = useState<ScannedFoodData | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedCalories, setEditedCalories] = useState('');

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
        if (visible) {
            resetScanner();
            // 起動直後の誤検知を防ぐため、1秒間はスキャンを無効化
            setIsScanReady(false);
            const timer = setTimeout(() => setIsScanReady(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [visible, permission]);

    const resetScanner = () => {
        setScanned(false);
        setConfirmModalVisible(false);
        setLoading(false);
        setScannedData(null);
        setEditedName('');
        setEditedCalories('');
        setLoadingMessage('');
    };

    // スキャン範囲の判定ロジック
    const isBarcodeInArea = (bounds: BarcodeScanningResult['bounds']) => {
        const { origin, size } = bounds;
        const barcodeCenterX = origin.x + size.width / 2;
        const barcodeCenterY = origin.y + size.height / 2;

        const areaLeft = (SCREEN_WIDTH - SCAN_AREA_SIZE) / 2;
        const areaRight = areaLeft + SCAN_AREA_SIZE;
        const areaTop = (SCREEN_HEIGHT - SCAN_AREA_SIZE * 0.6) / 2; // 高さ比率0.6に合わせる
        const areaBottom = areaTop + SCAN_AREA_SIZE * 0.6;

        const margin = 30; // 許容誤差

        return (
            barcodeCenterX >= (areaLeft - margin) &&
            barcodeCenterX <= (areaRight + margin) &&
            barcodeCenterY >= (areaTop - margin) &&
            barcodeCenterY <= (areaBottom + margin)
        );
    };

    // ★追加: 公開データベースへの保存処理 (Crowdsourcing)
    const saveToPublicDb = async (data: ScannedFoodData) => {
        // 既にFirestoreから取得したデータなら保存不要
        if (data.source === 'firestore') return;
        // バーコードがない(手入力など)場合は保存できない(IDがないため)
        if (!data.barcode) return;

        try {
            // publicProducts/{barcode} に保存
            // setDoc(..., { merge: true }) にすると、既存データがあっても安全に統合できますが、
            // ここでは「最新のユーザー入力」を正として上書きします。
            await setDoc(doc(db, 'publicProducts', data.barcode), {
                name: data.name,
                calories: data.calories,
                barcode: data.barcode,
                // 栄養素情報 (あれば)
                p: data.protein || 0,
                f: data.fat || 0,
                c: data.carbs || 0,
                // メタデータ
                unitType: data.unitType || 'manual',
                imageUrl: data.imageUrl || null,
                source: 'user_contribution', // 出所を記録
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            console.log(`[Crowdsourcing] Saved ${data.name} to public DB.`);
        } catch (error) {
            // 裏側の処理なので、ユーザーにエラーは見せない (consoleのみ)
            console.warn("[Crowdsourcing] Failed to save:", error);
        }
    };

    const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
        if (scanned || loading || confirmModalVisible || !isScanReady) return;

        try {
            if (result.bounds && !isBarcodeInArea(result.bounds)) {
                return;
            }
        } catch (e) {
            console.warn('Bounds check skipped');
        }

        setScanned(true);
        setLoading(true);
        setLoadingMessage(t('barcode.searchingProduct'));

        const janCode = result.data;
        console.log(`Scanned: ${janCode}`);

        try {
            // --- Tier 0: Firestore (自前DB) ---
            const q = query(collection(db, 'publicProducts'), where('barcode', '==', janCode), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                showConfirmModal({
                    barcode: janCode,
                    name: data.name,
                    calories: data.calories,
                    source: 'firestore',
                    imageUrl: data.imageUrl,
                    unitType: data.unitType || 'manual',
                    protein: data.p,
                    fat: data.f,
                    carbs: data.c
                });
                return;
            }

            // --- Tier 1: OpenFoodFacts API ---
            try {
                const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${janCode}.json`);
                const offData = await offRes.json();

                if (offData.status === 1) {
                    const product = offData.product;
                    const nutriments = product.nutriments || {};

                    let calories = nutriments['energy-kcal_serving'];
                    let unitType: 'serving' | '100g' = 'serving';

                    if (typeof calories !== 'number') {
                        calories = nutriments['energy-kcal_100g'];
                        unitType = '100g';
                    }

                    calories = typeof calories === 'number' ? Math.round(calories) : 0;
                    const name = product.product_name_ja || product.product_name || t('barcode.unknownProduct');

                    showConfirmModal({
                        barcode: janCode,
                        name: name,
                        calories: calories,
                        source: 'openfoodfacts',
                        imageUrl: product.image_front_url,
                        unitType: unitType,
                        protein: unitType === 'serving' ? nutriments.proteins_serving : nutriments.proteins_100g,
                        fat: unitType === 'serving' ? nutriments.fat_serving : nutriments.fat_100g,
                        carbs: unitType === 'serving' ? nutriments.carbohydrates_serving : nutriments.carbohydrates_100g
                    });
                    return;
                }
            } catch (e) {
                console.warn('OpenFoodFacts fetch error', e);
            }

            // --- Tier 2: 楽天API ---
            try {
                setLoadingMessage(t('barcode.searchingRakuten'));
                const rakutenItem = await searchRakutenProduct(janCode);
                if (rakutenItem) {
                    showConfirmModal({
                        barcode: janCode,
                        name: rakutenItem.name,
                        calories: 0,
                        source: 'rakuten',
                        imageUrl: rakutenItem.image,
                        unitType: 'manual'
                    });
                    return;
                }
            } catch (e) {
                console.warn('Rakuten API error', e);
            }

            // --- ヒットなし (手動入力) ---
            Alert.alert(
                t('barcode.productNotFound'),
                t('barcode.productNotFoundMessage'),
                [
                    { text: t('barcode.rescan'), onPress: () => { setScanned(false); setLoading(false); } },
                    {
                        text: t('barcode.enterManually'),
                        onPress: () => {
                            showConfirmModal({
                                barcode: janCode,
                                name: "",
                                calories: 0,
                                source: 'manual',
                                unitType: 'manual'
                            });
                        }
                    }
                ]
            );

        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('barcode.fetchError'));
            setScanned(false);
            setLoading(false);
        }
    };

    const showConfirmModal = (data: ScannedFoodData) => {
        setLoading(false);
        setScannedData(data);
        setEditedName(data.name);
        setEditedCalories(data.calories > 0 ? data.calories.toString() : '');
        setConfirmModalVisible(true);
    };

    const handleConfirm = () => {
        if (!scannedData) return;

        const finalCalories = Number(editedCalories) || 0;

        const finalData: ScannedFoodData = {
            ...scannedData,
            name: editedName,
            calories: finalCalories,
        };

        // 1. 親コンポーネントへ渡す (UI更新)
        onScanned(finalData);

        // 2. ★裏側で共有DBに保存 (Crowdsourcing)
        // データソースがFirestore以外で、かつ有効なデータ（カロリー0以外など）なら保存
        if (finalData.source !== 'firestore' && (finalData.calories > 0 || finalData.name !== '')) {
            // awaitしない (Fire and forget)
            saveToPublicDb(finalData);
        }

        resetScanner();
        onClose();
    };

    const handleCloseModal = () => {
        setConfirmModalVisible(false);
        setScanned(false); // 再スキャン可能に
    };

    if (!visible) return null;

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text>{t('barcode.permissionRequired')}</Text>
                    <Button title={t('barcode.allow')} onPress={requestPermission} />
                    <Button title={t('barcode.close')} variant="secondary" onPress={onClose} />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {!confirmModalVisible && (
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["ean13", "ean8"],
                        }}
                    />
                )}

                {!confirmModalVisible && (
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <View style={styles.iconBackground}>
                                <IconButton name="close" iconColor="white" onPress={onClose} />
                            </View>
                            <Text style={styles.headerTitle}>{t('barcode.scanTitle')}</Text>
                        </View>

                        <View style={styles.scanAreaContainer}>
                            <View style={[styles.scanArea, !isScanReady && { borderColor: '#999' }]} />
                            <Text style={styles.instruction}>
                                {loading ? (loadingMessage || t('barcode.searching')) : (isScanReady ? t('barcode.alignBarcode') : t('barcode.preparing'))}
                            </Text>
                            {loading && <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 20 }} />}
                        </View>
                    </View>
                )}

                <Modal
                    visible={confirmModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCloseModal}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.modalOverlay}
                        >
                            <Card style={styles.confirmCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('barcode.resultTitle')}</Text>
                                    <IconButton name="close" size={20} onPress={handleCloseModal} />
                                </View>

                                {scannedData?.imageUrl && (
                                    <View style={styles.imageContainer}>
                                        <Image source={{ uri: scannedData.imageUrl }} style={styles.productImage} resizeMode="contain" />
                                    </View>
                                )}

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>{t('barcode.productName')}</Text>
                                    <Input
                                        value={editedName}
                                        onChangeText={setEditedName}
                                        placeholder={t('barcode.productNamePlaceholder')}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <View style={styles.rowLabel}>
                                        <Text style={styles.label}>{t('barcode.calories')}</Text>

                                        {scannedData?.unitType === 'serving' && (
                                            <Badge label={t('barcode.perServing')} color="success" size="sm" />
                                        )}
                                        {scannedData?.unitType === '100g' && (
                                            <Badge label={t('barcode.per100g')} color="warning" size="sm" />
                                        )}
                                    </View>
                                    <Input
                                        value={editedCalories}
                                        onChangeText={setEditedCalories}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        autoFocus={!scannedData?.calories}
                                    />
                                </View>

                                {scannedData?.source === 'rakuten' && !scannedData.calories && (
                                    <Text style={styles.rakutenAlert}>
                                        {t('barcode.calorieNote')}
                                    </Text>
                                )}

                                <Button
                                    title={t('barcode.addToList')}
                                    onPress={handleConfirm}
                                    style={{ marginTop: 10 }}
                                />
                            </Card>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
    overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 50 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    iconBackground: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30, padding: 4 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 16, textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3 },

    scanAreaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
    scanArea: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE * 0.6,
        borderWidth: 2,
        borderColor: '#4ECDC4',
        borderRadius: 20,
        backgroundColor: 'transparent'
    },
    instruction: { color: 'white', marginTop: 20, fontSize: 14, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, overflow: 'hidden' },

    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
    confirmCard: { width: '100%', maxHeight: '90%', padding: 20, backgroundColor: 'white', borderRadius: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    imageContainer: { alignItems: 'center', marginBottom: 15 },
    productImage: { width: 120, height: 120, borderRadius: 8 },
    formGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#666', marginBottom: 5 },
    rowLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    rakutenAlert: { fontSize: 12, color: '#EF4444', marginBottom: 10, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 6 }
});