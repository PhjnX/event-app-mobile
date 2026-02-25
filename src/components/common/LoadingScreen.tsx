import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
};

export default function LoadingScreen({
  message = "Loading",
}: {
  message?: string;
}) {
  const rotation1 = useRef(new Animated.Value(0)).current;
  const rotation2 = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Outer ring rotation
    Animated.loop(
      Animated.timing(rotation1, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Inner ring rotation (reverse)
    Animated.loop(
      Animated.timing(rotation2, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Center dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Text opacity pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const spin1 = rotation1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spin2 = rotation2.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        {/* Outer Ring */}
        <Animated.View
          style={[
            styles.ring,
            styles.outerRing,
            { transform: [{ rotate: spin1 }] },
          ]}
        />

        {/* Inner Ring */}
        <Animated.View
          style={[
            styles.ring,
            styles.innerRing,
            { transform: [{ rotate: spin2 }] },
          ]}
        />

        {/* Center Dot */}
        <Animated.View style={[styles.centerDot, { transform: [{ scale }] }]} />
      </View>

      {/* Loading Text */}
      <Animated.Text style={[styles.loadingText, { opacity }]}>
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
  },
  outerRing: {
    width: 80,
    height: 80,
    borderColor: "rgba(216,201,123,0.3)",
    borderTopColor: COLORS.primary,
  },
  innerRing: {
    width: 48,
    height: 48,
    borderColor: "rgba(216,201,123,0.3)",
    borderBottomColor: COLORS.primary,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 32,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
});
