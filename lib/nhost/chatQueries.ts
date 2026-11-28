/**
 * Hasura GraphQL Queries, Mutations & WebSocket Subscriptions for FR8X Floating Chat.
 * All queries enforce bounded limits (default 50).
 */

export const SUB_CHAT_MESSAGES = /* GraphQL */ `
  subscription OnChatMessages($limit: Int = 50) {
    chat_messages(order_by: { created_at: desc }, limit: $limit) {
      id
      conversation_id
      sender_id
      recipient_id
      client_message_id
      content
      message_type
      attachments
      created_at
      read_at
      edited_at
      deleted_at
    }
  }
`;

export const SUB_CHAT_CONVERSATIONS = /* GraphQL */ `
  subscription OnChatConversations($limit: Int = 50) {
    chat_conversations(order_by: { updated_at: desc }, limit: $limit) {
      id
      direct_key
      context_type
      context_id
      context_title
      updated_at
      chat_conversation_members {
        user_id
        last_read_at
      }
    }
  }
`;

export const SUB_CHAT_PRESENCE = /* GraphQL */ `
  subscription OnChatPresence($cutoff: timestamptz!, $limit: Int = 100) {
    chat_presence_sessions(
      where: { last_seen_at: { _gte: $cutoff } }
      order_by: { last_seen_at: desc }
      limit: $limit
    ) {
      session_id
      user_id
      status
      last_seen_at
      typing_conversation_id
      typing_expires_at
    }
  }
`;

export const QUERY_CONVERSATION_MESSAGES = /* GraphQL */ `
  query GetConversationMessages($conversationId: uuid!, $limit: Int = 50) {
    chat_messages(
      where: {
        conversation_id: { _eq: $conversationId }
        deleted_at: { _is_null: true }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      conversation_id
      sender_id
      recipient_id
      client_message_id
      content
      message_type
      attachments
      created_at
      read_at
      edited_at
    }
  }
`;

export const QUERY_MISSED_MESSAGES = /* GraphQL */ `
  query GetMissedMessages($since: timestamptz!, $limit: Int = 50) {
    chat_messages(
      where: { created_at: { _gte: $since } }
      order_by: { created_at: asc }
      limit: $limit
    ) {
      id
      conversation_id
      sender_id
      recipient_id
      client_message_id
      content
      message_type
      attachments
      created_at
      read_at
      edited_at
      deleted_at
    }
  }
`;

export const QUERY_CONVERSATION_BY_DIRECT_KEY = /* GraphQL */ `
  query GetConversationByDirectKey($directKey: String!) {
    chat_conversations(where: { direct_key: { _eq: $directKey } }, limit: 1) {
      id
      direct_key
      context_type
      context_id
      context_title
      updated_at
    }
  }
`;

export const MUTATION_UPSERT_CONVERSATION = /* GraphQL */ `
  mutation UpsertConversation(
    $directKey: String!
    $contextType: String
    $contextId: String
    $contextTitle: String
    $members: [chat_conversation_members_insert_input!]!
  ) {
    insert_chat_conversations_one(
      object: {
        direct_key: $directKey
        context_type: $contextType
        context_id: $contextId
        context_title: $contextTitle
        chat_conversation_members: {
          data: $members
          on_conflict: {
            constraint: chat_conversation_members_pkey
            update_columns: [last_read_at]
          }
        }
      }
      on_conflict: {
        constraint: chat_conversations_direct_key_key
        update_columns: [context_type, context_id, context_title]
      }
    ) {
      id
      direct_key
      context_type
      context_id
      context_title
      updated_at
    }
  }
`;

export const MUTATION_INSERT_MESSAGE = /* GraphQL */ `
  mutation InsertChatMessage(
    $conversationId: uuid!
    $recipientId: String!
    $clientMessageId: String!
    $content: String!
    $messageType: String = "text"
  ) {
    insert_chat_messages_one(
      object: {
        conversation_id: $conversationId
        recipient_id: $recipientId
        client_message_id: $clientMessageId
        content: $content
        message_type: $messageType
      }
    ) {
      id
      conversation_id
      sender_id
      recipient_id
      client_message_id
      content
      message_type
      created_at
      read_at
    }
  }
`;

export const MUTATION_MARK_MESSAGES_READ = /* GraphQL */ `
  mutation MarkConversationMessagesRead(
    $conversationId: uuid!
    $recipientId: String!
    $readAt: timestamptz!
  ) {
    update_chat_messages(
      where: {
        conversation_id: { _eq: $conversationId }
        recipient_id: { _eq: $recipientId }
        read_at: { _is_null: true }
      }
      _set: { read_at: $readAt }
    ) {
      affected_rows
    }
    update_chat_conversation_members(
      where: {
        conversation_id: { _eq: $conversationId }
        user_id: { _eq: $recipientId }
      }
      _set: { last_read_at: $readAt }
    ) {
      affected_rows
    }
  }
`;

export const MUTATION_UPSERT_PRESENCE = /* GraphQL */ `
  mutation UpsertPresenceSession(
    $sessionId: String!
    $userId: String!
    $status: String!
    $lastSeenAt: timestamptz!
    $typingConversationId: uuid
    $typingExpiresAt: timestamptz
  ) {
    insert_chat_presence_sessions_one(
      object: {
        session_id: $sessionId
        user_id: $userId
        status: $status
        last_seen_at: $lastSeenAt
        typing_conversation_id: $typingConversationId
        typing_expires_at: $typingExpiresAt
      }
      on_conflict: {
        constraint: chat_presence_sessions_pkey
        update_columns: [
          status
          last_seen_at
          typing_conversation_id
          typing_expires_at
        ]
      }
    ) {
      session_id
      status
      last_seen_at
    }
  }
`;
