import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useAppSelector } from "../../hooks/useRedux";
import apiService from "../../services/apiService";
import AppHeader from "../../components/common/Appheader";
import { useTabBar } from "../../context/TabBarContext";

const DROPDOWN_MAX = 5;

const formatDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso?: string) => {
  if (!iso) return "";
  return iso.split("T")[1]?.substring(0, 5) ?? "";
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "featured", label: "✦ Nổi bật" },
  { key: "upcoming", label: "Sắp diễn ra" },
];

const FilterTabs = ({
  active,
  onChange,
}: {
  active: string;
  onChange: (k: string) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 8,
    }}
  >
    {FILTERS.map((f) => {
      const on = active === f.key;
      return (
        <TouchableOpacity
          key={f.key}
          onPress={() => onChange(f.key)}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 9,
            borderRadius: 100,
            backgroundColor: on ? "#D8C97B" : "#161616",
            borderWidth: 1,
            borderColor: on ? "#D8C97B" : "#252525",
          }}
        >
          <Text
            style={{
              color: on ? "#000" : "#666",
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  white,
  gold,
  count,
}: {
  white: string;
  gold: string;
  count?: number;
}) => (
  <View style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 8 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 26,
          fontWeight: "900",
          letterSpacing: -0.8,
        }}
      >
        {white} <Text style={{ color: "#D8C97B" }}>{gold}</Text>
      </Text>
      {count !== undefined && (
        <View
          style={{
            backgroundColor: "rgba(216,201,123,0.1)",
            borderWidth: 1,
            borderColor: "rgba(216,201,123,0.2)",
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginBottom: 3,
          }}
        >
          <Text style={{ color: "#D8C97B", fontSize: 12, fontWeight: "700" }}>
            {count}
          </Text>
        </View>
      )}
    </View>
    <View
      style={{
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        marginTop: 10,
      }}
    />
  </View>
);

// ─── Activity row in expanded card ───────────────────────────────────────────
const ActivityRow = ({ act }: { act: any }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.04)",
    }}
  >
    {act.activityImageUrl ? (
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: "#1e1e1e",
          flexShrink: 0,
        }}
      >
        <Image
          source={{ uri: act.activityImageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    ) : (
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: "rgba(216,201,123,0.07)",
          borderWidth: 1,
          borderColor: "rgba(216,201,123,0.12)",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Ionicons name="mic-outline" size={18} color="#D8C97B" />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <Text
        style={{ color: "#ddd", fontSize: 13, fontWeight: "700" }}
        numberOfLines={1}
      >
        {act.activityName}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginTop: 3,
        }}
      >
        {act.startTime && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="time-outline" size={10} color="#555" />
            <Text style={{ color: "#555", fontSize: 11 }}>
              {formatTime(act.startTime)}
              {act.endTime ? ` – ${formatTime(act.endTime)}` : ""}
            </Text>
          </View>
        )}
        {act.presenter && (
          <Text
            style={{ color: "#D8C97B", fontSize: 11, fontWeight: "600" }}
            numberOfLines={1}
          >
            {act.presenter.fullName}
          </Text>
        )}
      </View>
    </View>
  </View>
);

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({
  item,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  item: any;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) => {
  const expandAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActs, setLoadingActs] = useState(false);

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      tension: 75,
      friction: 14,
      useNativeDriver: false,
    }).start();

    if (isExpanded && activities.length === 0 && item.eventId) {
      setLoadingActs(true);
      apiService
        .get<any[]>(`/activities/by-event/${item.eventId}`)
        .then((res) => {
          if (Array.isArray(res)) {
            setActivities(
              [...res]
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime(),
                )
                .slice(0, 4),
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoadingActs(false));
    }
  }, [isExpanded]);

  const expandOpacity = expandAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: isExpanded
          ? "rgba(216,201,123,0.4)"
          : "rgba(255,255,255,0.06)",
      }}
    >
      {isExpanded && <View style={{ height: 2, backgroundColor: "#D8C97B" }} />}

      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.82}
        style={{ flexDirection: "row", padding: 14, gap: 14 }}
      >
        <View
          style={{
            width: 106,
            height: 98,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "#1e1e1e",
          }}
        >
          <Image
            source={{
              uri: item.bannerImageUrl || "https://placehold.co/200x200",
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.45)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
            }}
          />
        </View>

        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "800",
                lineHeight: 22,
                flex: 1,
                letterSpacing: -0.3,
              }}
              numberOfLines={2}
            >
              {item.eventName}
            </Text>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isExpanded
                  ? "rgba(216,201,123,0.12)"
                  : "#1a1a1a",
                borderWidth: 1,
                borderColor: isExpanded ? "rgba(216,201,123,0.3)" : "#242424",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={13}
                color={isExpanded ? "#D8C97B" : "#555"}
              />
            </View>
          </View>

          <View style={{ gap: 5, marginTop: 8 }}>
            {item.location && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Ionicons name="location-outline" size={12} color="#555" />
                <Text
                  style={{ color: "#666", fontSize: 12, flex: 1 }}
                  numberOfLines={1}
                >
                  {item.location}
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(216,201,123,0.08)",
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
                alignSelf: "flex-start",
              }}
            >
              <Ionicons name="calendar-outline" size={11} color="#D8C97B" />
              <Text
                style={{ color: "#D8C97B", fontSize: 12, fontWeight: "700" }}
              >
                {formatDate(item.startDate)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View style={{ opacity: expandOpacity }}>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.06)",
              marginHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 14,
            }}
          >
            {item.description ? (
              <Text
                style={{
                  color: "#666",
                  fontSize: 13,
                  lineHeight: 20,
                  marginBottom: 12,
                }}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}

            {loadingActs ? (
              <View style={{ alignItems: "center", paddingVertical: 14 }}>
                <ActivityIndicator size="small" color="#D8C97B" />
              </View>
            ) : activities.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 3,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: "#D8C97B",
                    }}
                  />
                  <Text
                    style={{
                      color: "#D8C97B",
                      fontSize: 10,
                      fontWeight: "800",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Chương trình ({activities.length})
                  </Text>
                </View>
                {activities.map((act) => (
                  <ActivityRow key={act.activityId} act={act} />
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              onPress={onNavigate}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#D8C97B",
                borderRadius: 14,
                paddingVertical: 13,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 14 }}>
                Xem chi tiết sự kiện
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// ─── Presenter card ───────────────────────────────────────────────────────────
const PresenterCard = ({ presenter }: { presenter: any }) => (
  <View style={{ width: 86, marginRight: 14, alignItems: "center" }}>
    <View
      style={{
        width: 68,
        height: 68,
        borderRadius: 34,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "rgba(216,201,123,0.35)",
        backgroundColor: "#1a1a1a",
      }}
    >
      <Image
        source={{ uri: presenter.avatarUrl || "https://placehold.co/100" }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
    <Text
      style={{
        color: "#ddd",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 8,
        textAlign: "center",
        lineHeight: 16,
      }}
      numberOfLines={2}
    >
      {presenter.fullName}
    </Text>
    {presenter.title && (
      <Text
        style={{
          color: "#D8C97B",
          fontSize: 10,
          marginTop: 2,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {presenter.title}
      </Text>
    )}
  </View>
);

// ─── Dropdown item ────────────────────────────────────────────────────────────
const DropdownItem = ({
  item,
  query,
  onPress,
}: {
  item: any;
  query: string;
  onPress: () => void;
}) => {
  const name: string = item.eventName || "";
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 11,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.04)",
      }}
    >
      <Image
        source={{ uri: item.bannerImageUrl || "https://placehold.co/80" }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: "#222",
        }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
          numberOfLines={1}
        >
          {idx >= 0 ? (
            <>
              {name.slice(0, idx)}
              <Text style={{ color: "#D8C97B", fontWeight: "800" }}>
                {name.slice(idx, idx + query.length)}
              </Text>
              {name.slice(idx + query.length)}
            </>
          ) : (
            name
          )}
        </Text>
        {item.startDate && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
            }}
          >
            <Ionicons name="calendar-outline" size={10} color="#555" />
            <Text style={{ color: "#555", fontSize: 11 }}>
              {formatDate(item.startDate)}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={14} color="#333" />
    </TouchableOpacity>
  );
};

// ─── Hero Search — dropdown is NOT absolutely positioned, it flows in FlatList
//     so it never overlaps the TextInput and tapping the input always works ───
const HeroSearch = React.memo(
  ({
    searchTerm,
    searchFocused,
    dropdownResults,
    dropdownVisible,
    onChangeText,
    onFocus,
    onBlur,
    onSubmit,
    onClear,
    onSelectDropdown,
    onSeeAll,
  }: {
    searchTerm: string;
    searchFocused: boolean;
    dropdownResults: any[];
    dropdownVisible: boolean;
    onChangeText: (t: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onSubmit: () => void;
    onClear: () => void;
    onSelectDropdown: (item: any) => void;
    onSeeAll: () => void;
  }) => {
    const displayed = dropdownResults.slice(0, DROPDOWN_MAX);
    const hasMore = dropdownResults.length > DROPDOWN_MAX;

    return (
      <View>
        {/* Search bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: dropdownVisible ? 0 : 4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#161616",
              borderRadius: 18,
              paddingHorizontal: 16,
              height: 54,
              borderWidth: 1.5,
              borderColor: searchFocused
                ? "rgba(216,201,123,0.45)"
                : "rgba(255,255,255,0.07)",
            }}
          >
            <Ionicons
              name="search"
              size={19}
              color={searchFocused ? "#D8C97B" : "#555"}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 15,
                fontWeight: "500",
              }}
              placeholder="Tìm kiếm sự kiện..."
              placeholderTextColor="#444"
              value={searchTerm}
              onChangeText={onChangeText}
              onFocus={onFocus}
              onBlur={onBlur}
              returnKeyType="search"
              onSubmitEditing={onSubmit}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={onClear}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#242424",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={15} color="#777" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dropdown — flows in document order, no absolute positioning */}
        {dropdownVisible && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 6,
              marginBottom: 2,
              backgroundColor: "#161616",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(216,201,123,0.22)",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Ionicons name="search" size={11} color="#555" />
              <Text style={{ color: "#555", fontSize: 12, marginLeft: 6 }}>
                {dropdownResults.length > 0
                  ? `${dropdownResults.length} kết quả cho "${searchTerm}"`
                  : `Không tìm thấy "${searchTerm}"`}
              </Text>
            </View>

            {dropdownResults.length === 0 ? (
              <View
                style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}
              >
                <Ionicons name="search-outline" size={28} color="#2a2a2a" />
                <Text style={{ color: "#444", fontSize: 13 }}>
                  Không có sự kiện phù hợp
                </Text>
              </View>
            ) : (
              <>
                {displayed.map((item) => (
                  <DropdownItem
                    key={item.eventId}
                    item={item}
                    query={searchTerm}
                    onPress={() => onSelectDropdown(item)}
                  />
                ))}
                {hasMore && (
                  <TouchableOpacity
                    onPress={onSeeAll}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 13,
                      gap: 6,
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255,255,255,0.05)",
                      backgroundColor: "rgba(216,201,123,0.05)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#D8C97B",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      Xem tất cả {dropdownResults.length} kết quả
                    </Text>
                    <Ionicons name="chevron-down" size={13} color="#D8C97B" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  },
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const { onScroll } = useTabBar();
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((s: any) => s.auth);

  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [presenters, setPresenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showGridResults, setShowGridResults] = useState(false);

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const extractArray = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.content) return res.content;
    return [];
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [featured, upcoming, all] = await Promise.all([
        apiService.get("/events/featured"),
        apiService.get("/events/upcoming-selected"),
        apiService.get("/events/public"),
      ]);
      const f = extractArray(featured);
      const u = extractArray(upcoming);
      const a = extractArray(all);
      setFeaturedEvents(f);
      setUpcomingEvents(u);
      setAllEvents(a);

      const pivot = f.length > 0 ? f : a;
      if (pivot.length > 0 && pivot[0].eventId) {
        try {
          const acts = await apiService.get<any[]>(
            `/activities/by-event/${pivot[0].eventId}`,
          );
          if (Array.isArray(acts)) {
            const map = new Map<number, any>();
            acts.forEach((act) => {
              if (act.presenter)
                map.set(act.presenter.presenterId, act.presenter);
            });
            setPresenters(Array.from(map.values()).slice(0, 10));
          }
        } catch (_) {}
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const checkSub = useCallback(async () => {
    if (user?.email) {
      try {
        const s = await AsyncStorage.getItem(
          `newsletter_subscribed_${user.email}`,
        );
        setIsSuccess(s === "true");
      } catch {
        setIsSuccess(false);
      }
    } else setIsSuccess(false);
  }, [user?.email]);

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    checkSub();
  }, [checkSub]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const baseEvents = useMemo(() => {
    if (filter === "featured") return featuredEvents;
    if (filter === "upcoming") return upcomingEvents;
    return allEvents;
  }, [filter, featuredEvents, upcomingEvents, allEvents]);

  const dropdownResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allEvents.filter((e: any) =>
      (e.eventName || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [allEvents, searchTerm]);

  const displayEvents = useMemo(() => {
    if (!searchTerm.trim() || !showGridResults) return baseEvents;
    return baseEvents.filter((e: any) =>
      (e.eventName || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [baseEvents, searchTerm, showGridResults]);

  const dropdownVisible = searchFocused && searchTerm.trim().length > 0;

  const handleSearchChange = useCallback((text: string) => {
    setSearchTerm(text);
    setShowGridResults(false);
    setExpandedId(null);
  }, []);
  const handleSearchFocus = useCallback(() => setSearchFocused(true), []);
  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setSearchFocused(false), 200);
  }, []);
  const handleSeeAll = useCallback(() => {
    setSearchFocused(false);
    setShowGridResults(true);
  }, []);
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setShowGridResults(false);
  }, []);
  const handleSelectDropdown = useCallback(
    (item: any) => {
      setSearchTerm("");
      setSearchFocused(false);
      setShowGridResults(false);
      navigation.navigate("EventDetail", { slug: item.slug || item.eventId });
    },
    [navigation],
  );

  const handleSubscribe = async () => {
    if (!email) {
      Toast.show({
        type: "warning",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập email.",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.show({ type: "error", text1: "Email không hợp lệ" });
      return;
    }
    try {
      setSubscribing(true);
      await apiService.post("/events/newsletter/subscribe", email, {
        params: { subscribe: true },
        headers: { "Content-Type": "application/json" },
      });
      const key = `newsletter_subscribed_${user?.email || email}`;
      await AsyncStorage.setItem(key, "true");
      setIsSuccess(true);
      setEmail("");
      Toast.show({ type: "success", text1: "Đăng ký thành công 🎉" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "";
      if (
        msg.toLowerCase().includes("tồn tại") ||
        msg.toLowerCase().includes("exists")
      ) {
        await AsyncStorage.setItem(
          `newsletter_subscribed_${user?.email || email}`,
          "true",
        );
        setIsSuccess(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Đăng ký thất bại",
          text2: msg || "Thử lại sau.",
        });
      }
    } finally {
      setSubscribing(false);
    }
  };

  const listHeader = useMemo(
    () => (
      <View>
        <AppHeader />
        <HeroSearch
          searchTerm={searchTerm}
          searchFocused={searchFocused}
          dropdownResults={dropdownResults}
          dropdownVisible={dropdownVisible}
          onChangeText={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onSubmit={handleSeeAll}
          onClear={handleClearSearch}
          onSelectDropdown={handleSelectDropdown}
          onSeeAll={handleSeeAll}
        />
        <FilterTabs
          active={filter}
          onChange={(k) => {
            setFilter(k);
            setExpandedId(null);
          }}
        />
        {showGridResults ? (
          <View
            style={{
              paddingHorizontal: 20,
              marginVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
              Kết quả <Text style={{ color: "#D8C97B" }}>"{searchTerm}"</Text>
            </Text>
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={{ color: "#555", fontSize: 13 }}>Xoá</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionHeader
            white={
              filter === "featured"
                ? "Sự kiện"
                : filter === "upcoming"
                  ? "Sắp"
                  : "Tất cả"
            }
            gold={
              filter === "featured"
                ? "nổi bật"
                : filter === "upcoming"
                  ? "diễn ra"
                  : "sự kiện"
            }
            count={displayEvents.length}
          />
        )}
      </View>
    ),
    [
      filter,
      showGridResults,
      searchTerm,
      searchFocused,
      dropdownResults,
      dropdownVisible,
      displayEvents.length,
      handleSearchChange,
      handleSearchFocus,
      handleSearchBlur,
      handleSeeAll,
      handleClearSearch,
      handleSelectDropdown,
    ],
  );

  const listFooter = useMemo(
    () => (
      <View style={{ marginTop: 16, paddingBottom: 120 }}>
        {presenters.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <SectionHeader white="Diễn giả" gold="nổi bật" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 8,
              }}
            >
              {presenters.map((p) => (
                <PresenterCard key={p.presenterId} presenter={p} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ paddingHorizontal: 20 }}>
          <LinearGradient
            colors={["#181500", "#0d0d0d"]}
            style={{
              borderRadius: 28,
              padding: 28,
              borderWidth: 1,
              borderColor: "rgba(216,201,123,0.18)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(216,201,123,0.05)",
              }}
            />
            {!isSuccess ? (
              <>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "rgba(216,201,123,0.12)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                    alignSelf: "center",
                    borderWidth: 1,
                    borderColor: "rgba(216,201,123,0.2)",
                  }}
                >
                  <Ionicons name="mail" size={22} color="#D8C97B" />
                </View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: "900",
                    textAlign: "center",
                    marginBottom: 8,
                    letterSpacing: -0.4,
                  }}
                >
                  Đừng bỏ lỡ sự kiện nào
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 14,
                    textAlign: "center",
                    marginBottom: 22,
                    lineHeight: 21,
                  }}
                >
                  Nhận thông báo sự kiện hot và ưu đãi{"\n"}vé sớm dành riêng
                  cho bạn.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    paddingLeft: 14,
                    paddingRight: 6,
                    height: 54,
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color="#555"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Nhập email của bạn..."
                    placeholderTextColor="#444"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={handleSubscribe}
                    disabled={subscribing}
                    style={{
                      backgroundColor: "#D8C97B",
                      borderRadius: 12,
                      height: 42,
                      paddingHorizontal: 18,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: subscribing ? 0.8 : 1,
                    }}
                  >
                    {subscribing ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text
                        style={{
                          color: "#000",
                          fontWeight: "900",
                          fontSize: 14,
                        }}
                      >
                        Đăng ký
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <View
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "rgba(74,222,128,0.1)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: "rgba(74,222,128,0.25)",
                  }}
                >
                  <Ionicons name="checkmark-circle" size={38} color="#4ade80" />
                </View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: "900",
                    marginBottom: 8,
                  }}
                >
                  Đăng ký thành công!
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  Bạn sẽ nhận thông báo sự kiện hot{"\n"}và ưu đãi vé sớm nhất.
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    ),
    [isSuccess, email, subscribing, user, presenters],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
        <StatusBar barStyle="light-content" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: "#141414",
              borderWidth: 1,
              borderColor: "rgba(216,201,123,0.15)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <ActivityIndicator size="large" color="#D8C97B" />
          </View>
          <Text
            style={{
              color: "#555",
              fontSize: 11,
              letterSpacing: 3,
              fontWeight: "700",
            }}
          >
            ĐANG TẢI...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderEventCard = ({ item }: any) => (
    <EventCard
      item={item}
      isExpanded={expandedId === item.eventId}
      onToggle={() =>
        setExpandedId(expandedId === item.eventId ? null : item.eventId)
      }
      onNavigate={() =>
        navigation.navigate("EventDetail", { slug: item.slug || item.eventId })
      }
    />
  );

  const listEmpty = () => (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 56,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: "#161616",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <Ionicons name="calendar-outline" size={30} color="#333" />
      </View>
      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "800",
          marginBottom: 8,
        }}
      >
        Không tìm thấy sự kiện
      </Text>
      <Text
        style={{
          color: "#555",
          fontSize: 14,
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        Thử tìm kiếm với từ khoá khác hoặc chọn danh mục khác.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <FlatList
        data={displayEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.eventId?.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => setSearchFocused(false)}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D8C97B"
          />
        }
      />
    </SafeAreaView>
  );
}
