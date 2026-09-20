import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getBlockedUsers,
  getCachedBlockedUsers,
  unblockUser,
  removeBlockedUserLocally,
  getHiddenMoments,
  unhideMomentLocally,
} from "../../services/moderationService";
import type { BlockedUser, HiddenMoment } from "../../models/moment";
import { COLORS } from "../../constants/theme";

// Màn hình quản lý danh sách người dùng đã chặn. Mở từ Hồ sơ cá nhân.
export default function BlockedUsersScreen() {
  const navigation = useNavigation<any>();
  const [list, setList] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [hidden, setHidden] = useState<HiddenMoment[]>([]);

  const load = useCallback(async () => {
    setHidden(await getHiddenMoments());
    setList(await getCachedBlockedUsers());
    try {
      setList(await getBlockedUsers());
    } catch {
      // giữ nguyên cache nếu server lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = (u: BlockedUser) => {
    Alert.alert(
      "Bỏ chặn",
      `Bỏ chặn ${u.username}? Bạn sẽ thấy lại nội dung của người này.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Bỏ chặn",
          onPress: async () => {
            setBusyId(u.userId);
            try {
              await unblockUser(u.userId);
            } catch {
              // vẫn bỏ khỏi cache cục bộ
            }
            const next = await removeBlockedUserLocally(u.userId);
            setList(next);
            setBusyId(null);
          },
        },
      ],
    );
  };

  // Bài ẩn chỉ nằm trên máy này, bỏ ẩn không cần gọi server
  const handleUnhide = (m: HiddenMoment) => {
    Alert.alert(
      "Bỏ ẩn bài viết",
      "Bài viết sẽ hiện lại trong Moments. Việc này không rút lại báo cáo bạn đã gửi.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Bỏ ẩn",
          onPress: async () => setHidden(await unhideMomentLocally(m.id)),
        },
      ],
    );
  };

  const hiddenSection = (
    <View style={{ marginTop: 28 }}>
      <Text
        style={{
          color: "#8a8a8a",
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Bài viết đã ẩn
      </Text>
      <Text style={{ color: "#5a5a5a", fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
        Những bài bạn đã ẩn hoặc đã báo cáo. Danh sách chỉ lưu trên thiết bị này.
      </Text>

      {hidden.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            paddingVertical: 26,
            borderRadius: 16,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Ionicons name="eye-off-outline" size={22} color="#333" />
          <Text style={{ color: "#5a5a5a", fontSize: 13, marginTop: 8 }}>
            Bạn chưa ẩn bài viết nào.
          </Text>
        </View>
      ) : (
        hidden.map((m) => (
          <View
            key={`hidden-${m.id}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              marginBottom: 10,
              borderRadius: 16,
              backgroundColor: "#111111",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: "#0a0a0a",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                marginRight: 12,
              }}
            >
              {m.imageUrl ? (
                <Image
                  source={{ uri: m.imageUrl }}
                  style={{ width: "100%", height: "100%", opacity: 0.35 }}
                />
              ) : (
                <Ionicons name="eye-off-outline" size={18} color="#444" />
              )}
            </View>

            <View style={{ flex: 1, marginRight: 10 }}>
              <Text numberOfLines={1} style={{ color: "#ddd", fontSize: 13 }}>
                {m.caption?.trim() || "Bài viết chỉ có ảnh"}
              </Text>
              <Text numberOfLines={1} style={{ color: "#5a5a5a", fontSize: 11, marginTop: 2 }}>
                {m.username || `Bài #${m.id}`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleUnhide(m)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(216,201,123,0.45)",
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: "800" }}>
                BỎ ẨN
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      edges={["top"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
          Người đã chặn & bài đã ẩn
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => `blocked-${item.userId}`}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <Text
              style={{
                color: "#8a8a8a",
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Người dùng đã chặn
            </Text>
          }
          ListFooterComponent={hiddenSection}
          ListEmptyComponent={
            <View
              // Không dùng flex:1 ở đây: khối rỗng sẽ chiếm trọn màn hình và
              // đẩy mục "Bài viết đã ẩn" bên dưới xuống ngoài tầm nhìn.
              style={{
                alignItems: "center",
                paddingVertical: 28,
                paddingHorizontal: 40,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={40} color="#333" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 14,
                  textAlign: "center",
                }}
              >
                Bạn chưa chặn ai
              </Text>
              <Text
                style={{
                  color: "#555",
                  fontSize: 13,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Người bạn chặn sẽ không xuất hiện trong Moments và bạn sẽ không
                thấy nội dung của họ.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 16,
                marginBottom: 8,
                backgroundColor: "#111111",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              {item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatarUrl }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(216,201,123,0.1)",
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                    {item.username?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <Text
                style={{
                  flex: 1,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "600",
                  marginLeft: 12,
                }}
              >
                {item.username}
              </Text>
              <TouchableOpacity
                onPress={() => handleUnblock(item)}
                disabled={busyId === item.userId}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(216,201,123,0.4)",
                }}
              >
                {busyId === item.userId ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text
                    style={{
                      color: COLORS.primary,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    Bỏ chặn
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
