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
    const appId = process.env.EXPO_PUBLIC_RAKUTEN_APP_ID;

    console.log(`[Rakuten API] Searching for JAN: ${janCode}`);

    if (!appId) {
        console.error('[Rakuten API] Error: App ID is missing. Please check .env and restart server.');
        return null;
    }

    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&keyword=${janCode}&applicationId=${appId}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[Rakuten API] HTTP Error: ${response.status}`);
            return null;
        }

        const data: RakutenSearchResponse = await response.json();
        console.log(`[Rakuten API] Hits: ${data.Items?.length || 0}`);

        if (data.Items && data.Items.length > 0) {
            const item = data.Items[0].Item;
            return {
                name: item.itemName,
                calories: 0, // 楽天にはカロリー情報がない
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