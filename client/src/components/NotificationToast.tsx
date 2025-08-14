import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, AlertCircle, XCircle, DollarSign } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

/**
 * Component that polls for new notifications and displays them as toast messages
 */
export function NotificationToast() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll for new notifications every 30 seconds
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Track shown notifications to avoid duplicates
  const shownNotifications = new Set();

  useEffect(() => {
    // Show toast for new unread notifications
    const newNotifications = notifications.filter(
      (notification) => 
        !notification.isRead && 
        !shownNotifications.has(notification.id) &&
        // Only show notifications from the last 5 minutes to avoid spam on first load
        new Date(notification.createdAt) > new Date(Date.now() - 5 * 60 * 1000)
    );

    newNotifications.forEach((notification) => {
      shownNotifications.add(notification.id);
      
      const getIcon = () => {
        switch (notification.type) {
          case 'booking_confirmation':
            return CheckCircle;
          case 'booking_reminder':
            return Bell;
          case 'booking_cancellation':
            return XCircle;
          case 'vendor_new_booking':
            return DollarSign;
          default:
            return AlertCircle;
        }
      };

      const getVariant = () => {
        switch (notification.type) {
          case 'booking_confirmation':
          case 'vendor_new_booking':
            return 'default' as const;
          case 'booking_reminder':
            return 'default' as const;
          case 'booking_cancellation':
            return 'destructive' as const;
          default:
            return 'default' as const;
        }
      };

      const Icon = getIcon();
      
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Icon size={16} />
            {notification.title}
          </div>
        ) as any,
        description: notification.message,
        variant: getVariant(),
        duration: notification.type === 'booking_reminder' ? 10000 : 5000,
      });
    });
  }, [notifications, toast]);

  return null; // This component doesn't render anything visible
}