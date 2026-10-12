import { useParams } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { ChatRoomsList } from '../../components/chat/ChatRoomsList';
import { ChatConversation } from '../../components/chat/ChatConversation';
import { SEOHead } from '../../components/common/SEOHead';
import { useSocket } from '../../hooks/useSocket';
import './ChatPage.css';

export const ChatPage = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const { socket, isConnected } = useSocket();

  return (
    <div className="chat-shell container">
      <SEOHead title="মেসেজ — বেচা-কেনা" />
      <div className="chat-page">
        <div className={`chat-page__rooms ${roomId ? 'hide-on-mobile' : ''}`}>
          <ChatRoomsList activeRoomId={roomId} socket={socket} isConnected={isConnected} />
        </div>

        <div className={`chat-page__conv ${!roomId ? 'hide-on-mobile' : ''}`}>
          {roomId ? (
            <ChatConversation key={roomId} roomId={roomId} socket={socket} />
          ) : (
            <div className="chat-placeholder">
              <span className="chat-placeholder__icon"><MessagesSquare size={40} /></span>
              <h2>আপনার মেসেজ</h2>
              <p>বাম পাশ থেকে একটি কথোপকথন বেছে নিন, অথবা কোনো বিজ্ঞাপনে গিয়ে বিক্রেতার সাথে চ্যাট শুরু করুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
