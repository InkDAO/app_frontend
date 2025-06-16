export interface Post {
  postId: string,
  postTitle: string,
  postBody: string,
  owner: string,
  endTime: string,
  archived: boolean,
}

export interface Comment {
  postId: string;
  comment: string;
  owner: string;
}

export interface CommentWithPostTitle {
  postId: string;
  comment: string;
  owner: string;
  postTitle: string;
}

export interface WalletState {
  address: string;
  isConnected: boolean;
}