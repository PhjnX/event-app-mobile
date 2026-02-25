import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants/theme";
import type { Event } from "../../models/event";

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("vi-VN", { month: "short" }).toUpperCase(),
    full: date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  };
};

export default function EventCard({ event, onPress }: EventCardProps) {
  const dateInfo = formatDate(event.startDate);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Banner Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              event.bannerImageUrl ||
              "https://placehold.co/400x200/1a1a1a/666666?text=Event",
          }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient Overlay */}
        <View style={styles.imageOverlay} />

        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {event.location || "Chưa cập nhật"}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {event.eventName}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.organizerRow}>
            <Ionicons
              name="business-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.organizerText} numberOfLines={1}>
              {event.organizerName || "EMS"}
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={14} color={COLORS.text} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  imageContainer: {
    height: 140,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dateDay: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  dateMonth: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    marginTop: 2,
  },
  content: {
    padding: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginLeft: 4,
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: FONTS.bold,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  organizerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
