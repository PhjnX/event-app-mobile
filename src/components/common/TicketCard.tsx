import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants/theme";
import type { Registration } from "../../models/event";

interface TicketCardProps {
  ticket: Registration;
  onPress: () => void;
  onShowQR?: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("vi-VN", { month: "short" }).toUpperCase(),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    full: date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return COLORS.success;
    case "PENDING":
      return COLORS.warning;
    case "REJECTED":
      return COLORS.error;
    default:
      return COLORS.textMuted;
  }
};

const getStatusLabel = (status: string) => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
      return "Đang chờ";
    case "REJECTED":
      return "Từ chối";
    default:
      return status;
  }
};

export default function TicketCard({
  ticket,
  onPress,
  onShowQR,
}: TicketCardProps) {
  const dateInfo = formatDate(ticket.eventStartDate);
  const statusColor = getStatusColor(ticket.status);
  const isApproved = ticket.status.toUpperCase() === "APPROVED";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Background Image */}
      <Image
        source={{
          uri:
            ticket.eventBanner ||
            "https://placehold.co/400x200/1a1a1a/666666?text=Event",
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(ticket.status)}
            </Text>
          </View>
          <Text style={styles.ticketId}>ID: {ticket.registrationId}</Text>
        </View>

        {/* Event Name */}
        <Text style={styles.eventName} numberOfLines={2}>
          {ticket.eventName}
        </Text>

        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText}>{dateInfo.time}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {ticket.location || "Chưa cập nhật"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerCircleLeft} />
          <View style={styles.dividerLine} />
          <View style={styles.dividerCircleRight} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Date */}
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{dateInfo.day}</Text>
            <Text style={styles.dateMonth}>{dateInfo.month}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.viewButton} onPress={onPress}>
              <Text style={styles.viewButtonText}>Xem sự kiện</Text>
            </TouchableOpacity>

            {isApproved && ticket.ticketCode && onShowQR && (
              <TouchableOpacity style={styles.qrButton} onPress={onShowQR}>
                <Ionicons
                  name="qr-code-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Gold Corner Decorations */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    position: "relative",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketId: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONTS.medium,
  },
  eventName: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bold,
    lineHeight: 24,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginLeft: 6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerCircleLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginLeft: -24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
  },
  dividerCircleRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: -24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateBox: {
    backgroundColor: "rgba(216,201,123,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
  },
  dateDay: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  dateMonth: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.semiBold,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  viewButtonText: {
    color: COLORS.background,
    fontSize: 11,
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.3)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(216,201,123,0.1)",
  },
  // Corner decorations
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
