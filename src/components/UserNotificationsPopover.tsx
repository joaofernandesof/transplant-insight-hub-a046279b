import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, Image, Video, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  notification_id: string;
  is_read: boolean;
  created_at: string;
  notification: {
    id: string;
    title: string;
    content: string;
    content_html: string | null;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
  };
}

const UserNotificationsPopover: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_recipients')
        .select(`
          id,
          notification_id,
          is_read,
          created_at,
          notification:notifications (
            id,
            title,
            content,
            content_html,
            image_url,
            video_url,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []) as unknown as Notification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        {selectedNotification ? (
          // Detail view
          <div className="flex flex-col max-h-[500px]">
            <div className="p-3 border-b flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                ← Voltar
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <h3 className="font-semibold text-lg mb-2">
                {selectedNotification.notification.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {formatDistanceToNow(new Date(selectedNotification.notification.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
              
              {selectedNotification.notification.content_html ? (
                <div 
                  className="prose prose-sm max-w-none mb-4"
                  dangerouslySetInnerHTML={{ __html: selectedNotification.notification.content_html }}
                />
              ) : (
                <p className="text-sm mb-4 whitespace-pre-wrap">
                  {selectedNotification.notification.content}
                </p>
              )}

              {selectedNotification.notification.image_url && (
                <img 
                  src={selectedNotification.notification.image_url} 
                  alt="Imagem da notificação"
                  className="w-full rounded-lg mb-4"
                />
              )}

              {selectedNotification.notification.video_url && (
                <video 
                  src={selectedNotification.notification.video_url}
                  controls
                  className="w-full rounded-lg"
                />
              )}
            </ScrollArea>
          </div>
        ) : (
          // List view
          <div className="flex flex-col max-h-[500px]">
            <div className="p-3 border-b flex items-center justify-between">
              <h4 className="font-semibold">Notificações</h4>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          notification.is_read ? 'bg-transparent' : 'bg-primary'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {notification.notification.title}
                            </p>
                            <div className="flex gap-1 flex-shrink-0">
                              {notification.notification.image_url && (
                                <Image className="h-3 w-3 text-muted-foreground" />
                              )}
                              {notification.notification.video_url && (
                                <Video className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.notification.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default UserNotificationsPopover;
