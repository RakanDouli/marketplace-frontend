export const GET_OR_CREATE_THREAD_MUTATION = `
  mutation GetOrCreateThread($input: GetOrCreateThreadInput!) {
    getOrCreateThread(input: $input) {
      id
      listingId
      buyerId
      sellerId
      lastMessageAt
    }
  }
`;

export const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      threadId
      senderId
      text
      imageKey
      status
      createdAt
    }
  }
`;

export const MY_THREADS_QUERY = `
  query MyThreads {
    myThreads {
      id
      listingId
      buyerId
      sellerId
      lastMessageAt
    }
  }
`;

export const THREAD_MESSAGES_QUERY = `
  query ThreadMessages($threadId: ID!, $limit: Int) {
    threadMessages(threadId: $threadId, limit: $limit) {
      id
      threadId
      senderId
      text
      imageKey
      status
      createdAt
    }
  }
`;

export const MARK_THREAD_READ_MUTATION = `
  mutation MarkThreadRead($input: MarkReadInput!) {
    markThreadRead(input: $input)
  }
`;

export const UNREAD_COUNT_QUERY = `
  query UnreadCount {
    unreadCount
  }
`;

export const DELETE_MESSAGE_MUTATION = `
  mutation DeleteMessage($input: DeleteMessageInput!) {
    deleteMessage(input: $input)
  }
`;

export const DELETE_THREAD_MUTATION = `
  mutation DeleteThread($threadId: ID!) {
    deleteThread(threadId: $threadId)
  }
`;

export const CREATE_REPORT_MUTATION = `
  mutation CreateReport($reportedUserId: ID!, $entityType: String!, $entityId: ID, $reason: String!, $details: String) {
    createReport(
      reportedUserId: $reportedUserId
      entityType: $entityType
      entityId: $entityId
      reason: $reason
      details: $details
    ) {
      id
      status
    }
  }
`;

export const BLOCK_USER_MUTATION = `
  mutation BlockUser($blockedUserId: ID!) {
    blockUser(blockedUserId: $blockedUserId) {
      id
      blockedAt
    }
  }
`;

export const EDIT_MESSAGE_MUTATION = `
  mutation EditMessage($input: EditMessageInput!) {
    editMessage(input: $input) {
      id
      text
      createdAt
    }
  }
`;

export const MY_BLOCKED_USERS_QUERY = `
  query MyBlockedUsers {
    myBlockedUsers {
      id
      blockedUserId
      blockedAt
    }
  }
`;

export const UNBLOCK_USER_MUTATION = `
  mutation UnblockUser($blockedUserId: ID!) {
    unblockUser(blockedUserId: $blockedUserId)
  }
`;

export const CREATE_IMAGE_UPLOAD_URL_MUTATION = `
  mutation CreateImageUploadUrl {
    createImageUploadUrl {
      uploadUrl
      assetKey
    }
  }
`;
