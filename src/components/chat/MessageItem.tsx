import { IMessage } from "@/types";
import { multiFormatDateString } from "@/lib/utils";

type MessageItemProps = {
  message: IMessage;
  currentUserId: string;
  isOwn: boolean;
};

const MessageItem = ({ message, currentUserId, isOwn }: MessageItemProps) => {
  const isRead = message.readBy?.includes(currentUserId);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          isOwn
            ? "bg-primary-500 text-white"
            : "bg-dark-3 text-light-1"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        
        <div className={`flex items-center gap-2 mt-1 ${
          isOwn ? "justify-end" : "justify-start"
        }`}>
          <span className={`text-xs ${
            isOwn ? "text-primary-100" : "text-light-4"
          }`}>
            {multiFormatDateString(message.createdAt)}
          </span>
          
          {isOwn && (
            <div className="flex items-center">
              {isRead ? (
                <span className="text-xs text-primary-100">✓✓</span>
              ) : (
                <span className="text-xs text-primary-200">✓</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;