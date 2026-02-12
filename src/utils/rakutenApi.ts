interface RakutenItem {
    Item: {
        itemName: string;
        itemUrl: string;
        mediumImageUrls: { imageUrl: string }[];
        itemPrice: number;
    };
}

interface RakutenSearchResponse {
    Items: RakutenItem[];
}

export const searchRakutenProduct = async (janCode: string) => {
    // .env から環境変数を読み込む
    // Expo SDK 49以降、EXPO_PUBLIC_ 接頭辞がついた変数は自動的に process.env に注入されます
    const appId = process.env.EXPO_PUBLIC_RAKUTEN_APP_ID;

    console.log(`[Rakuten API] Searching for JAN: ${janCode}`);

    // デバッグログ: IDが読み込まれているか確認（セキュリティのため先頭のみ表示）
    console.log(`[Rakuten API] App ID loaded: ${appId ? `Yes (${appId.substring(0, 5)}...)` : 'No'}`);

    if (!appId) {
        console.error('[Rakuten API] Error: App ID is missing. Please check .env file and restart server with -c option.');
        return null;
    }

    // URL構築
    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&keyword=${janCode}&applicationId=${appId}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[Rakuten API] HTTP Error: ${response.status}`);

            // エラーの詳細（楽天APIからのメッセージ）をログに出して原因を特定しやすくする
            try {
                const errorText = await response.text();
                console.error(`[Rakuten API] Error Detail: ${errorText}`);
            } catch (e) {
                console.error('[Rakuten API] Could not read error detail.');
            }

            return null;
        }

        const data: RakutenSearchResponse = await response.json();
        console.log(`[Rakuten API] Hits: ${data.Items?.length || 0}`);

        if (data.Items && data.Items.length > 0) {
            const item = data.Items[0].Item;
            // 必要なデータ形式に変換して返す
            return {
                name: item.itemName,
                calories: 0, // 楽天APIにはカロリー情報がないため0
                url: item.itemUrl,
                image: item.mediumImageUrls.length > 0 ? item.mediumImageUrls[0].imageUrl : null
            };
        }
        return null;
    } catch (error) {
        console.error('[Rakuten API] Fetch Error:', error);
        return null;
    }
};