import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/theme";
import {
  COMMUNITY_GUIDELINES,
  MODERATION_CONTACT_EMAIL,
} from "../../constants/moderation";

// Màn hình quy tắc cộng đồng — chỉ để đọc. Mở từ Hồ sơ hoặc từ màn Moments.
export default function CommunityGuidelinesScreen() {
  const navigation = useNavigation<any>();

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
          Quy tắc cộng đồng
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: "#888",
            fontSize: 13,
            lineHeight: 21,
            marginBottom: 20,
          }}
        >
          Moments cho phép người tham gia sự kiện chia sẻ ảnh và khoảnh khắc với
          nhau. Để giữ không gian an toàn, mọi người dùng phải tuân thủ các quy
          tắc dưới đây. Nội dung vi phạm sẽ bị gỡ và tài khoản có thể bị khoá.
        </Text>

        {COMMUNITY_GUIDELINES.map((g, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "#111111",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(216,201,123,0.12)",
                  marginRight: 10,
                }}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 14.5,
                  fontWeight: "800",
                  flex: 1,
                }}
              >
                {g.heading}
              </Text>
            </View>
            <Text style={{ color: "#999", fontSize: 13, lineHeight: 21 }}>
              {g.body}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              `mailto:${MODERATION_CONTACT_EMAIL}?subject=Phản hồi về nội dung Moments`,
            )
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            padding: 16,
            borderRadius: 16,
            backgroundColor: "rgba(216,201,123,0.06)",
            borderWidth: 1,
            borderColor: "rgba(216,201,123,0.2)",
          }}
        >
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ color: "#fff", fontSize: 13.5, fontWeight: "700" }}
            >
              Liên hệ đội ngũ kiểm duyệt
            </Text>
            <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              {MODERATION_CONTACT_EMAIL}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#555" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
