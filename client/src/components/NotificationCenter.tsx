import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bell, X, Settings, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  id: string;
  userId: string;
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  bookingCancellations: boolean;
  vendorBookingAlerts: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification count
  const { data: countData } = useQuery({
    queryKey: ['/api/notifications/count'],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch notifications when panel is open
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  // Fetch notification preferences
  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
    enabled: showSettings,
  });

  // Mark notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('POST', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      toast({
        title: "All notifications marked as read",
        description: "Your notification center has been cleared",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      await apiRequest('PUT', '/api/notification-preferences', newPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved",
      });
    },
  });

  const unreadCount = countData?.count || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
        return '✅';
      case 'booking_reminder':
        return '⏰';
      case 'booking_cancellation':
        return '❌';
      case 'vendor_new_booking':
        return '💰';
      default:
        return '📢';
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      className={`p-4 border-b border-gray-100 dark:border-gray-800 transition-colors ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
      }`}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {notification.title}
            </h4>
            <div className="flex items-center gap-1 ml-2">
              {!notification.isRead && (
                <button
                  onClick={() => markReadMutation.mutate(notification.id)}
                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  title="Mark as read"
                  data-testid={`button-mark-read-${notification.id}`}
                >
                  <Check size={14} />
                </button>
              )}
              <button
                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title="Delete notification"
                data-testid={`button-delete-${notification.id}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notification Settings
        </h3>
        <button
          onClick={() => setShowSettings(false)}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-close-settings"
        >
          <X size={18} />
        </button>
      </div>

      {preferences && (
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Booking Confirmations
            </span>
            <input
              type="checkbox"
              checked={preferences.bookingConfirmations}
              onChange={(e) => updatePreferencesMutation.mutate({ bookingConfirmations: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
              data-testid="checkbox-booking-confirmations"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Booking Reminders
            </span>
            <input
              type="checkbox"
              checked={preferences.bookingReminders}
              onChange={(e) => updatePreferencesMutation.mutate({ bookingReminders: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
              data-testid="checkbox-booking-reminders"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Booking Cancellations
            </span>
            <input
              type="checkbox"
              checked={preferences.bookingCancellations}
              onChange={(e) => updatePreferencesMutation.mutate({ bookingCancellations: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
              data-testid="checkbox-booking-cancellations"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Vendor Booking Alerts
            </span>
            <input
              type="checkbox"
              checked={preferences.vendorBookingAlerts}
              onChange={(e) => updatePreferencesMutation.mutate({ vendorBookingAlerts: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
              data-testid="checkbox-vendor-booking-alerts"
            />
          </label>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettings(false);
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        data-testid="button-notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]"
            data-testid="notification-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50"
                  title="Mark all as read"
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck size={18} />
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Settings"
                data-testid="button-settings"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="button-close-panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && <NotificationSettings />}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center" data-testid="empty-notifications">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  You'll see booking confirmations and updates here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          data-testid="notification-overlay"
        />
      )}
    </div>
  );
}