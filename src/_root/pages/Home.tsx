import { Models } from "appwrite";

// import { useToast } from "@/components/ui/use-toast";
import { Loader, PostCard, UserCard } from "@/components/shared";
import { useGetUsers, useGetPostsFromFollowedUsers } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const Home = () => {
  // const { toast } = useToast();
  const { user: currentUser, isLoading: isAuthLoading } = useUserContext();

  const {
    data: followedPosts,
    isLoading: isFollowedPostsLoading,
    isError: isErrorFollowedPosts,
  } = useGetPostsFromFollowedUsers(currentUser?.id || "");
  
  // Always use followed posts (includes user's own posts)
  const posts = followedPosts;
  const isPostLoading = isFollowedPostsLoading;
  const isErrorPosts = isErrorFollowedPosts;
  const {
    data: creators,
    isLoading: isUserLoading,
    isError: isErrorCreators,
  } = useGetUsers(10);

  // Show loading while authentication is being checked
  if (isAuthLoading) {
    return (
      <div className="flex flex-1">
        <div className="flex-center w-full h-full">
          <Loader />
        </div>
      </div>
    );
  }

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
        <div className="home-creators">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">
            Following
          </h2>
          {isPostLoading && !posts ? (
            <Loader />
          ) : posts && posts.documents.length > 0 ? (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {posts.documents.map((post: Models.Document) => (
                <li key={post.$id} className="flex justify-center w-full">
                  <PostCard post={post} />
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
                  <h3 className="h3-bold text-light-1 mb-2">No posts available</h3>
                  <p className="body-medium text-light-3 mb-4">
                    Follow other users or create your first post to see content here.
                  </p>
                  <a href="/explore" className="small-medium text-primary-500 hover:text-primary-600">
                    Explore users to follow →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="home-creators">
        <h3 className="h3-bold text-light-1">People</h3>
        {isUserLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {creators?.documents
              .filter((creator) => creator.$id !== currentUser?.id)
              .map((creator) => (
                <li key={creator?.$id}>
                  <UserCard user={creator} />
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
