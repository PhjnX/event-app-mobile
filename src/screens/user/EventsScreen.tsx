import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchPublicEvents } from "../../store/slices/eventSlice";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  inputBg: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.05)",
};

const formatDate = (dateString: string) => {
  if (!dateString) return { day: "--", month: "---", full: "" };
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("vi-VN", { month: "short" }).toUpperCase(),
    full: date.toLocaleDateString("vi-VN"),
  };
};

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const eventsState = useAppSelector((state) => state.events);
  const events = eventsState?.events || [];
  const isLoading = eventsState?.isLoading || false;

  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPublicEvents());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPublicEvents());
    setRefreshing(false);
  }, []);

  // Filter events
  const filteredEvents = events.filter((event: any) =>
    (event.eventName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderEventCard = ({ item }: { item: any }) => {
    const dateInfo = formatDate(item.startDate);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate("EventDetail", {
            slug: item.slug || item.eventId,
          })
        }
        activeOpacity={0.9}
      >
        <Image
          source={{
            uri:
              item.bannerImageUrl ||
              "https://placehold.co/400x200/1a1a1a/666666?text=Event",
          }}
          style={styles.eventImage}
        />
        <View style={styles.eventImageOverlay} />

        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        </View>

        {/* Content */}
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.eventName}
          </Text>

          <View style={styles.eventInfoRow}>
            <View style={styles.eventInfoItem}>
              <Ionicons
                name="location-outline"
                size={12}
                color={COLORS.primary}
              />
              <Text style={styles.eventInfoText} numberOfLines={1}>
                {item.location || "Online"}
              </Text>
            </View>
            <View style={styles.eventInfoItem}>
              <Ionicons
                name="people-outline"
                size={12}
                color={COLORS.primary}
              />
              <Text style={styles.eventInfoText}>
                {item.organizerName || "EMS"}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <Text style={styles.eventDate}>{dateInfo.full}</Text>
            <View style={styles.arrowButton}>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={COLORS.background}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sự kiện</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sự kiện..."
            placeholderTextColor={COLORS.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          Tìm thấy{" "}
          <Text style={styles.resultsCount}>{filteredEvents.length}</Text> sự
          kiện
        </Text>
      </View>

      {/* Events List */}
      {isLoading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => `event-${item.eventId}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={60}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>Không tìm thấy sự kiện</Text>
              <Text style={styles.emptyText}>
                Thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },

  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 14,
    marginLeft: 10,
  },

  resultsBar: { paddingHorizontal: 20, marginBottom: 16 },
  resultsText: { color: COLORS.textSecondary, fontSize: 13 },
  resultsCount: { color: COLORS.text, fontWeight: "bold" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  columnWrapper: { justifyContent: "space-between", marginBottom: 16 },

  eventCard: {
    width: cardWidth,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundCard,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  eventImage: { width: "100%", height: 100 },
  eventImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    height: 100,
  },
  dateBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  dateDay: { color: COLORS.text, fontSize: 14, fontWeight: "bold" },
  dateMonth: { color: COLORS.primary, fontSize: 9, fontWeight: "600" },

  eventContent: { padding: 12 },
  eventTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 17,
    marginBottom: 8,
    height: 34,
  },
  eventInfoRow: { marginBottom: 10 },
  eventInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventInfoText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginLeft: 4,
    flex: 1,
  },

  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventDate: { color: COLORS.textMuted, fontSize: 10 },
  arrowButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
});
