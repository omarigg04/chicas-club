import { ID, Query } from "appwrite";

import { appwriteConfig, account, databases, storage, avatars } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser, INewMessage, INewGroup, IUpdateGroup, INewGroupMember, INewGroupRequest } from "@/types";

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
        groupId: post.groupId || null,
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
    // Use getFileView for direct file access (works better with public images)
    const fileUrl = storage.getFileView(
      appwriteConfig.storageId,
      fileId
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
        groupId: post.groupId || null,
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

// ============================== SEARCH USERS
export async function searchUsers(searchTerm: string) {
  if (!searchTerm.trim()) return { documents: [] };
  
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(20)
      ]
    );

    if (!users) throw Error;

    // Filter users client-side by name or username
    const filteredUsers = {
      ...users,
      documents: users.documents.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    };

    return filteredUsers;
  } catch (error) {
    console.log(error);
    return { documents: [] };
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

// ============================== GET CONVERSATION BY ID
export async function getConversationById(conversationId: string) {
  try {
    const conversation = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      conversationId
    );
    return conversation;
  } catch (error) {
    console.log("getConversationById error:", error);
  }
}

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

// ============================================================
// FOLLOWS
// ============================================================

// ============================== FOLLOW USER
export async function followUser(followerId: string, followingId: string) {
  try {
    const newFollow = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      ID.unique(),
      {
        followerId,
        followingId,
        createdAt: new Date(),
      }
    );

    return newFollow;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UNFOLLOW USER
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const followRecord = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followerId", followerId),
        Query.equal("followingId", followingId),
      ]
    );

    if (followRecord.documents.length > 0) {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.followsCollectionId,
        followRecord.documents[0].$id
      );
    }

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== CHECK IF FOLLOWING
export async function isFollowing(followerId: string, followingId: string) {
  try {
    const followRecord = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followerId", followerId),
        Query.equal("followingId", followingId),
      ]
    );

    return followRecord.documents.length > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// ============================== GET USER FOLLOWING
export async function getUserFollowing(userId: string) {
  try {
    const following = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("followerId", userId)]
    );

    return following;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER FOLLOWERS
export async function getUserFollowers(userId: string) {
  try {
    const followers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("followingId", userId)]
    );

    return followers;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POSTS FROM FOLLOWED USERS AND GROUPS
export async function getPostsFromFollowedUsers(userId: string) {
  try {
    // Get the list of users that current user follows
    const following = await getUserFollowing(userId);
    
    // Extract the IDs of followed users
    const followedUserIds = following && following.documents.length > 0 
      ? following.documents.map(follow => follow.followingId)
      : [];
    
    // Always include current user's posts
    const allUserIds = [...followedUserIds, userId];
    
    // Get regular posts from followed users AND current user (not group posts)
    const regularPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.equal("creator", allUserIds),
        Query.isNull("groupId"),
        Query.orderDesc("$createdAt"),
        Query.limit(20)
      ]
    );

    // Get posts from user's groups
    const groupPosts = await getPostsFromUserGroups(userId);
    
    // Combine regular posts and group posts
    const allPosts = [
      ...regularPosts.documents,
      ...(groupPosts?.documents || [])
    ];

    // Sort by creation date (most recent first)
    allPosts.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

    // Take only the first 20 posts
    const limitedPosts = allPosts.slice(0, 20);

    return {
      documents: limitedPosts,
      total: limitedPosts.length
    };
  } catch (error) {
    console.log(error);
    return { documents: [], total: 0 };
  }
}

// ============================== GET USER FOLLOWERS COUNT
export async function getUserFollowersCount(userId: string) {
  try {
    const followers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("followingId", userId)]
    );

    return followers.total;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

// ============================== GET USER FOLLOWING COUNT
export async function getUserFollowingCount(userId: string) {
  try {
    const following = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("followerId", userId)]
    );

    return following.total;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

// ============================== CHECK IF USER IS FOLLOWING ANOTHER USER (Compatibility)
export async function isUserFollowing(followerId: string, followingId: string) {
  return isFollowing(followerId, followingId);
}

// ============================================================
// GROUPS
// ============================================================

// ============================== CREATE GROUP
export async function createGroup(group: INewGroup) {
  try {
    let image = {
      imageUrl: "",
      imageId: "",
    };

    if (group.file && group.file.length > 0) {
      const uploadedFile = await uploadFile(group.file[0]);
      if (!uploadedFile) throw Error;

      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    const newGroup = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      ID.unique(),
      {
        name: group.name,
        description: group.description || "",
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        adminId: group.adminId,
        isPrivate: group.isPrivate ?? true,
        memberCount: 1,
      }
    );

    if (!newGroup) {
      if (image.imageId) await deleteFile(image.imageId);
      throw Error;
    }

    // Add creator as admin member
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      ID.unique(),
      {
        groupId: newGroup.$id,
        userId: group.adminId,
        role: "admin",
        joinedAt: new Date().toISOString(),
      }
    );

    return newGroup;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET GROUPS
export async function getGroups(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const groups = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      queries
    );

    if (!groups) throw Error;

    return groups;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SEARCH GROUPS
export async function searchGroups(searchTerm: string) {
  if (!searchTerm.trim()) return { documents: [] };
  
  try {
    const groups = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(20)
      ]
    );

    if (!groups) throw Error;

    const filteredGroups = {
      ...groups,
      documents: groups.documents.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    };

    return filteredGroups;
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}

// ============================== GET GROUP BY ID
export async function getGroupById(groupId: string) {
  try {
    const group = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      groupId
    );

    if (!group) throw Error;

    return group;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE GROUP
export async function updateGroup(group: IUpdateGroup) {
  const hasFileToUpdate = group.file && group.file.length > 0;

  try {
    let image = {
      imageUrl: group.imageUrl || "",
      imageId: group.imageId || "",
    };

    if (hasFileToUpdate) {
      const uploadedFile = await uploadFile(group.file![0]);
      if (!uploadedFile) throw Error;

      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    const updatedGroup = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      group.groupId,
      {
        name: group.name,
        description: group.description || "",
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      }
    );

    if (!updatedGroup) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw Error;
    }

    if (hasFileToUpdate && group.imageId) {
      await deleteFile(group.imageId);
    }

    return updatedGroup;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE GROUP
export async function deleteGroup(groupId: string, imageId?: string) {
  try {
    // Delete all group members
    const members = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      [Query.equal("groupId", groupId)]
    );

    const memberDeletions = members.documents.map(member =>
      databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.groupMemberCollectionId,
        member.$id
      )
    );

    await Promise.all(memberDeletions);

    // Delete all group requests
    const requests = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      [Query.equal("groupId", groupId)]
    );

    const requestDeletions = requests.documents.map(request =>
      databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.groupRequestCollectionId,
        request.$id
      )
    );

    await Promise.all(requestDeletions);

    // Delete the group
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      groupId
    );

    if (!statusCode) throw Error;

    // Delete group image if exists
    if (imageId) {
      await deleteFile(imageId);
    }

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// GROUP MEMBERS
// ============================================================

// ============================== GET GROUP MEMBERS
export async function getGroupMembers(groupId: string) {
  try {
    const members = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.orderDesc("$createdAt")
      ]
    );

    if (!members) throw Error;

    return members;
  } catch (error) {
    console.log(error);
  }
}

// ============================== ADD GROUP MEMBER
export async function addGroupMember(member: INewGroupMember) {
  try {
    const newMember = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      ID.unique(),
      {
        groupId: member.groupId,
        userId: member.userId,
        role: member.role || "member",
        joinedAt: new Date().toISOString(),
      }
    );

    if (!newMember) throw Error;

    // Update group member count
    const group = await getGroupById(member.groupId);
    if (group) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.groupCollectionId,
        member.groupId,
        {
          memberCount: group.memberCount + 1
        }
      );
    }

    return newMember;
  } catch (error) {
    console.log(error);
  }
}

// ============================== REMOVE GROUP MEMBER
export async function removeGroupMember(groupId: string, userId: string) {
  try {
    const memberRecord = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("userId", userId),
      ]
    );

    if (memberRecord.documents.length > 0) {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.groupMemberCollectionId,
        memberRecord.documents[0].$id
      );

      // Update group member count
      const group = await getGroupById(groupId);
      if (group && group.memberCount > 0) {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.groupCollectionId,
          groupId,
          {
            memberCount: group.memberCount - 1
          }
        );
      }
    }

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== CHECK IF USER IS GROUP MEMBER
export async function isGroupMember(groupId: string, userId: string) {
  try {
    const memberRecord = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("userId", userId),
      ]
    );

    return memberRecord.documents.length > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// ============================== CHECK IF USER IS GROUP ADMIN
export async function isGroupAdmin(groupId: string, userId: string) {
  try {
    const group = await getGroupById(groupId);
    return group?.adminId === userId;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// ============================== GET USER GROUPS
export async function getUserGroups(userId: string) {
  try {
    const memberships = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupMemberCollectionId,
      [Query.equal("userId", userId)]
    );

    if (!memberships || memberships.documents.length === 0) {
      return { documents: [] };
    }

    const groupIds = memberships.documents.map(membership => membership.groupId);
    
    const groups = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      [
        Query.equal("$id", groupIds),
        Query.orderDesc("$createdAt")
      ]
    );

    return groups;
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}

// ============================================================
// GROUP REQUESTS
// ============================================================

// ============================== REQUEST TO JOIN GROUP
export async function requestToJoinGroup(request: INewGroupRequest) {
  try {
    // Check if request already exists
    const existingRequest = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      [
        Query.equal("groupId", request.groupId),
        Query.equal("userId", request.userId),
        Query.equal("status", "pending")
      ]
    );

    if (existingRequest.documents.length > 0) {
      throw new Error("Ya tienes una solicitud pendiente para este grupo");
    }

    // Check if user is already a member
    const isMember = await isGroupMember(request.groupId, request.userId);
    if (isMember) {
      throw new Error("Ya eres miembro de este grupo");
    }

    const newRequest = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      ID.unique(),
      {
        groupId: request.groupId,
        userId: request.userId,
        status: "pending",
        requestedAt: new Date().toISOString(),
      }
    );

    return newRequest;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== APPROVE GROUP REQUEST
export async function approveGroupRequest(requestId: string, currentUserId: string) {
  try {
    const request = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      requestId
    );

    if (!request) throw new Error("Solicitud no encontrada");

    // Verify current user is admin
    const isAdmin = await isGroupAdmin(request.groupId, currentUserId);
    if (!isAdmin) {
      throw new Error("Solo el admin del grupo puede aprobar solicitudes");
    }

    if (request.status !== "pending") {
      throw new Error("Esta solicitud ya fue procesada");
    }

    // Update request status
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      requestId,
      {
        status: "accepted"
      }
    );

    // Add user as group member
    await addGroupMember({
      groupId: request.groupId,
      userId: request.userId,
      role: "member"
    });

    return { status: "approved" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== REJECT GROUP REQUEST
export async function rejectGroupRequest(requestId: string, currentUserId: string) {
  try {
    const request = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      requestId
    );

    if (!request) throw new Error("Solicitud no encontrada");

    // Verify current user is admin
    const isAdmin = await isGroupAdmin(request.groupId, currentUserId);
    if (!isAdmin) {
      throw new Error("Solo el admin del grupo puede rechazar solicitudes");
    }

    if (request.status !== "pending") {
      throw new Error("Esta solicitud ya fue procesada");
    }

    // Update request status
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      requestId,
      {
        status: "rejected"
      }
    );

    return { status: "rejected" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET GROUP REQUESTS FOR ADMIN
export async function getGroupRequestsForAdmin(adminUserId: string) {
  try {
    const adminGroups = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupCollectionId,
      [Query.equal("adminId", adminUserId)]
    );

    if (!adminGroups || adminGroups.documents.length === 0) {
      return { documents: [] };
    }

    const groupIds = adminGroups.documents.map(group => group.$id);
    
    const requests = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      [
        Query.equal("groupId", groupIds),
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt")
      ]
    );

    return requests;
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}

// ============================== GET USER'S GROUP REQUESTS
export async function getUserGroupRequests(userId: string) {
  try {
    const requests = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt")
      ]
    );

    return requests;
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}

// ============================== GET REQUEST STATUS FOR GROUP
export async function getRequestStatusForGroup(groupId: string, userId: string) {
  try {
    const request = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.groupRequestCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(1)
      ]
    );

    if (request.documents.length === 0) {
      return null;
    }

    return request.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================================================
// GROUP POSTS
// ============================================================

// ============================== GET GROUP POSTS
export async function getGroupPosts(groupId: string, userId: string) {
  try {
    // Verify user is member of the group
    const isMember = await isGroupMember(groupId, userId);
    if (!isMember) {
      throw new Error("No tienes acceso a los posts de este grupo");
    }

    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.orderDesc("$createdAt"),
        Query.limit(20)
      ]
    );

    return posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET POSTS FROM USER'S GROUPS
export async function getPostsFromUserGroups(userId: string) {
  try {
    const userGroups = await getUserGroups(userId);
    
    if (!userGroups || userGroups.documents.length === 0) {
      return { documents: [] };
    }

    const groupIds = userGroups.documents.map(group => group.$id);
    
    const groupPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.equal("groupId", groupIds),
        Query.orderDesc("$createdAt"),
        Query.limit(20)
      ]
    );

    return groupPosts;
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}
