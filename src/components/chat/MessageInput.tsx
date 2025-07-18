import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendMessage } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

type MessageInputProps = {
  conversationId: string;
};

const MessageInput = ({ conversationId }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useUserContext();
  const { toast } = useToast();
  const { mutateAsync: sendMessage } = useSendMessage();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user) return;
    
    setIsLoading(true);
    
    try {
      await sendMessage({
        conversationId,
        senderId: user.id,
        content: message.trim(),
        type: "text"
      });
      
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="flex gap-2 p-4 border-t border-dark-4">
      <Input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button 
        type="submit" 
        disabled={!message.trim() || isLoading}
        className="px-6"
      >
        {isLoading ? "..." : "Send"}
      </Button>
    </form>
  );
};

export default MessageInput;