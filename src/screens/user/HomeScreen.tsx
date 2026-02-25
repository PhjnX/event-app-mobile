import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchPublicEvents,
  fetchFeaturedEvents,
  fetchMyRegistrations,
} from "../../store/slices/eventSlice";
import { fetchPosts } from "../../store/slices/newsSlice";
import LoadingScreen from "../../components/common/LoadingScreen";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundLight: "#1a1a1a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  cardBorder: "rgba(255,255,255,0.05)",
};

// Partner logos
const PARTNERS = [
  { id: 1, logo: "https://via.placeholder.com/100x50/1a1a1a/D8C97B?text=P1" },
  { id: 2, logo: "https://via.placeholder.com/100x50/1a1a1a/D8C97B?text=P2" },
  { id: 3, logo: "https://via.placeholder.com/100x50/1a1a1a/D8C97B?text=P3" },
  { id: 4, logo: "https://via.placeholder.com/100x50/1a1a1a/D8C97B?text=P4" },
];

const formatDate = (dateString: string) => {
  if (!dateString) return { day: "--", month: "---", full: "", time: "" };
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("vi-VN", { month: "short" }).toUpperCase(),
    full: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

// ===== MEMOIZED COMPONENTS =====

// Section Header
const SectionHeader = memo(({ title, highlight, onSeeAll }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>
      {title} <Text style={styles.highlight}>{highlight}</Text>
    </Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>Xem tất cả</Text>
        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
      </TouchableOpacity>
    )}
  </View>
));

// Quick Action Button
const QuickAction = memo(({ icon, label, onPress, badge }: any) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionIcon}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
));

// Event Mini Card
const EventMiniCard = memo(({ item, onPress }: any) => {
  const dateInfo = useMemo(() => formatDate(item.startDate), [item.startDate]);

  return (
    <TouchableOpacity style={styles.eventMiniCard} onPress={onPress}>
      <Image
        source={{
          uri:
            item.bannerImageUrl ||
            "https://placehold.co/200x100/1a1a1a/666666?text=Event",
        }}
        style={styles.eventMiniImage}
      />
      <View style={styles.eventMiniDateBadge}>
        <Text style={styles.eventMiniDay}>{dateInfo.day}</Text>
        <Text style={styles.eventMiniMonth}>{dateInfo.month}</Text>
      </View>
      <View style={styles.eventMiniContent}>
        <Text style={styles.eventMiniTitle} numberOfLines={2}>
          {item.eventName}
        </Text>
        <View style={styles.eventMiniLocation}>
          <Ionicons name="location-outline" size={10} color={COLORS.primary} />
          <Text style={styles.eventMiniLocationText} numberOfLines={1}>
            {item.location || "Online"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// News Mini Card
const NewsMiniCard = memo(({ item, onPress }: any) => (
  <TouchableOpacity style={styles.newsMiniCard} onPress={onPress}>
    <Image
      source={{
        uri:
          item.thumbnailUrl ||
          "https://placehold.co/70x70/1a1a1a/666666?text=News",
      }}
      style={styles.newsMiniImage}
    />
    <View style={styles.newsMiniContent}>
      <Text style={styles.newsMiniTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.newsMiniDate}>
        {item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("vi-VN")
          : ""}
      </Text>
    </View>
  </TouchableOpacity>
));

// Event Select Modal Item
const EventSelectItem = memo(({ item, onPress }: any) => {
  const dateInfo = useMemo(
    () => formatDate(item.eventStartDate),
    [item.eventStartDate],
  );

  return (
    <TouchableOpacity style={styles.eventSelectItem} onPress={onPress}>
      <Image
        source={{
          uri:
            item.eventBanner ||
            "https://placehold.co/60x60/1a1a1a/666666?text=E",
        }}
        style={styles.eventSelectImage}
      />
      <View style={styles.eventSelectContent}>
        <Text style={styles.eventSelectTitle} numberOfLines={2}>
          {item.eventName}
        </Text>
        <Text style={styles.eventSelectDate}>{dateInfo.full}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
});

// ===== MAIN COMPONENT =====
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const eventsState = useAppSelector((state) => state.events);
  const newsState = useAppSelector((state) => state.news);

  const events = useMemo(
    () => eventsState?.events || [],
    [eventsState?.events],
  );
  const featuredEvents = useMemo(
    () => eventsState?.featuredEvents || [],
    [eventsState?.featuredEvents],
  );
  const myRegistrations = useMemo(
    () => eventsState?.myRegistrations || [],
    [eventsState?.myRegistrations],
  );
  const posts = useMemo(() => newsState?.posts || [], [newsState?.posts]);

  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showMomentsModal, setShowMomentsModal] = useState(false);

  // Active tickets count
  const activeTicketsCount = useMemo(() => {
    return myRegistrations.filter((t: any) => {
      const endDate = new Date(t.eventEndDate || t.eventStartDate);
      return endDate >= new Date();
    }).length;
  }, [myRegistrations]);

  // Approved registrations for moments
  const approvedRegistrations = useMemo(() => {
    return myRegistrations.filter((t: any) => {
      const endDate = new Date(t.eventEndDate || t.eventStartDate);
      return (
        endDate >= new Date() &&
        (t.status === "APPROVED" || t.status === "CONFIRMED")
      );
    });
  }, [myRegistrations]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (featuredEvents.length > 1) {
      const timer = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredEvents.length]);

  const loadData = useCallback(async () => {
    try {
      const promises = [
        dispatch(fetchPublicEvents()),
        dispatch(fetchFeaturedEvents()),
        dispatch(fetchPosts()),
      ];

      if (isAuthenticated) {
        promises.push(dispatch(fetchMyRegistrations()));
      }

      await Promise.all(promises);
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setIsFirstLoad(false);
    }
  }, [dispatch, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Handle moments button
  const handleMomentsPress = useCallback(() => {
    if (!isAuthenticated) {
      navigation.navigate("Auth");
      return;
    }

    if (approvedRegistrations.length === 0) {
      // Không có sự kiện đã đăng ký
      navigation.navigate("Events");
      return;
    }

    if (approvedRegistrations.length === 1) {
      // Chỉ có 1 sự kiện -> vào thẳng
      navigation.navigate("EventMoments", {
        eventId: approvedRegistrations[0].eventId,
        eventName: approvedRegistrations[0].eventName,
      });
      return;
    }

    // Nhiều sự kiện -> hiện modal chọn
    setShowMomentsModal(true);
  }, [isAuthenticated, approvedRegistrations, navigation]);

  // Select event for moments
  const handleSelectEventForMoments = useCallback(
    (item: any) => {
      setShowMomentsModal(false);
      navigation.navigate("EventMoments", {
        eventId: item.eventId,
        eventName: item.eventName,
      });
    },
    [navigation],
  );

  // Navigation handlers
  const handleEventPress = useCallback(
    (item: any) => {
      navigation.navigate("EventDetail", { slug: item.slug || item.eventId });
    },
    [navigation],
  );

  const handleNewsPress = useCallback(
    (item: any) => {
      navigation.navigate("NewsDetail", { slug: item.slug || item.id });
    },
    [navigation],
  );

  // Show loading on first load
  if (isFirstLoad) {
    return <LoadingScreen message="Đang tải" />;
  }

  // Featured Banner
  const renderFeaturedBanner = () => {
    const displayEvents =
      featuredEvents.length > 0 ? featuredEvents : events.slice(0, 3);
    if (displayEvents.length === 0) return null;

    const currentEvent = displayEvents[featuredIndex % displayEvents.length];
    if (!currentEvent) return null;

    return (
      <TouchableOpacity
        style={styles.featuredContainer}
        onPress={() => handleEventPress(currentEvent)}
        activeOpacity={0.95}
      >
        <ImageBackground
          source={{
            uri:
              currentEvent.bannerImageUrl ||
              "https://placehold.co/600x300/1a1a1a/666666?text=Event",
          }}
          style={styles.featuredImage}
          imageStyle={{ borderRadius: 20 }}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.95)"]}
            style={styles.featuredGradient}
          >
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color={COLORS.background} />
              <Text style={styles.featuredBadgeText}>NỔI BẬT</Text>
            </View>

            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {currentEvent.eventName}
              </Text>
              <View style={styles.featuredInfoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.featuredInfoText}>
                  {formatDate(currentEvent.startDate).full}
                </Text>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={COLORS.primary}
                  style={{ marginLeft: 12 }}
                />
                <Text style={styles.featuredInfoText} numberOfLines={1}>
                  {currentEvent.location || "Online"}
                </Text>
              </View>
            </View>

            {displayEvents.length > 1 && (
              <View style={styles.dotsContainer}>
                {displayEvents.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === featuredIndex % displayEvents.length &&
                        styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  // My Tickets Section
  const renderMyTickets = () => {
    if (!isAuthenticated) return null;

    const activeTickets = myRegistrations.filter((t: any) => {
      const endDate = new Date(t.eventEndDate || t.eventStartDate);
      return (
        endDate >= new Date() &&
        (t.status === "APPROVED" || t.status === "CONFIRMED")
      );
    });

    return (
      <View style={styles.section}>
        <SectionHeader
          title="Vé"
          highlight="của tôi"
          onSeeAll={() => navigation.navigate("MyTickets")}
        />

        {activeTickets.length > 0 ? (
          <FlatList
            data={activeTickets.slice(0, 3)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            keyExtractor={(item) => `ticket-${item.registrationId}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.ticketMiniCard}
                onPress={() => navigation.navigate("MyTickets")}
              >
                <Image
                  source={{
                    uri:
                      item.eventBanner ||
                      "https://placehold.co/60x60/1a1a1a/666666?text=E",
                  }}
                  style={styles.ticketMiniImage}
                />
                <View style={styles.ticketMiniContent}>
                  <Text style={styles.ticketMiniTitle} numberOfLines={1}>
                    {item.eventName}
                  </Text>
                  <View style={styles.ticketMiniInfo}>
                    <Ionicons
                      name="calendar-outline"
                      size={10}
                      color={COLORS.primary}
                    />
                    <Text style={styles.ticketMiniDate}>
                      {formatDate(item.eventStartDate).full}
                    </Text>
                  </View>
                </View>
                <View style={styles.ticketMiniQR}>
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyTickets}>
            <Ionicons
              name="ticket-outline"
              size={32}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTicketsText}>Chưa có vé nào</Text>
            <TouchableOpacity
              style={styles.findEventBtn}
              onPress={() => navigation.navigate("Events")}
            >
              <Text style={styles.findEventBtnText}>Tìm sự kiện</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Partners Section
  const renderPartners = () => (
    <View style={styles.section}>
      <SectionHeader title="Đối tác" highlight="đồng hành" />
      <View style={styles.partnersGrid}>
        {PARTNERS.map((partner) => (
          <View key={partner.id} style={styles.partnerItem}>
            <Image
              source={{ uri: partner.logo }}
              style={styles.partnerLogo}
              resizeMode="contain"
            />
          </View>
        ))}
      </View>
    </View>
  );

  // About Section
  const renderAboutSection = () => (
    <View style={styles.aboutSection}>
      <View style={styles.aboutBadge}>
        <Text style={styles.aboutBadgeText}>VỀ WEBIE</Text>
      </View>
      <Text style={styles.aboutTitle}>
        Nền tảng quản lý sự kiện chuyên nghiệp
      </Text>
      <Text style={styles.aboutDesc}>
        Webie Event Management System giúp bạn tổ chức, quản lý và tham gia các
        sự kiện một cách dễ dàng.
      </Text>
      <View style={styles.aboutFeatures}>
        {[
          { icon: "ticket-outline", text: "Đăng ký sự kiện nhanh chóng" },
          { icon: "qr-code-outline", text: "Check-in bằng QR code" },
          { icon: "notifications-outline", text: "Thông báo realtime" },
        ].map((feature, index) => (
          <View key={index} style={styles.aboutFeatureItem}>
            <Ionicons
              name={feature.icon as any}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.aboutFeatureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Moments Modal
  const renderMomentsModal = () => (
    <Modal visible={showMomentsModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn sự kiện</Text>
            <TouchableOpacity onPress={() => setShowMomentsModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            Chọn sự kiện bạn muốn chia sẻ khoảnh khắc
          </Text>

          <FlatList
            data={approvedRegistrations}
            keyExtractor={(item) => `reg-${item.registrationId}`}
            renderItem={({ item }) => (
              <EventSelectItem
                item={item}
                onPress={() => handleSelectEventForMoments(item)}
              />
            )}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.username}>{user?.username || "Khách"}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || "K"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Featured Banner */}
        {renderFeaturedBanner()}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="ticket-outline"
            label="Vé của tôi"
            badge={activeTicketsCount}
            onPress={() => navigation.navigate("MyTickets")}
          />
          <QuickAction
            icon="camera-outline"
            label="Khoảnh khắc"
            onPress={handleMomentsPress}
          />
          <QuickAction
            icon="calendar-outline"
            label="Sự kiện"
            onPress={() => navigation.navigate("Events")}
          />
          <QuickAction
            icon="newspaper-outline"
            label="Tin tức"
            onPress={() => navigation.navigate("News")}
          />
        </View>

        {/* My Tickets */}
        {renderMyTickets()}

        {/* Events */}
        <View style={styles.section}>
          <SectionHeader
            title="Sự kiện"
            highlight="nổi bật"
            onSeeAll={() => navigation.navigate("Events")}
          />
          {events.length > 0 ? (
            <FlatList
              data={events.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyExtractor={(item) => `event-${item.eventId}`}
              renderItem={({ item }) => (
                <EventMiniCard
                  item={item}
                  onPress={() => handleEventPress(item)}
                />
              )}
              removeClippedSubviews={true}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>Chưa có sự kiện</Text>
            </View>
          )}
        </View>

        {/* News */}
        <View style={styles.section}>
          <SectionHeader
            title="Tin tức"
            highlight="mới nhất"
            onSeeAll={() => navigation.navigate("News")}
          />
          {posts.length > 0 ? (
            <View style={styles.newsList}>
              {posts.slice(0, 4).map((item: any) => (
                <NewsMiniCard
                  key={`news-${item.id}`}
                  item={item}
                  onPress={() => handleNewsPress(item)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="newspaper-outline"
                size={40}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>Chưa có tin tức</Text>
            </View>
          )}
        </View>

        {/* Partners */}
        {renderPartners()}

        {/* About */}
        {renderAboutSection()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Moments Modal */}
      {renderMomentsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { color: COLORS.textSecondary, fontSize: 14 },
  username: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: COLORS.background, fontSize: 20, fontWeight: "bold" },

  // Featured
  featuredContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredImage: { width: "100%", height: "100%" },
  featuredGradient: { flex: 1, padding: 16, justifyContent: "flex-end" },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  featuredBadgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
    letterSpacing: 1,
  },
  featuredContent: { marginBottom: 10 },
  featuredTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  featuredInfoRow: { flexDirection: "row", alignItems: "center" },
  featuredInfoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 3,
  },
  dotActive: { width: 20, backgroundColor: COLORS.primary },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
  },
  actionButton: { alignItems: "center" },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(216,201,123,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    position: "relative",
  },
  actionText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "500" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  // Section
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  highlight: { color: COLORS.primary },
  seeAllButton: { flexDirection: "row", alignItems: "center" },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
  emptyContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },

  // Tickets
  ticketMiniCard: {
    width: 220,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
    flexDirection: "row",
    alignItems: "center",
  },
  ticketMiniImage: { width: 60, height: 60, margin: 10, borderRadius: 8 },
  ticketMiniContent: { flex: 1, paddingRight: 8 },
  ticketMiniTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  ticketMiniInfo: { flexDirection: "row", alignItems: "center" },
  ticketMiniDate: { color: COLORS.textMuted, fontSize: 10, marginLeft: 4 },
  ticketMiniQR: {
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(216,201,123,0.2)",
  },
  emptyTickets: {
    alignItems: "center",
    paddingVertical: 30,
    marginHorizontal: 20,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: "dashed",
  },
  emptyTicketsText: { color: COLORS.textMuted, fontSize: 13, marginTop: 8 },
  findEventBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  findEventBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },

  // Event Mini Card
  eventMiniCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundCard,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  eventMiniImage: { width: "100%", height: 90 },
  eventMiniDateBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  eventMiniDay: { color: COLORS.text, fontSize: 14, fontWeight: "bold" },
  eventMiniMonth: { color: COLORS.primary, fontSize: 9, fontWeight: "600" },
  eventMiniContent: { padding: 10 },
  eventMiniTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    marginBottom: 6,
    height: 34,
  },
  eventMiniLocation: { flexDirection: "row", alignItems: "center" },
  eventMiniLocationText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginLeft: 3,
    flex: 1,
  },

  // News Mini Card
  newsList: { paddingHorizontal: 20 },
  newsMiniCard: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  newsMiniImage: { width: 70, height: 70, borderRadius: 8 },
  newsMiniContent: { flex: 1, marginLeft: 12, justifyContent: "center" },
  newsMiniTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 4,
  },
  newsMiniDate: { color: COLORS.textMuted, fontSize: 11 },

  // Partners
  partnersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  partnerItem: {
    width: (width - 60) / 2,
    height: 60,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  partnerLogo: { width: "70%", height: 30 },

  // About Section
  aboutSection: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.2)",
  },
  aboutBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(216,201,123,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  aboutBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  aboutTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  aboutDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  aboutFeatures: {},
  aboutFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  aboutFeatureText: { color: COLORS.text, fontSize: 13, marginLeft: 10 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  modalSubtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20 },
  modalList: { maxHeight: 400 },

  // Event Select Item
  eventSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  eventSelectImage: { width: 50, height: 50, borderRadius: 10 },
  eventSelectContent: { flex: 1, marginLeft: 12 },
  eventSelectTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventSelectDate: { color: COLORS.textMuted, fontSize: 11 },
});
