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
  ScrollView,
  Pressable,
  Animated,
  Easing,
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
import { COMMUNITY_GUIDELINES } from "../../constants/moderation";
import {
  reportMoment,
  blockUser,
  getBlockedUsers,
  getCachedBlockedUsers,
  addBlockedUserLocally,
  getHiddenMomentIds,
  hideMomentLocally,
  hasAcceptedCurrentPolicy,
  syncPolicyAcceptance,
  acceptContentPolicy,
} from "../../services/moderationService";
import ReportSheet from "../../components/moments/ReportSheet";
import { Skeleton } from "../../components/common/Skeleton";
import type { Moment, ReportReason } from "../../models/moment";
import Toast from "react-native-toast-message";
import { COLORS } from "../../constants/theme";
import { formatPostedTime } from "../../utils/datetime";

const { width } = Dimensions.get("window");

/**
 * Bóc chuỗi URL từ phản hồi của POST /images/upload.
 *
 * Interceptor trong apiService đã trả thẳng `response.data`, nên `res` chính là
 * payload — không còn lớp `res.data` của axios. Backend lại trả vài dạng khác
 * nhau tuỳ endpoint, nên thử lần lượt và bắt buộc kết quả phải là string: gán
 * nhầm cả object vào imageUrl sẽ khiến server trả lỗi
 * "Cannot deserialize value of type java.lang.String from Object value".
 */
const extractUploadedUrl = (res: any): string => {
  const candidates = [
    res,
    res?.url,
    res?.data,
    res?.data?.url,
    res?.file?.url,
    res?.result?.url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return "";
};

const WS_BASE =
  (
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://event-app-y77p.onrender.com/api"
  ).replace(/\/api$/, "") + "/ws";

interface WSPayload {
  type: "CREATE" | "UPDATE" | "DELETE" | string;
  data: any;
}

// ─── Moment Card ──────────────────────────────────────────────────────────────
/**
 * Tỉ lệ khung ảnh theo đúng ảnh gốc, kẹp trong khoảng dọc 4:5 tới ngang
 * 1.91:1 (cùng giới hạn với Instagram) để một ảnh quá dài không chiếm hết màn
 * hình. Trước đây mọi ảnh bị cắt cứng về 4:3: ảnh chụp dọc — kiểu phổ biến
 * nhất khi chụp bằng điện thoại ở sự kiện — mất gần nửa khung hình.
 */
const kepTiLe = (w?: number, h?: number) => {
  if (!w || !h) return 1;
  return Math.min(1.91, Math.max(0.8, w / h));
};

// Nhớ tỉ lệ của ảnh đã tải, để khi cuộn đi rồi quay lại thẻ không bị nhảy
// từ khung vuông sang khung thật thêm lần nữa.
const tiLeDaBiet = new Map<string, number>();

const MomentCard = memo(
  ({
    item,
    isOwner,
    onOpenMenu,
  }: {
    item: Moment;
    isOwner: boolean;
    onOpenMenu: (m: Moment) => void;
  }) => {
    const underReview = item.status === "UNDER_REVIEW";
    const [tiLe, setTiLe] = useState(
      () => (item.imageUrl && tiLeDaBiet.get(item.imageUrl)) || 1,
    );

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 18,
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: "#111111",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Đầu thẻ */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: 14,
            paddingRight: 4,
            paddingVertical: 12,
          }}
        >
          {item.userAvatar ? (
            <Image
              source={{ uri: item.userAvatar }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                marginRight: 10,
                borderWidth: 1.5,
                borderColor: "rgba(216,201,123,0.3)",
              }}
            />
          ) : (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                marginRight: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(216,201,123,0.1)",
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.3)",
              }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
                {item.username?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
            >
              {item.username}
              {isOwner ? (
                <Text
                  style={{
                    color: COLORS.primary,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {"  · Bạn"}
                </Text>
              ) : null}
            </Text>
            <Text style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
              {formatPostedTime(item.postedAt) || item.timeAgo}
            </Text>
          </View>

          {/* Nút tuỳ chọn hiện với MỌI bài viết — bắt buộc theo chính sách UGC
              của Google Play: người xem phải luôn có cách báo cáo và chặn.
              Mở bảng tuỳ chọn trượt từ dưới lên thay cho menu thả xuống cũ:
              menu cũ nằm trong thẻ có overflow hidden nên với bài chỉ có chữ
              nó bị xén đáy, còn trên Android ảnh bên dưới vẽ đè lên nó. */}
          <TouchableOpacity
            onPress={() => onOpenMenu(item)}
            hitSlop={8}
            style={{ padding: 10 }}
            accessibilityLabel="Tuỳ chọn bài viết"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Bài của chính mình đang bị xem xét sau khi có báo cáo */}
        {isOwner && underReview && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 14,
              marginBottom: 12,
              padding: 10,
              borderRadius: 12,
              backgroundColor: "rgba(245,158,11,0.1)",
              borderWidth: 1,
              borderColor: "rgba(245,158,11,0.25)",
            }}
          >
            <Ionicons name="alert-circle-outline" size={15} color="#f59e0b" />
            <Text
              style={{
                flex: 1,
                color: "#f59e0b",
                fontSize: 11.5,
                marginLeft: 8,
                lineHeight: 17,
              }}
            >
              Bài viết đang được kiểm duyệt sau khi bị báo cáo. Người khác tạm
              thời không nhìn thấy.
            </Text>
          </View>
        )}

        {/* Ảnh trước, chú thích sau — ảnh là nội dung chính của một khoảnh khắc */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: "100%",
              aspectRatio: tiLe,
              backgroundColor: "#161616",
            }}
            resizeMode="cover"
            onLoad={(e: any) => {
              const src = e?.nativeEvent?.source;
              const r = kepTiLe(src?.width, src?.height);
              tiLeDaBiet.set(item.imageUrl!, r);
              if (r !== tiLe) setTiLe(r);
            }}
          />
        ) : null}

        {item.caption ? (
          <Text
            style={{
              color: "#ddd",
              fontSize: 14.5,
              lineHeight: 22,
              paddingHorizontal: 14,
              paddingTop: item.imageUrl ? 12 : 0,
              paddingBottom: 14,
            }}
          >
            {item.caption}
          </Text>
        ) : null}

        {/* Hàng biểu tượng thả tim / bình luận / lưu trước đây đã được bỏ:
            backend không có API nào cho ba việc này, nên chúng chỉ là hình vẽ,
            bấm vào không có gì xảy ra — người dùng tưởng app bị lỗi. */}
      </View>
    );
  },
);

/** Khung xám giữ chỗ trong lúc tải bài, cùng hình dáng với thẻ thật. */
const MomentCardSkeleton = () => (
  <View
    style={{
      marginHorizontal: 16,
      marginBottom: 18,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: "#111111",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
      <Skeleton width={38} height={38} radius={19} />
      <View style={{ marginLeft: 10 }}>
        <Skeleton width={120} height={12} />
        <Skeleton width={64} height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
    <Skeleton width="100%" height={260} radius={0} />
    <View style={{ padding: 14 }}>
      <Skeleton width="75%" height={12} />
    </View>
  </View>
);

/** Chấm xanh nhịp nhàng báo kết nối realtime đang mở. */
const ChamTrucTiep = () => {
  const nhip = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const vong = Animated.loop(
      Animated.sequence([
        Animated.timing(nhip, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(nhip, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    vong.start();
    return () => vong.stop();
  }, [nhip]);
  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#22c55e",
        opacity: nhip,
      }}
    />
  );
};

type HanhDong = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
};

/**
 * Bảng tuỳ chọn trượt từ dưới lên cho một bài viết. Chủ bài thấy Sửa/Xoá,
 * người khác thấy Ẩn/Báo cáo/Chặn.
 */
const MomentActionSheet = ({
  moment,
  isOwner,
  onClose,
  onEdit,
  onDelete,
  onReport,
  onBlock,
  onHide,
}: {
  moment: Moment | null;
  isOwner: boolean;
  onClose: () => void;
  onEdit: (m: Moment) => void;
  onDelete: (id: number) => void;
  onReport: (m: Moment) => void;
  onBlock: (m: Moment) => void;
  onHide: (m: Moment) => void;
}) => {
  if (!moment) return null;

  const hanhDong: HanhDong[] = isOwner
    ? [
        {
          icon: "create-outline",
          label: "Sửa chú thích",
          onPress: () => onEdit(moment),
        },
        {
          icon: "trash-outline",
          label: "Xoá bài viết",
          danger: true,
          onPress: () => onDelete(moment.id),
        },
      ]
    : [
        {
          icon: "eye-off-outline",
          label: "Ẩn bài viết này",
          hint: "Chỉ ẩn với bạn, có thể xem lại trong Hồ sơ",
          onPress: () => onHide(moment),
        },
        {
          icon: "flag-outline",
          label: "Báo cáo nội dung",
          hint: "Gửi cho quản trị viên xem xét",
          danger: true,
          onPress: () => onReport(moment),
        },
        {
          icon: "ban-outline",
          label: `Chặn ${moment.username || "người này"}`,
          hint: "Không thấy bài của người này nữa",
          danger: true,
          onPress: () => onBlock(moment),
        },
      ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
        onPress={onClose}
      >
        {/* Chặn chạm xuyên qua bảng làm đóng nhầm */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#181818",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.08)",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#333",
              alignSelf: "center",
              marginBottom: 12,
            }}
          />
          {hanhDong.map((h) => (
            <TouchableOpacity
              key={h.label}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                // Đợi bảng trượt xuống xong mới mở hộp thoại tiếp theo: iOS
                // không cho mở Modal mới khi Modal cũ còn đang đóng dở.
                setTimeout(h.onPress, 300);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: h.danger
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(255,255,255,0.06)",
                }}
              >
                <Ionicons
                  name={h.icon}
                  size={18}
                  color={h.danger ? "#ef4444" : "#e5e5e5"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: h.danger ? "#ef4444" : "#fff",
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  {h.label}
                </Text>
                {h.hint ? (
                  <Text style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                    {h.hint}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={{
              marginTop: 12,
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ color: "#bbb", fontSize: 14, fontWeight: "700" }}>
              Huỷ
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

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
                placeholderTextColor="#666"
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
                    backgroundColor: COLORS.primary,
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
    previewRatio,
    onPickImage,
    onClearImage,
    onPost,
    isPosting,
  }: {
    user: any;
    caption: string;
    onChangeCaption: (t: string) => void;
    previewImg: string | null;
    previewRatio: number;
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
                style={{ color: COLORS.primary, fontWeight: "700", fontSize: 16 }}
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
                  style={{ width: "100%", aspectRatio: previewRatio }}
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
                <Ionicons name="image-outline" size={17} color={COLORS.primary} />
                <Text
                  style={{
                    color: COLORS.primary,
                    fontSize: 12,
                    fontWeight: "700",
                    marginLeft: 6,
                  }}
                >
                  {previewImg ? "Đổi ảnh" : "Thêm ảnh"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: canSubmit ? COLORS.primary : "#1a1a1a",
                  borderWidth: 1,
                  borderColor: canSubmit ? COLORS.primary : "#333",
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
  const [previewRatio, setPreviewRatio] = useState(1);
  const [fileToUpload, setFileToUpload] = useState<any>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Kiểm duyệt nội dung (UGC policy) ───────────────────────────────────────
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [policyAccepted, setPolicyAccepted] = useState(true); // tránh nháy modal khi đang tải
  const [showPolicyGate, setShowPolicyGate] = useState(false);
  const [reportingMoment, setReportingMoment] = useState<Moment | null>(null);
  const [menuMoment, setMenuMoment] = useState<Moment | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  // GET /users/me nay đã trả `id` kiểu số, khớp MomentResponseDTO.userId. Chỉ
  // khi thông tin người dùng chưa có `id` (chưa tải xong /users/me) mới suy
  // ngược từ /moments/me như trước — mọi bài ở đó đều là của chính mình.
  const [myUserId, setMyUserId] = useState<number | null>(null);

  /**
   * Bài này có phải của người đang đăng nhập không.
   *
   * Quyết định hiện menu Sửa/Xoá hay Báo cáo/Chặn, và việc chủ bài có thấy bài
   * đang bị kiểm duyệt của mình hay không. Ưu tiên so bằng id số; chỉ khi chưa
   * suy ra được mới đối chiếu tên, vì tên hiển thị không đảm bảo duy nhất.
   */
  const isOwnMoment = useCallback(
    (m: Moment) => {
      // Ưu tiên id từ /users/me, rồi id suy ra từ /moments/me
      if (typeof user?.id === "number") return m.userId === user.id;
      if (myUserId != null) return m.userId === myUserId;
      return !!user?.username && m.username === user.username;
    },
    [myUserId, user],
  );

  const stompClient = useRef<Client | null>(null);
  // Kết nối realtime đang mở: bài mới của người khác tự hiện ra không cần kéo
  // làm mới. Chỉ khi đó mới hiện nhãn "Trực tiếp" ở đầu trang.
  const [wsConnected, setWsConnected] = useState(false);

  // Nạp trạng thái kiểm duyệt: cache cục bộ trước để UI có ngay, rồi đồng bộ server
  useEffect(() => {
    const loadModeration = async () => {
      setHiddenIds(await getHiddenMomentIds());
      // Người đã đồng ý quy tắc trên web thì không hỏi lại trên app
      setPolicyAccepted(
        await syncPolicyAcceptance(user?.contentPolicyAcceptedVersion),
      );
      if (typeof user?.id !== "number") {
        try {
          const mine: any = await momentApi.getMyMoments(eventId);
          const list = Array.isArray(mine) ? mine : (mine?.data?.content ?? []);
          if (typeof list?.[0]?.userId === "number") setMyUserId(list[0].userId);
        } catch {
          // chưa đăng bài nào thì không suy ra được, dùng nhánh dự phòng bên dưới
        }
      }
      const cached = await getCachedBlockedUsers();
      setBlockedIds(cached.map((u) => u.userId));
      try {
        const fresh = await getBlockedUsers();
        setBlockedIds(fresh.map((u) => u.userId));
      } catch {
        // giữ cache nếu endpoint chưa sẵn sàng
      }
    };
    loadModeration();
  }, []);

  // Thông tin người dùng có thể nạp xong sau khi màn hình đã mở, nên đồng bộ
  // lại trạng thái đồng ý quy tắc khi trường này thay đổi.
  useEffect(() => {
    const v = user?.contentPolicyAcceptedVersion;
    if (!v) return;
    syncPolicyAcceptance(v).then(setPolicyAccepted);
  }, [user?.contentPolicyAcceptedVersion]);

  useEffect(() => {
    if (!eventId) return;
    const connect = async () => {
      const token = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_BASE) as any,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          setWsConnected(true);
          client.subscribe(`/topic/event/${eventId}/moments`, (msg) => {
            if (msg.body) handleWsMessage(JSON.parse(msg.body));
          });
        },
      });
      client.onDisconnect = () => setWsConnected(false);
      client.onWebSocketClose = () => setWsConnected(false);
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
      Toast.show({
      type: "info",
      text1: "Thông báo",
      text2: "Cần cấp quyền truy cập thư viện ảnh!",
    });
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
      setPreviewRatio(kepTiLe(asset.width, asset.height));
      setFileToUpload(imageService.createImageFile(asset.uri, "moment.jpg"));
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !fileToUpload) {
      Toast.show({
      type: "info",
      text1: "Thông báo",
      text2: "Vui lòng nhập caption hoặc chọn ảnh!",
    });
      return;
    }
    // Bắt buộc đồng ý quy tắc cộng đồng trước lần đăng đầu tiên
    if (!policyAccepted) {
      setShowPolicyGate(true);
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
        imageUrl = extractUploadedUrl(res);
        if (!imageUrl) {
          console.error("Không đọc được URL ảnh từ phản hồi upload:", res);
          Toast.show({
      type: "error",
      text1: "Lỗi",
      text2: "Tải ảnh lên thất bại: không đọc được đường dẫn ảnh.",
    });
          setIsPosting(false);
          return;
        }
      }
      await momentApi.createMoment(eventId, { caption, imageUrl });
      setCaption("");
      setPreviewImg(null);
      setFileToUpload(null);
    } catch (e: any) {
      Toast.show({
      type: "error",
      text1: "Lỗi",
      text2: e?.response?.data?.message || "Đăng moment thất bại!",
    });
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
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: e?.response?.data?.message || "Xóa thất bại!",
            });
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
      Toast.show({
      type: "error",
      text1: "Lỗi",
      text2: e?.response?.data?.message || "Cập nhật thất bại!",
    });
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Handlers kiểm duyệt ────────────────────────────────────────────────────

  // Gửi báo cáo, sau đó ẩn bài ngay trên thiết bị của người báo cáo
  const handleSubmitReport = async (reason: ReportReason, detail: string) => {
    if (!reportingMoment) return;
    setIsReporting(true);
    try {
      await reportMoment(eventId, reportingMoment.id, { reason, detail });
    } catch (e: any) {
      // 409 = đã báo cáo trước đó; vẫn coi là thành công với người dùng
      const status = e?.response?.status;
      if (status && status !== 409) {
        setIsReporting(false);
        Toast.show({
      type: "error",
      text1: "Lỗi",
      text2: e?.response?.data?.message ||
            "Không gửi được báo cáo. Vui lòng thử lại.",
    });
        return;
      }
    }
    // Lưu kèm caption và tác giả để người dùng còn nhận ra bài nào khi muốn bỏ ẩn
    setHiddenIds(
      await hideMomentLocally(reportingMoment.id, {
        caption: reportingMoment.caption,
        username: reportingMoment.username,
        imageUrl: reportingMoment.imageUrl,
      }),
    );
    setIsReporting(false);
    setReportingMoment(null);
    Toast.show({
      type: "success",
      text1: "Đã gửi báo cáo",
      text2: "Cảm ơn bạn. Đội ngũ kiểm duyệt sẽ xem xét trong vòng 24 giờ. Bài viết đã được ẩn khỏi màn hình của bạn — muốn xem lại: Hồ sơ → Người đã chặn & bài đã ẩn.",
    });
  };

  // Chặn người dùng — ẩn toàn bộ nội dung của họ khỏi feed
  const handleBlock = (m: Moment) => {
    Alert.alert(
      "Chặn người dùng",
      `Chặn ${m.username}? Bạn sẽ không còn thấy bất kỳ moment nào của người này.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Chặn",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(m.userId);
            } catch {
              // vẫn chặn cục bộ để người dùng được bảo vệ ngay
            }
            await addBlockedUserLocally({
              userId: m.userId,
              username: m.username,
              avatarUrl: m.userAvatar,
            });
            setBlockedIds((prev) =>
              prev.includes(m.userId) ? prev : [...prev, m.userId],
            );
            Toast.show({
              type: "success",
              text1: "Đã chặn " + m.username,
              text2:
                "Bỏ chặn trong Hồ sơ › Người đã chặn & bài đã ẩn.",
            });
          },
        },
      ],
    );
  };

  // Ẩn một bài viết đơn lẻ, chỉ có tác dụng trên thiết bị này
  const handleHide = async (m: Moment) => {
    Toast.show({
      type: "success",
      text1: "Đã ẩn bài viết",
      text2: "Bài này sẽ không hiện với bạn nữa. Muốn xem lại: Hồ sơ → Người đã chặn & bài đã ẩn.",
    });
    setHiddenIds(
      await hideMomentLocally(m.id, {
        caption: m.caption,
        username: m.username,
        imageUrl: m.imageUrl,
      }),
    );
  };

  const handleAcceptPolicy = async () => {
    await acceptContentPolicy();
    setPolicyAccepted(true);
    setShowPolicyGate(false);
  };

  const readOnlyReason = () => {
    if (ticketStatus?.toUpperCase() === "CHECKED_IN")
      return "Vé đã được check-in, không thể đăng thêm.";
    return "Sự kiện đã kết thúc, bạn chỉ có thể xem lại moments.";
  };

  // Feed đã lọc theo kiểm duyệt:
  // - bỏ bài của người đã chặn
  // - bỏ bài người dùng đã báo cáo/ẩn trên thiết bị này
  // - bỏ bài đã bị admin gỡ
  // - bài đang bị xem xét chỉ chủ bài viết còn thấy (kèm nhãn cảnh báo)
  const visibleMoments = useMemo(
    () =>
      moments.filter((m) => {
        if (blockedIds.includes(m.userId)) return false;
        if (hiddenIds.includes(m.id)) return false;
        if (m.status === "REMOVED") return false;
        if (m.status === "UNDER_REVIEW" && !isOwnMoment(m)) return false;
        return true;
      }),
    [moments, blockedIds, hiddenIds, isOwnMoment],
  );

  // ✅ listHeader dùng useMemo — deps không bao gồm caption/previewImg/isPosting
  // PostInputBox nhận props và tự cập nhật mà không làm remount header
  const listHeader = useMemo(
    () => (
      <View style={{ paddingTop: 12 }}>
        {activeTab === "ALL" &&
          (canPost ? (
            <>
              <PostInputBox
                user={user}
                caption={caption}
                onChangeCaption={setCaption}
                previewImg={previewImg}
                previewRatio={previewRatio}
                onPickImage={handlePickImage}
                onClearImage={() => {
                  setPreviewImg(null);
                  setFileToUpload(null);
                }}
                onPost={handlePost}
                isPosting={isPosting}
              />
              {/* Nhắc quy tắc cộng đồng ngay tại điểm đăng bài */}
              <TouchableOpacity
                onPress={() => navigation.navigate("CommunityGuidelines")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 16,
                  marginBottom: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: "rgba(216,201,123,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.15)",
                }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text
                  style={{
                    flex: 1,
                    color: "#888",
                    fontSize: 11.5,
                    marginLeft: 8,
                    lineHeight: 17,
                  }}
                >
                  Không đăng nội dung phản cảm, bạo lực hay quấy rối.{" "}
                  <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                    Xem quy tắc cộng đồng
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
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
                <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  {readOnlyReason()}
                </Text>
              </View>
            </View>
          ))}
        {isLoadingList && visibleMoments.length === 0 && (
          <>
            <MomentCardSkeleton />
            <MomentCardSkeleton />
          </>
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
      previewRatio,
      isPosting,
      isLoadingList,
      visibleMoments.length,
      navigation,
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
      {/* Đầu trang.
          Trước đây có dòng "LIVE FEED" bằng tiếng Anh luôn hiện, kể cả khi sự
          kiện đã kết thúc từ lâu, trong khi tên sự kiện — thứ quan trọng nhất —
          bị hai nút Tất cả / Của tôi chen mất chỗ và cắt cụt. Giờ tên sự kiện
          có trọn một hàng; nhãn "Trực tiếp" chỉ hiện khi kết nối realtime thật
          sự đang mở. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 14,
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
          <Text
            style={{
              color: COLORS.primary,
              fontSize: 10.5,
              fontWeight: "800",
              letterSpacing: 1.8,
            }}
          >
            KHOẢNH KHẮC
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "900",
              letterSpacing: -0.3,
              marginTop: 2,
            }}
          >
            {routeEventName || "Sự kiện"}
          </Text>
        </View>

        {wsConnected && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: "rgba(34,197,94,0.1)",
              borderWidth: 1,
              borderColor: "rgba(34,197,94,0.25)",
            }}
          >
            <ChamTrucTiep />
            <Text
              style={{
                color: "#22c55e",
                fontSize: 11,
                fontWeight: "700",
                marginLeft: 6,
              }}
            >
              Trực tiếp
            </Text>
          </View>
        )}
      </View>

      {/* Hai tab chia đều, cùng kiểu với tab trên trang Khoảnh khắc */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 16,
          marginBottom: 4,
          padding: 4,
          borderRadius: 16,
          backgroundColor: "#111111",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {(["ALL", "MINE"] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: active ? COLORS.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: active ? "#0a0a0a" : "#888",
                }}
              >
                {tab === "ALL" ? "Tất cả" : "Của tôi"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={visibleMoments}
        keyExtractor={(item) => `moment-${item.id}`}
        renderItem={({ item }) => (
          <MomentCard
            item={item}
            isOwner={isOwnMoment(item)}
            onOpenMenu={setMenuMoment}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={() =>
          activeTab === "ALL" && hasMore && visibleMoments.length > 0 ? (
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
                style={{ color: COLORS.primary, fontSize: 12, fontWeight: "700" }}
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
            tintColor={COLORS.primary}
          />
        }
      />

      <MomentActionSheet
        moment={menuMoment}
        isOwner={!!menuMoment && isOwnMoment(menuMoment)}
        onClose={() => setMenuMoment(null)}
        onEdit={setEditingMoment}
        onDelete={handleDeleteRequest}
        onReport={setReportingMoment}
        onBlock={handleBlock}
        onHide={handleHide}
      />

      <EditModal
        visible={!!editingMoment}
        moment={editingMoment}
        onClose={() => setEditingMoment(null)}
        onSave={handleUpdate}
        isLoading={isUpdating}
      />

      <ReportSheet
        visible={!!reportingMoment}
        onClose={() => setReportingMoment(null)}
        onSubmit={handleSubmitReport}
        isSubmitting={isReporting}
      />

      {/* Cổng chấp nhận quy tắc cộng đồng — bắt buộc trước lần đăng đầu tiên */}
      <Modal visible={showPolicyGate} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.9)",
          }}
        >
          <View
            style={{
              maxHeight: "85%",
              backgroundColor: "#181818",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderTopColor: "rgba(216,201,123,0.25)",
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 24,
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
            <Text
              style={{
                color: "#fff",
                fontSize: 17,
                fontWeight: "800",
                marginBottom: 6,
              }}
            >
              Quy tắc cộng đồng
            </Text>
            <Text style={{ color: "#777", fontSize: 12.5, marginBottom: 16 }}>
              Trước khi đăng lần đầu, vui lòng đọc và đồng ý với các quy tắc sau.
            </Text>

            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            >
              {COMMUNITY_GUIDELINES.map((g, i) => (
                <View key={i} style={{ marginBottom: 14 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={COLORS.primary}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13.5,
                          fontWeight: "700",
                        }}
                      >
                        {g.heading}
                      </Text>
                      <Text
                        style={{
                          color: "#888",
                          fontSize: 12.5,
                          lineHeight: 19,
                          marginTop: 3,
                        }}
                      >
                        {g.body}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setShowPolicyGate(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                  marginRight: 10,
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  style={{ color: "#888", fontSize: 14, fontWeight: "700" }}
                >
                  Huỷ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAcceptPolicy}
                style={{
                  flex: 2,
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                  backgroundColor: COLORS.primary,
                }}
              >
                <Text
                  style={{
                    color: "#0a0a0a",
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  Tôi đồng ý
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
