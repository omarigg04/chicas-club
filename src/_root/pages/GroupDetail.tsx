import { useParams, Link } from "react-router-dom";
import { Models } from "appwrite";

import { useUserContext } from "@/context/AuthContext";
import { useGetGroupById, useGetGroupPosts, useIsGroupMember, useIsGroupAdmin, useGetGroupMembers } from "@/lib/react-query/queries";
import { Loader, PostCard } from "@/components/shared";
import { Button } from "@/components/ui/button";

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useUserContext();

  const { data: group, isLoading: isGroupLoading } = useGetGroupById(id || "");
  const { data: groupPosts, isLoading: isPostsLoading } = useGetGroupPosts(id || "", user.id);
  const { data: isMember } = useIsGroupMember(id || "", user.id);
  const { data: isAdmin } = useIsGroupAdmin(id || "", user.id);
  const { data: members } = useGetGroupMembers(id || "");

  if (isGroupLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-center w-full h-full">
        <p className="body-medium text-light-1">Group not found</p>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex flex-1">
        <div className="common-container">
          <div className="flex flex-col items-center justify-center gap-6 mt-10">
            <div className="flex flex-col items-center gap-4">
              <img
                src={group.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt={group.name}
                className="w-24 h-24 rounded-full"
              />
              <div className="text-center">
                <h2 className="h2-bold text-light-1 mb-2">{group.name}</h2>
                {group.description && (
                  <p className="body-medium text-light-3 mb-4 max-w-md">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-4 justify-center text-light-3 small-medium mb-6">
                  <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                  <span>•</span>
                  <span>Private Group</span>
                </div>
                <div className="bg-dark-3 p-6 rounded-lg max-w-md">
                  <h3 className="base-semibold text-light-1 mb-2">This is a private group</h3>
                  <p className="small-regular text-light-3 mb-4">
                    You need to be a member to see the group's posts and content.
                  </p>
                  <Link to="/groups">
                    <Button className="shad-button_primary">
                      Back to Groups
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="common-container">
        {/* Group Header */}
        <div className="flex flex-col gap-4 w-full max-w-5xl">
          <div className="flex items-start gap-4">
            <img
              src={group.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt={group.name}
              className="w-20 h-20 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="h2-bold text-light-1">{group.name}</h1>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Link to={`/groups/${id}/requests`}>
                      <Button className="shad-button_ghost text-sm">
                        <img
                          src="/assets/icons/people.svg"
                          width={16}
                          height={16}
                          alt="requests"
                          className="mr-2"
                        />
                        Requests
                      </Button>
                    </Link>
                    <Link to={`/groups/${id}/members`}>
                      <Button className="shad-button_ghost text-sm">
                        <img
                          src="/assets/icons/people.svg"
                          width={16}
                          height={16}
                          alt="members"
                          className="mr-2"
                        />
                        Members ({group.memberCount})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              {group.description && (
                <p className="body-medium text-light-2 mb-3">{group.description}</p>
              )}
              <div className="flex items-center gap-4 text-light-3 small-medium">
                <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                <span>•</span>
                <span>Private Group</span>
                {isAdmin && (
                  <>
                    <span>•</span>
                    <span className="text-primary-500">You're Admin</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Create Post for Group */}
          <div className="flex justify-between items-center">
            <h2 className="h3-bold text-light-1">Group Posts</h2>
            <Link to="/create-post" state={{ selectedGroupId: group.$id }}>
              <Button className="shad-button_primary">
                <img
                  src="/assets/icons/gallery-add.svg"
                  width={20}
                  height={20}
                  alt="create"
                  className="invert-white mr-2"
                />
                Create Post
              </Button>
            </Link>
          </div>

          {/* Group Posts */}
          {isPostsLoading ? (
            <div className="flex-center w-full h-full">
              <Loader />
            </div>
          ) : groupPosts && groupPosts.documents.length > 0 ? (
            <ul className="flex flex-col flex-1 gap-9 w-full">
              {groupPosts.documents.map((post: Models.Document) => (
                <li key={post.$id} className="flex justify-center w-full">
                  <PostCard post={post} showGroupBadge={false} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 mt-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-dark-4 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-light-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="h3-bold text-light-1 mb-2">No posts yet</h3>
                  <p className="body-medium text-light-3 mb-4">
                    Be the first to share something with this group!
                  </p>
                  <Link to="/create-post" state={{ selectedGroupId: group.$id }}>
                    <Button className="shad-button_primary">
                      Create First Post
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;