import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/appwrite/config";
import { appwriteConfig } from "@/lib/appwrite/config";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

export const useRealtimeMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to new messages in the conversation
    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.messageCollectionId}.documents`,
      (response) => {
        const { events, payload } = response;

        // Check if the message belongs to our conversation
        if (payload.conversationId === conversationId) {
          // New message created
          if (events.includes(`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.messageCollectionId}.documents.*.create`)) {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_MESSAGES, conversationId],
            });
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_USER_CONVERSATIONS],
            });
          }

          // Message updated (e.g., marked as read)
          if (events.includes(`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.messageCollectionId}.documents.*.update`)) {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_MESSAGES, conversationId],
            });
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [conversationId, queryClient]);
};

export const useRealtimeConversations = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to conversation updates
    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.conversationCollectionId}.documents`,
      (response) => {
        const { events, payload } = response;

        // Check if the conversation involves the current user
        if (payload.participants && payload.participants.includes(userId)) {
          // Conversation created or updated
          if (
            events.includes(`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.conversationCollectionId}.documents.*.create`) ||
            events.includes(`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.conversationCollectionId}.documents.*.update`)
          ) {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_USER_CONVERSATIONS, userId],
            });
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);
};