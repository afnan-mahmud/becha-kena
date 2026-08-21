import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ChatRoomsList } from '../../components/chat/ChatRoomsList';
import { ChatConversation } from '../../components/chat/ChatConversation';
import { useSocket } from '../../hooks/useSocket';
import './ChatPage.css';

export const ChatPage = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const { socket, isConnected } = useSocket();

  return (
    <div className="chat-page-container">
      {/* Left Panel: Rooms List */}
      <div className={`chat-rooms-panel ${roomId ? 'hide-on-mobile' : ''}`}>
        <ChatRoomsList activeRoomId={roomId} socket={socket} />
      </div>

      {/* Right Panel: Conversation */}
      <div className={`chat-conv-panel ${!roomId ? 'hide-on-mobile' : ''}`}>
        {roomId ? (
          <ChatConversation roomId={roomId} socket={socket} />
        ) : (
          <div className="chat-placeholder hide-on-mobile">
            <MessageSquare size={64} color="var(--border-color)" />
            <p>একটি চ্যাট নির্বাচন করুন অথবা নতুন চ্যাট শুরু করুন</p>
            {isConnected ? (
              <span className="text-xs text-green-500 mt-2">● অনলাইনে যুক্ত</span>
            ) : (
              <span className="text-xs text-red-500 mt-2">● সংযোগ বিচ্ছিন্ন</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
