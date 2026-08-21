import './UserAvatar.css';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
}

export const UserAvatar = ({ name, size = 'md', src }: UserAvatarProps) => {
  // Generate a consistent color based on the name
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      // Make it slightly darker/more readable by capping at CC (204)
      const safeValue = Math.min(value, 204);
      color += ('00' + safeValue.toString(16)).substr(-2);
    }
    return color;
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const bgColor = name ? stringToColor(name) : '#999';

  return (
    <div 
      className={`user-avatar user-avatar-${size}`} 
      style={{ backgroundColor: src ? 'transparent' : bgColor }}
    >
      {src ? (
        <img src={src} alt={name || 'User'} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};
