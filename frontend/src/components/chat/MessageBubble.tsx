import { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import type { IMessage } from '../../types';
import './MessageBubble.css';

export const MessageBubble = memo(({ message, isOwn }: { message: IMessage; isOwn: boolean }) => (
  <div className={`bubble-row ${isOwn ? 'is-own' : ''}`}>
    <div className="bubble">
      <p>{message.messageText}</p>
      <span className="bubble__meta">
        {format(new Date(message.createdAt), 'h:mm a')}
        {isOwn && (message.readStatus ? <CheckCheck size={14} className="bubble__read" /> : <Check size={14} />)}
      </span>
    </div>
  </div>
));

MessageBubble.displayName = 'MessageBubble';
