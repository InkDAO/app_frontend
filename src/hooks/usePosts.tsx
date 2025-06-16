import { useState, useEffect } from "react";
import { Post } from "@/types";
import { useReadContract } from "wagmi";
import { maxterdXConfig } from "@/contracts/MasterdX";

interface PostInfo {
  postId: `0x${string}`;
  postTitle: string;
  postBody: string;
  owner: `0x${string}`;
  endTime: bigint;
  archived: boolean;
}

export const usePosts = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isAllPostLoading, setIsAllPostLoading] = useState(true);

  const { data: allPostInfo, isLoading: isAllPostInfoLoading, refetch: refetchTotalPosts } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: "getAllPosts",
  });


  useEffect(() => {
    if (!isAllPostInfoLoading) {
      if (allPostInfo) {
        const convertedPosts: Post[] = (allPostInfo as PostInfo[]).map(post => ({
          postId: post.postId,
          postTitle: post.postTitle,
          postBody: post.postBody,
          owner: post.owner,
          endTime: post.endTime.toString(),
          archived: post.archived
        }));
        setAllPosts(convertedPosts);
      }
      setIsAllPostLoading(false);
    } else {
        setIsAllPostLoading(true);
    }
  }, [isAllPostInfoLoading, allPostInfo]);

  const refetchPosts = () => {
    refetchTotalPosts();
  };

  return { allPosts, isAllPostLoading, refetchPosts };
};