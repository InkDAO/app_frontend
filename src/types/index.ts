export interface Asset {
    postTitle: string,
    postCid: string,
    postId: string,
    author: string,
    thumbnailCid?: string,
    description?: string,
    priceInNative?: string,
    hashtags?: string,
    publishedAt?: string,
    totalSupply?: bigint | string | number,
}

export interface WalletState {
    address: string;
    isConnected: boolean;
}