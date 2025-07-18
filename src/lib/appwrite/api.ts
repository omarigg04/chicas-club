import { ID, Query } from "appwrite";

import { appwriteConfig, account, databases, storage, avatars } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser, INewMessage } from "@/types";

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl,
    });

    return newUser;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// ============================== SAVE USER TO DB
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );

    return newUser;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailSession(user.email, user.password);

    return session;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET ACCOUNT
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================== SIGN OUT
export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// POSTS
// ============================================================

// ============================== CREATE POST
export async function createPost(post: INewPost) {
  try {
    // Upload file to appwrite storage
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw Error;

    // Get file url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Create post
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    return newPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPLOAD FILE
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET FILE URL
export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100
    );

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE FILE
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POSTS
export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) throw Error;

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE POST
export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE POST
export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== LIKE / UNLIKE POST
export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SAVE POST
export async function savePost(userId: string, postId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}
// ============================== DELETE SAVED POST
export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    );

    if (!statusCode) throw Error;

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER'S POST
export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
    const post = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POPULAR POSTS (BY HIGHEST LIKE COUNT)
export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// USER
// ============================================================

// ============================== GET USERS
export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER BY ID
export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    if (!user) throw Error;

    return user;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE USER
export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    //  Update user
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      }
    );

    // Failed to update
    if (!updatedUser) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId);
    }

    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// CHAT
// ============================================================

// ============================== CREATE OR GET CONVERSATION
export async function createOrGetConversation(participants: string[]) {
  try {
    // Sort participants to ensure consistent conversation lookup
    const sortedParticipants = [...participants].sort();
    
    // Get all conversations and filter client-side
    const allConversations = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      [
        Query.equal("type", "direct"),
        Query.limit(100)
      ]
    );

    // Find existing conversation with same participants
    const existingConversation = allConversations.documents.find(conv => {
      const convParticipants = [...conv.participants].sort();
      return convParticipants.length === sortedParticipants.length &&
             convParticipants.every((participant, index) => participant === sortedParticipants[index]);
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const newConversation = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      ID.unique(),
      {
        participants: sortedParticipants,
        type: "direct",
      }
    );

    return newConversation;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER CONVERSATIONS
export async function getUserConversations(userId: string) {
  try {
    const conversations = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      [
        Query.orderDesc("$updatedAt"),
        Query.limit(50)
      ]
    );

    // Filter conversations client-side to include only those where user is participant
    const filteredConversations = {
      ...conversations,
      documents: conversations.documents.filter(conv => 
        conv.participants && conv.participants.includes(userId)
      )
    };

    return filteredConversations;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SEND MESSAGE
export async function sendMessage(message: INewMessage) {
  try {
    console.log("sendMessage called with:", message);
    
    const newMessage = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      ID.unique(),
      {
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        readBy: [message.senderId] // Sender has read the message
      }
    );

    console.log("Message created:", newMessage);

    // Update conversation with last message info
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      message.conversationId,
      {
        lastMessage: message.content,
        lastMessageTime: new Date().toISOString(),
        lastMessageSender: message.senderId
      }
    );

    return newMessage;
  } catch (error) {
    console.log("sendMessage error:", error);
  }
}

// ============================== GET MESSAGES
export async function getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
  try {
    console.log("getMessages called for conversationId:", conversationId);
    
    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      [
        Query.equal("conversationId", conversationId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    console.log("Messages retrieved:", messages);
    return messages;
  } catch (error) {
    console.log("getMessages error:", error);
  }
}

// ============================== MARK MESSAGE AS READ
export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    // Get current message
    const message = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      messageId
    );

    if (!message) throw Error;

    // Add user to readBy array if not already there
    const readBy = message.readBy || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    const updatedMessage = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      messageId,
      {
        readBy: readBy
      }
    );

    return updatedMessage;
  } catch (error) {
    console.log(error);
  }
}

// ============================== MARK CONVERSATION AS READ
export async function markConversationAsRead(conversationId: string, userId: string) {
  try {
    // Get all unread messages in the conversation
    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      [
        Query.equal("conversationId", conversationId),
        Query.notEqual("senderId", userId) // Don't mark own messages as read
      ]
    );

    // Mark each message as read
    const promises = messages.documents.map(message => {
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        return databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.messageCollectionId,
          message.$id,
          { readBy: readBy }
        );
      }
      return null;
    });

    await Promise.all(promises.filter(promise => promise !== null));
    
    return { status: "success" };
  } catch (error) {
    console.log(error);
  }
}
