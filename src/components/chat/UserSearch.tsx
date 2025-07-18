import { useState, useEffect } from "react";
import { useUserContext } from "@/context/AuthContext";
import { searchUsers, createOrGetConversation } from "@/lib/appwrite/api";
import { useNavigate } from "react-router-dom";
import { Models } from "appwrite";

interface User extends Models.Document {
  name: string;
  username: string;
  imageUrl: string;
}

interface UserSearchProps {
  onUserSelect?: () => void;
}

const UserSearch = ({ onUserSelect }: UserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        try {
          const results = await searchUsers(searchTerm);
          // Filter out current user
          const filteredResults = results.documents.filter(
            (u: Models.Document) => u.$id !== user.id
          ) as User[];
          setSearchResults(filteredResults);
          setShowResults(true);
        } catch (error) {
          console.error("Error searching users:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, user.id]);

  const handleUserClick = async (selectedUser: User) => {
    try {
      const conversation = await createOrGetConversation([user.id, selectedUser.$id]);
      if (conversation) {
        navigate(`/chat?conversation=${conversation.$id}`);
        setSearchTerm("");
        setShowResults(false);
        onUserSelect?.();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-light-1 placeholder-light-3 focus:border-primary-500 focus:outline-none"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-dark-2 border border-dark-4 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {searchResults.map((searchUser) => (
            <div
              key={searchUser.$id}
              onClick={() => handleUserClick(searchUser)}
              className="flex items-center gap-3 p-3 hover:bg-dark-3 cursor-pointer transition-colors"
            >
              <img
                src={searchUser.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt={searchUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-light-1 font-medium">{searchUser.name}</p>
                <p className="text-light-3 text-sm">@{searchUser.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchTerm && searchResults.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-dark-2 border border-dark-4 rounded-lg p-4 text-center text-light-3">
          No se encontraron usuarios
        </div>
      )}
    </div>
  );
};

export default UserSearch;