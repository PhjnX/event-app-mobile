import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAppSelector } from "../../hooks/useRedux";
import { momentApi } from "../../services/momentService";
import axiosClient from "../../services/apiService";
import imageService from "../../services/imageService";
import storageService from "../../services/storageService";
import { STORAGE_KEYS } from "../../constants";

const { width } = Dimensions.get("window");

const WS_BASE =
  (
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://event-app-y77p.onrender.com/api"
  ).replace(/\/api$/, "") + "/ws";

interface Moment {
  id: number;
  userId: number;
  username: string;
  userAvatar: string;
  caption: string;
  imageUrl?: string;
  postedAt: string;
  timeAgo: string;
}

interface WSPayload {
  type: "CREATE" | "UPDATE" | "DELETE" | string;
  data: any;
}

// ─── Moment Card ──────────────────────────────────────────────────────────────
const MomentCard = memo(
  ({
    item,
    isOwner,
    onEdit,
    onDelete,
  }: {
    item: Moment;
    isOwner: boolean;
    onEdit: (m: Moment) => void;
    onDelete: (id: number) => void;
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: "#111111",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {/* Card header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.07)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {item.userAvatar ? (
              <Image
                source={{ uri: item.userAvatar }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                  borderWidth: 1.5,
                  borderColor: "rgba(216,201,123,0.25)",
                }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(216,201,123,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.25)",
                }}
              >
                <Text style={{ color: "#D8C97B", fontWeight: "700" }}>
                  {item.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                {item.username}
              </Text>
              <Text style={{ color: "#444", fontSize: 12, marginTop: 2 }}>
                {item.timeAgo}
              </Text>
            </View>
          </View>

          {isOwner && (
            <View>
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => setMenuOpen(!menuOpen)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#555" />
              </TouchableOpacity>
              {menuOpen && (
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 36,
                    width: 148,
                    backgroundColor: "#1e1e1e",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.07)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                    onPress={() => {
                      onEdit(item);
                      setMenuOpen(false);
                    }}
                  >
                    <Ionicons name="pencil-outline" size={13} color="#D8C97B" />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      Chỉnh sửa
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "rgba(255,255,255,0.07)",
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                    onPress={() => {
                      onDelete(item.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={13} color="#ef4444" />
                    <Text
                      style={{
                        color: "#ef4444",
                        fontSize: 12,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      Xóa
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {item.caption ? (
          <Text
            style={{
              color: "#ccc",
              fontSize: 14,
              lineHeight: 24,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            {item.caption}
          </Text>
        ) : null}

        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.07)",
          }}
        >
          <Ionicons name="heart-outline" size={18} color="#444" />
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color="#444"
            style={{ marginLeft: 16 }}
          />
          <View style={{ flex: 1 }} />
          <Ionicons name="bookmark-outline" size={18} color="#444" />
        </View>
      </View>
    );
  },
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = memo(
  ({
    visible,
    moment,
    onClose,
    onSave,
    isLoading,
  }: {
    visible: boolean;
    moment: Moment | null;
    onClose: () => void;
    onSave: (caption: string) => void;
    isLoading: boolean;
  }) => {
    const [caption, setCaption] = useState("");
    useEffect(() => {
      if (moment) setCaption(moment.caption || "");
    }, [moment]);

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.88)",
            }}
          >
            <View
              style={{
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 40,
                backgroundColor: "#181818",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderTopWidth: 1,
                borderTopColor: "rgba(216,201,123,0.25)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#333",
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
                >
                  Chỉnh sửa moment
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close-circle" size={26} color="#555" />
                </TouchableOpacity>
              </View>

              {moment?.imageUrl && (
                <Image
                  source={{ uri: moment.imageUrl }}
                  style={{
                    width: "100%",
                    height: 160,
                    borderRadius: 16,
                    marginBottom: 16,
                  }}
                  resizeMode="cover"
                />
              )}

              <TextInput
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  color: "#fff",
                  fontSize: 14,
                  minHeight: 110,
                  textAlignVertical: "top",
                }}
                placeholder="Cập nhật caption..."
                placeholderTextColor="#3a3a3a"
                value={caption}
                onChangeText={setCaption}
                multiline
              />

              <View style={{ flexDirection: "row", marginTop: 16 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: "center",
                    marginRight: 10,
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                  onPress={onClose}
                >
                  <Text
                    style={{ color: "#888", fontSize: 14, fontWeight: "700" }}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#D8C97B",
                  }}
                  onPress={() => onSave(caption)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0a0a0a" />
                  ) : (
                    <Text
                      style={{
                        color: "#0a0a0a",
                        fontSize: 14,
                        fontWeight: "800",
                      }}
                    >
                      Lưu thay đổi
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

// ─── Post Input Box ───────────────────────────────────────────────────────────
// Định nghĩa NGOÀI component chính — không bao giờ bị tạo lại khi state thay đổi
const PostInputBox = memo(
  ({
    user,
    caption,
    onChangeCaption,
    previewImg,
    onPickImage,
    onClearImage,
    onPost,
    isPosting,
  }: {
    user: any;
    caption: string;
    onChangeCaption: (t: string) => void;
    previewImg: string | null;
    onPickImage: () => void;
    onClearImage: () => void;
    onPost: () => void;
    isPosting: boolean;
  }) => {
    const canSubmit = (caption.trim().length > 0 || !!previewImg) && !isPosting;
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 24,
          padding: 16,
          backgroundColor: "#111111",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                marginRight: 12,
                borderWidth: 1.5,
                borderColor: "rgba(216,201,123,0.25)",
              }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                marginRight: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(216,201,123,0.1)",
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.25)",
              }}
            >
              <Text
                style={{ color: "#D8C97B", fontWeight: "700", fontSize: 16 }}
              >
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <TextInput
              style={{
                color: "#fff",
                fontSize: 14,
                minHeight: 52,
                textAlignVertical: "top",
                lineHeight: 22,
              }}
              placeholder="Chia sẻ khoảnh khắc của bạn..."
              placeholderTextColor="#3a3a3a"
              value={caption}
              onChangeText={onChangeCaption}
              multiline
            />

            {previewImg && (
              <View
                style={{ marginTop: 10, borderRadius: 16, overflow: "hidden" }}
              >
                <Image
                  source={{ uri: previewImg }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.75)",
                    borderRadius: 12,
                    padding: 6,
                  }}
                  onPress={onClearImage}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.07)",
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: "rgba(216,201,123,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.25)",
                }}
                onPress={onPickImage}
              >
                <Ionicons name="image-outline" size={17} color="#D8C97B" />
                <Text
                  style={{
                    color: "#D8C97B",
                    fontSize: 12,
                    fontWeight: "700",
                    marginLeft: 6,
                  }}
                >
                  Ảnh
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: canSubmit ? "#D8C97B" : "#1a1a1a",
                  borderWidth: 1,
                  borderColor: canSubmit ? "#D8C97B" : "#333",
                }}
                onPress={onPost}
                disabled={!canSubmit}
              >
                {isPosting ? (
                  <ActivityIndicator size="small" color="#0a0a0a" />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane"
                      size={14}
                      color={canSubmit ? "#0a0a0a" : "#555"}
                    />
                    <Text
                      style={{
                        color: canSubmit ? "#0a0a0a" : "#555",
                        fontSize: 12,
                        fontWeight: "800",
                        marginLeft: 6,
                      }}
                    >
                      Đăng
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EventMomentsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    eventId,
    eventName: routeEventName,
    canPost = false,
    ticketStatus = "",
  } = route.params || {};
  const { user } = useAppSelector((s: any) => s.auth);

  const [moments, setMoments] = useState<Moment[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "MINE">("ALL");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Post state — tách riêng, truyền qua props xuống PostInputBox
  const [caption, setCaption] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<any>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const connect = async () => {
      const token = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_BASE) as any,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe(`/topic/event/${eventId}/moments`, (msg) => {
            if (msg.body) handleWsMessage(JSON.parse(msg.body));
          });
        },
      });
      client.activate();
      stompClient.current = client;
    };
    connect();
    return () => {
      stompClient.current?.deactivate();
    };
  }, [eventId]);

  const handleWsMessage = useCallback((payload: WSPayload) => {
    const { type, data } = payload;
    setMoments((prev) => {
      switch (type) {
        case "CREATE":
          return prev.some((m) => m.id === data.id) ? prev : [data, ...prev];
        case "UPDATE":
          return prev.map((m) => (m.id === data.id ? data : m));
        case "DELETE":
          return prev.filter((m) => m.id !== data);
        default:
          return prev;
      }
    });
  }, []);

  const fetchMoments = useCallback(
    async (reset = false) => {
      if (!eventId) return;
      if (reset) setIsLoadingList(true);
      try {
        if (activeTab === "ALL") {
          const currentPage = reset ? 0 : page;
          const res: any = await momentApi.getMoments(eventId, currentPage, 10);
          const content = res.data?.content || res.content || [];
          const isLast = res.data?.last ?? res.last ?? true;
          if (reset) {
            setMoments(content);
            setPage(1);
          } else {
            setMoments((prev) => {
              const ids = new Set(prev.map((p) => p.id));
              return [
                ...prev,
                ...content.filter((n: Moment) => !ids.has(n.id)),
              ];
            });
            setPage((p) => p + 1);
          }
          setHasMore(!isLast && content.length > 0);
        } else {
          const res: any = await momentApi.getMyMoments(eventId);
          setMoments(Array.isArray(res) ? res : res.data?.content || []);
          setHasMore(false);
        }
      } catch (e) {
      } finally {
        setIsLoadingList(false);
      }
    },
    [eventId, activeTab, page],
  );

  useEffect(() => {
    if (eventId) fetchMoments(true);
  }, [eventId, activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMoments(true);
    setRefreshing(false);
  }, [fetchMoments]);

  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Thông báo", "Cần cấp quyền truy cập thư viện ảnh!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPreviewImg(asset.uri);
      setFileToUpload(imageService.createImageFile(asset.uri, "moment.jpg"));
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !fileToUpload) {
      Alert.alert("Thông báo", "Vui lòng nhập caption hoặc chọn ảnh!");
      return;
    }
    setIsPosting(true);
    try {
      let imageUrl = "";
      if (fileToUpload) {
        const formData = new FormData();
        formData.append("image", fileToUpload);
        const res: any = await axiosClient.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = res.data?.url || res.data || res;
      }
      await momentApi.createMoment(eventId, { caption, imageUrl });
      setCaption("");
      setPreviewImg(null);
      setFileToUpload(null);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message || "Đăng moment thất bại!");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    Alert.alert("Xóa moment", "Bạn có chắc muốn xóa moment này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await momentApi.deleteMoment(eventId, id);
          } catch (e: any) {
            Alert.alert("Lỗi", e?.response?.data?.message || "Xóa thất bại!");
          }
        },
      },
    ]);
  };

  const handleUpdate = async (newCaption: string) => {
    if (!editingMoment) return;
    setIsUpdating(true);
    try {
      await momentApi.updateMoment(eventId, editingMoment.id, {
        caption: newCaption,
        imageUrl: editingMoment.imageUrl || "",
      });
      setEditingMoment(null);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setIsUpdating(false);
    }
  };

  const readOnlyReason = () => {
    if (ticketStatus?.toUpperCase() === "CHECKED_IN")
      return "Vé đã được check-in, không thể đăng thêm.";
    return "Sự kiện đã kết thúc, bạn chỉ có thể xem lại moments.";
  };

  // ✅ listHeader dùng useMemo — deps không bao gồm caption/previewImg/isPosting
  // PostInputBox nhận props và tự cập nhật mà không làm remount header
  const listHeader = useMemo(
    () => (
      <View style={{ paddingTop: 12 }}>
        {activeTab === "ALL" &&
          (canPost ? (
            <PostInputBox
              user={user}
              caption={caption}
              onChangeCaption={setCaption}
              previewImg={previewImg}
              onPickImage={handlePickImage}
              onClearImage={() => {
                setPreviewImg(null);
                setFileToUpload(null);
              }}
              onPost={handlePost}
              isPosting={isPosting}
            />
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 16,
                marginBottom: 12,
                padding: 14,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  marginRight: 12,
                }}
              >
                <Ionicons name="lock-closed-outline" size={16} color="#555" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                >
                  Chế độ xem
                </Text>
                <Text style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                  {readOnlyReason()}
                </Text>
              </View>
            </View>
          ))}
        {isLoadingList && moments.length === 0 && (
          <View style={{ paddingVertical: 64, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#D8C97B" />
          </View>
        )}
      </View>
    ),
    // ✅ caption, previewImg, isPosting, user được pass qua props xuống PostInputBox
    // useMemo vẫn update khi chúng thay đổi — nhưng PostInputBox là memo() nên
    // chỉ re-render nội bộ, không unmount → keyboard KHÔNG mất
    [
      activeTab,
      canPost,
      user,
      caption,
      previewImg,
      isPosting,
      isLoadingList,
      moments.length,
    ],
  );

  const listEmpty = useMemo(
    () =>
      !isLoadingList ? (
        <View
          style={{
            alignItems: "center",
            paddingTop: 64,
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              backgroundColor: "#111111",
              borderWidth: 1,
              borderColor: "rgba(216,201,123,0.25)",
            }}
          >
            <Ionicons name="camera-outline" size={32} color="#333" />
          </View>
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Chưa có moment nào
          </Text>
          <Text style={{ color: "#555", fontSize: 14, textAlign: "center" }}>
            {canPost
              ? "Hãy là người đầu tiên chia sẻ khoảnh khắc!"
              : "Chưa có moments nào cho sự kiện này."}
          </Text>
        </View>
      ) : null,
    [isLoadingList, canPost],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            backgroundColor: "#111111",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#D8C97B",
                marginRight: 6,
              }}
            />
            <Text
              style={{
                color: "#D8C97B",
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 2,
              }}
            >
              LIVE FEED
            </Text>
          </View>
          <Text
            style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
            numberOfLines={1}
          >
            {routeEventName || "Moments"}
          </Text>
        </View>

        {/* Tab toggle */}
        <View
          style={{
            flexDirection: "row",
            borderRadius: 16,
            padding: 2,
            backgroundColor: "#111111",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {(["ALL", "MINE"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: activeTab === tab ? "#D8C97B" : "transparent",
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: activeTab === tab ? "#0a0a0a" : "#555",
                }}
              >
                {tab === "ALL" ? "Tất cả" : "Của tôi"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

      <FlatList
        data={moments}
        keyExtractor={(item) => `moment-${item.id}`}
        renderItem={({ item }) => (
          <MomentCard
            item={item}
            isOwner={!!(user && user.id === item.userId)}
            onEdit={setEditingMoment}
            onDelete={handleDeleteRequest}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={() =>
          activeTab === "ALL" && hasMore && moments.length > 0 ? (
            <TouchableOpacity
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.25)",
              }}
              onPress={() => fetchMoments(false)}
            >
              <Text
                style={{ color: "#D8C97B", fontSize: 12, fontWeight: "700" }}
              >
                Tải thêm
              </Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D8C97B"
          />
        }
      />

      <EditModal
        visible={!!editingMoment}
        moment={editingMoment}
        onClose={() => setEditingMoment(null)}
        onSave={handleUpdate}
        isLoading={isUpdating}
      />
    </SafeAreaView>
  );
}
