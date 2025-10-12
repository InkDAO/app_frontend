export interface Asset {
    assetTitle: string,
    assetCid: string,
    assetAddress: string,
    author: string,
    thumbnailCid?: string,
    description?: string,
    costInNative?: string,
}

export interface Comment {
    postId: string;
    commentCid: string;
    owner: string;
}

export interface CommentWithPostTitle {
    postId: string;
    commentCid: string;
    owner: string;
    postTitle: string;
}

export interface WalletState {
    address: string;
    isConnected: boolean;
}