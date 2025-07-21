"use client";
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

const MessageNotification = () => {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/message/unread?userId=${user.id}`);
        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };

    fetchUnreadCount();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (unreadCount === 0) return null;

  return (
    <div className="badge badge-error badge-sm absolute -top-1 -right-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default MessageNotification; 