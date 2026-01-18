import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * 画像を圧縮・リサイズする関数
 * @param uri 元画像のURI
 * @returns 圧縮された画像のURI（失敗した場合は元のURI）
 */
export const compressImage = async (uri: string): Promise<string> => {
    try {
        // 幅1080pxにリサイズし、JPEG品質0.7(70%)に圧縮
        const result = await manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: SaveFormat.JPEG }
        );
        return result.uri;
    } catch (error) {
        console.error("Image compression failed:", error);
        // 圧縮に失敗してもフローを止めないよう元のURIを返す
        return uri;
    }
};