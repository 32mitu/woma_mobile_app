import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { IconButton } from '../../../../ui/IconButton';
import { Button } from '../../../../ui/Button';

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

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ visible, onClose, onScanned }) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        if (visible) {
            getPermissions();
            setScanned(false);
            setLoading(false);
        }
    }, [visible]);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);
        const janCode = data;

        try {
            // OpenFoodFacts APIコール
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${janCode}.json`);
            const json = await response.json();

            if (json.status === 1) {
                const product = json.product;
                const name = product.product_name_ja || product.product_name || '名称不明';
                const calories = product.nutriments?.['energy-kcal_100g'] || 0;

                Alert.alert(
                    '商品が見つかりました',
                    `${name}\n(100gあたり約${calories}kcal)`,
                    [
                        {
                            text: 'キャンセル',
                            style: 'cancel',
                            onPress: () => {
                                setScanned(false);
                                setLoading(false);
                            }
                        },
                        {
                            text: '追加する',
                            onPress: () => {
                                onScanned({
                                    name,
                                    calories: Number(calories),
                                    barcode: janCode,
                                    source: 'openfoodfacts'
                                });
                                onClose();
                            }
                        }
                    ]
                );
            } else {
                // 見つからなかった場合
                Alert.alert(
                    '未登録の商品です',
                    'OpenFoodFactsにデータがありませんでした。\n(明日、楽天API連携を実装します)',
                    [{
                        text: '再試行', onPress: () => {
                            setScanned(false);
                            setLoading(false);
                        }
                    }]
                );
            }
        } catch (error) {
            console.error(error);
            Alert.alert('エラー', 'データの取得に失敗しました');
            setScanned(false);
            setLoading(false);
        }
    };

    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[styles.container, { backgroundColor: 'white' }]}>
                    <Text style={{ marginBottom: 20 }}>カメラのアクセス権限がありません</Text>
                    <Button title="閉じる" onPress={onClose} variant="secondary" />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8"],
                    }}
                />

                {/* オーバーレイUI */}
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <IconButton
                            name="close"
                            color="white"
                            size={32}
                            onPress={onClose}
                            style={styles.closeIcon}
                        />
                    </View>

                    <View style={styles.scanAreaContainer}>
                        <View style={styles.scanArea} />
                        <Text style={styles.instruction}>バーコードを枠内に合わせてください</Text>
                    </View>

                    {/* 下部のキャンセルボタン (カスタムButtonを使用) */}
                    <View style={styles.footer}>
                        <Button
                            title="キャンセル"
                            onPress={onClose}
                            variant="ghost"
                            textStyle={{ color: 'white' }}
                            style={styles.cancelButton}
                        />
                    </View>
                </View>

                {/* ローディング表示 */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={{ color: 'white', marginTop: 10, fontWeight: 'bold' }}>検索中...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingVertical: 50,
    },
    header: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    closeIcon: {
        backgroundColor: 'rgba(0,0,0,0.3)', // 少し背景をつけて見やすく
        borderRadius: 20,
    },
    scanAreaContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
    },
    scanArea: {
        width: 280,
        height: 180,
        borderWidth: 2,
        borderColor: '#00FF00',
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    instruction: {
        color: 'white',
        marginTop: 20,
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        paddingHorizontal: 30,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});