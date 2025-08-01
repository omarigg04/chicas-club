export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
  groupId?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL;
  file: File[];
  location?: string;
  tags?: string;
  groupId?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

// ============================================================
// CHAT TYPES
// ============================================================

export type IConversation = {
  $id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSender?: string;
  type: 'direct' | 'group';
  $createdAt: string;
  $updatedAt: string;
};

export type IMessage = {
  $id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  readBy: string[];
  $createdAt: string;
  $updatedAt: string;
};

export type INewMessage = {
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
};

export type INewConversation = {
  participants: string[];
  type: 'direct' | 'group';
};

// ============================================================
// GROUP TYPES
// ============================================================

export type IGroup = {
  $id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  imageId?: string;
  adminId: string;
  isPrivate: boolean;
  memberCount: number;
  $createdAt: string;
  $updatedAt: string;
};

export type INewGroup = {
  name: string;
  description?: string;
  file?: File[];
  adminId: string;
  isPrivate?: boolean;
};

export type IUpdateGroup = {
  groupId: string;
  name: string;
  description?: string;
  imageId?: string;
  imageUrl?: string;
  file?: File[];
};

export type IGroupMember = {
  $id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  $createdAt: string;
};

export type INewGroupMember = {
  groupId: string;
  userId: string;
  role?: 'admin' | 'member';
};

export type IGroupRequest = {
  $id: string;
  groupId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  $createdAt: string;
  $updatedAt: string;
};

export type INewGroupRequest = {
  groupId: string;
  userId: string;
};
