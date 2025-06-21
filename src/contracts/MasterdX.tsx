export const admin = "0xEBA436aE4012D8194a5b44718a8ba6ec553241bE";

export const maxterdXConfig = {
  address: "0x9da04916B62Ea5D31CBbF8e8e70F09E6aBFE9a32",
  abi: [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    { inputs: [], name: "EmptyPost", type: "error" },
    { inputs: [], name: "EmptyPostTitle", type: "error" },
    { inputs: [], name: "EnforcedPause", type: "error" },
    { inputs: [], name: "ExpectedPause", type: "error" },
    { inputs: [], name: "InvalidInitialization", type: "error" },
    { inputs: [], name: "InvalidPost", type: "error" },
    { inputs: [], name: "NotAdmin", type: "error" },
    { inputs: [], name: "NotBot", type: "error" },
    { inputs: [], name: "NotInitializing", type: "error" },
    { inputs: [], name: "PostAlreadyArchived", type: "error" },
    { inputs: [], name: "PostAlreadyShared", type: "error" },
    { inputs: [], name: "PostIsAlive", type: "error" },
    { inputs: [], name: "PostTitleLengthTooBig", type: "error" },
    { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "_postId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "string",
          name: "_comment",
          type: "string",
        },
        {
          indexed: false,
          internalType: "address",
          name: "_owner",
          type: "address",
        },
      ],
      name: "CommentAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bool",
          name: "_freeWindowOpen",
          type: "bool",
        },
      ],
      name: "FreeWindowOpenUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "_postId",
          type: "bytes32",
        },
      ],
      name: "FuneralCompleted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint64",
          name: "version",
          type: "uint64",
        },
      ],
      name: "Initialized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "_maxPostTitleLength",
          type: "uint256",
        },
      ],
      name: "MaxPostTitleLengthUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "Paused",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "_postId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "string",
          name: "_postTitle",
          type: "string",
        },
        {
          indexed: false,
          internalType: "string",
          name: "_postBody",
          type: "string",
        },
        {
          indexed: false,
          internalType: "address",
          name: "_owner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "_endTime",
          type: "uint256",
        },
      ],
      name: "PostAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "_maxPostLifeTime",
          type: "uint256",
        },
      ],
      name: "PostLifeTimeUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "_tokenRequiredPerPost",
          type: "uint256",
        },
      ],
      name: "TokenRequiredPerPostUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "Unpaused",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "_dXConfig",
          type: "address",
        },
      ],
      name: "dXConfigUpdated",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "_dXConfig", type: "address" },
        { internalType: "uint256", name: "_postLifeTime", type: "uint256" },
        {
          internalType: "uint256",
          name: "_maxPostTitleLength",
          type: "uint256",
        },
      ],
      name: "__MasterdX_Init",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes32", name: "_postId", type: "bytes32" },
        { internalType: "string", name: "_comment", type: "string" },
      ],
      name: "addComment",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "string", name: "_postTitle", type: "string" },
        { internalType: "string", name: "_postBody", type: "string" },
      ],
      name: "addPost",
      outputs: [{ internalType: "bytes32", name: "_postId", type: "bytes32" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes32", name: "", type: "bytes32" },
        { internalType: "uint256", name: "", type: "uint256" },
      ],
      name: "commentData",
      outputs: [
        { internalType: "bytes32", name: "postId", type: "bytes32" },
        { internalType: "string", name: "comment", type: "string" },
        { internalType: "address", name: "owner", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "dXConfig",
      outputs: [
        { internalType: "contract IdXConfig", name: "", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes32[]", name: "_postIds", type: "bytes32[]" },
      ],
      name: "funeral",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "getAllPosts",
      outputs: [
        {
          components: [
            { internalType: "bytes32", name: "postId", type: "bytes32" },
            { internalType: "string", name: "postTitle", type: "string" },
            { internalType: "string", name: "postBody", type: "string" },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "uint256", name: "endTime", type: "uint256" },
            { internalType: "bool", name: "archived", type: "bool" },
          ],
          internalType: "struct IMasterdX.PostInfo[]",
          name: "allPostInfo",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes32", name: "_postId", type: "bytes32" }],
      name: "getCommentsInfo",
      outputs: [
        {
          components: [
            { internalType: "bytes32", name: "postId", type: "bytes32" },
            { internalType: "string", name: "comment", type: "string" },
            { internalType: "address", name: "owner", type: "address" },
          ],
          internalType: "struct IMasterdX.CommentInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes32", name: "_postId", type: "bytes32" }],
      name: "getPostInfo",
      outputs: [
        {
          components: [
            { internalType: "bytes32", name: "postId", type: "bytes32" },
            { internalType: "string", name: "postTitle", type: "string" },
            { internalType: "string", name: "postBody", type: "string" },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "uint256", name: "endTime", type: "uint256" },
            { internalType: "bool", name: "archived", type: "bool" },
          ],
          internalType: "struct IMasterdX.PostInfo",
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "maxPostTitleLength",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "pause",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "paused",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      name: "postData",
      outputs: [
        { internalType: "bytes32", name: "postId", type: "bytes32" },
        { internalType: "string", name: "postTitle", type: "string" },
        { internalType: "string", name: "postBody", type: "string" },
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "uint256", name: "endTime", type: "uint256" },
        { internalType: "bool", name: "archived", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "postIds",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "postLifeTime",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_maxPostTitleLength",
          type: "uint256",
        },
      ],
      name: "setMaxPostTitleLength",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_postLifeTime", type: "uint256" },
      ],
      name: "setPostLifeTime",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "totalPosts",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "unpause",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_dXConfig", type: "address" }],
      name: "updatedXConfig",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
} as const;
