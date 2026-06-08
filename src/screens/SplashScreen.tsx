import React, { useEffect, useRef } from "react";
import { View, Image, Animated, StyleSheet, Easing } from "react-native";

const logo = require("../../assets/Logo_EMS.webp");

interface Props {
  onFinish: () => void;
}

function WaveDot({ delay, size = 8 }: { delay: number; size?: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const wave = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -14,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600),
      ]),
    );
    wave.start();
    return () => wave.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#D8C97B",
        transform: [{ translateY }, { scale }],
        opacity,
        marginHorizontal: 5,
      }}
    />
  );
}

export default function SplashArtScreen({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagY = useRef(new Animated.Value(10)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(ring2Rotate, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.06,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(300),

      Animated.parallel([
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(tagY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(200),

      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      Animated.delay(3000),

      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  const spin1 = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spin2 = ring2Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <View style={styles.logoWrapper}>
        <Animated.View
          style={[
            styles.ring,
            styles.ringOuter,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }, { rotate: spin1 }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.ring,
            styles.ringInner,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }, { rotate: spin2 }],
            },
          ]}
        />

        <Animated.View style={[styles.glow, { opacity: ringOpacity }]} />

        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: Animated.multiply(logoScale, pulseScale) }],
          }}
        >
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>

      <Animated.View style={[styles.dotsWrapper, { opacity: dotsOpacity }]}>
        <WaveDot delay={0} size={7} />
        <WaveDot delay={120} size={8} />
        <WaveDot delay={240} size={9} />
        <WaveDot delay={360} size={8} />
        <WaveDot delay={480} size={7} />
      </Animated.View>
    </Animated.View>
  );
}

const RING_OUTER = 180;
const RING_INNER = 150;
const LOGO_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: RING_OUTER,
    height: RING_OUTER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ringOuter: {
    width: RING_OUTER,
    height: RING_OUTER,
    borderColor: "rgba(216,201,123,0.4)",
    borderStyle: "dashed",
  },
  ringInner: {
    width: RING_INNER,
    height: RING_INNER,
    borderColor: "rgba(216,201,123,0.2)",
    borderStyle: "dotted",
  },
  glow: {
    position: "absolute",
    width: LOGO_SIZE + 30,
    height: LOGO_SIZE + 30,
    borderRadius: 999,
    backgroundColor: "rgba(216,201,123,0.05)",
    shadowColor: "#D8C97B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tagline: {
    color: "#D8C97B",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 28,
  },
  dotsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 30,
  },
});
