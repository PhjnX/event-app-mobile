import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { getUnreadCount } from "../services/notificationservice";

interface NotificationContextValue {
  unreadCount: number;
  // Gọi hàm này sau khi addNotification() để badge cập nhật ngay
  refreshBadge: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshBadge: async () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const appState = useRef(AppState.currentState);

  const refreshBadge = useCallback(async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  // Load khi mount
  useEffect(() => {
    refreshBadge();
  }, []);

  // Cập nhật khi app từ background về foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        refreshBadge();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [refreshBadge]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshBadge }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
