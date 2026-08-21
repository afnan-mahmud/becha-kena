import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import type { IMessage } from '../../types';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const timeString = message.createdAt 
    ? format(new Date(message.createdAt), 'hh:mm a') 
    : '';

  return (
    <div className={`message-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        {message.messageText}
      </div>
      <div className="message-meta">
        <span>{timeString}</span>
        {isOwn && (
          <span className="message-status">
            {message.readStatus ? (
              <CheckCheck size={14} color="var(--primary-color)" />
            ) : (
              <Check size={14} />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
