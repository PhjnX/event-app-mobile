import React, { createContext, useContext, useRef, useCallback } from "react";
import { Animated } from "react-native";

interface TabBarContextValue {
  translateY: Animated.Value;
  onScroll: (event: any) => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const onScroll = useCallback(
    (event: any) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      if (diff > 8 && !isHidden.current) {
        // Scroll xuống → ẩn tab
        isHidden.current = true;
        Animated.spring(translateY, {
          toValue: 100,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      } else if (diff < -8 && isHidden.current) {
        // Scroll lên → hiện tab
        isHidden.current = false;
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      }

      lastScrollY.current = currentY;
    },
    [translateY]
  );

  return (
    <TabBarContext.Provider value={{ translateY, onScroll }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const ctx = useContext(TabBarContext);
  if (!ctx) throw new Error("useTabBar must be used within TabBarProvider");
  return ctx;
}
