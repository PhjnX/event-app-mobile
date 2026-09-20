import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/theme";
import {
  CHINH_SACH_QUYEN_RIENG_TU,
  EMAIL_QUYEN_RIENG_TU,
  LINK_CHINH_SACH_WEB,
  NGAY_CAP_NHAT_CHINH_SACH,
  TOM_TAT_CHINH_SACH,
  type MucChinhSach,
} from "../../constants/privacy";

/**
 * Màn chính sách quyền riêng tư — chỉ để đọc, mở từ Hồ sơ.
 *
 * Google Play yêu cầu người dùng đọc được chính sách ngay trong app, không phải
 * đi tìm ngoài web, nên toàn bộ văn bản nằm trong constants/privacy.ts và hiển
 * thị offline được. Vẫn để một link sang bản web cho ai muốn lưu hay gửi đi.
 */

const MucNoiDung = ({ muc }: { muc: MucChinhSach }) => (
  <View style={{ marginBottom: 26 }}>
    <Text
      style={{
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 10,
      }}
    >
      {muc.tieuDe}
    </Text>

    {!!muc.moDau && (
      <Text style={{ color: "#999", fontSize: 13.5, lineHeight: 22 }}>
        {muc.moDau}
      </Text>
    )}

    {!!muc.gachDau?.length && (
      <View style={{ marginTop: muc.moDau ? 10 : 0 }}>
        {muc.gachDau.map((d, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", marginBottom: 8, paddingRight: 4 }}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 13.5,
                lineHeight: 22,
                marginRight: 8,
              }}
            >
              •
            </Text>
            <Text
              style={{
                color: "#999",
                fontSize: 13.5,
                lineHeight: 22,
                flex: 1,
              }}
            >
              {!!d.nhan && (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {d.nhan}
                </Text>
              )}
              {d.noiDung}
            </Text>
          </View>
        ))}
      </View>
    )}

    {!!muc.ketThuc && (
      <Text
        style={{
          color: "#999",
          fontSize: 13.5,
          lineHeight: 22,
          marginTop: 10,
        }}
      >
        {muc.ketThuc}
      </Text>
    )}
  </View>
);

export default function PrivacyPolicyScreen() {
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
          Chính sách quyền riêng tư
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            borderLeftWidth: 2,
            borderLeftColor: COLORS.primary,
            paddingLeft: 14,
            marginBottom: 26,
          }}
        >
          <Text style={{ color: "#bbb", fontSize: 13.5, lineHeight: 22 }}>
            {TOM_TAT_CHINH_SACH}
          </Text>
        </View>

        {CHINH_SACH_QUYEN_RIENG_TU.map((m) => (
          <MucNoiDung key={m.tieuDe} muc={m} />
        ))}

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              `mailto:${EMAIL_QUYEN_RIENG_TU}?subject=Câu hỏi về quyền riêng tư`,
            )
          }
          style={{
            backgroundColor: "#111111",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 13.5, fontWeight: "700" }}>
              Liên hệ về quyền riêng tư
            </Text>
            <Text style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
              {EMAIL_QUYEN_RIENG_TU}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL(LINK_CHINH_SACH_WEB)}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#666", fontSize: 12 }}>
            Xem bản trên web · ems.webie.com.vn/privacy
          </Text>
        </TouchableOpacity>

        {/* Chính sách nào cũng phải ghi mốc thời gian để người đọc biết bản
            mình đang xem có còn hiệu lực không. */}
        <Text
          style={{
            color: "#555",
            fontSize: 11,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Cập nhật lần cuối: {NGAY_CAP_NHAT_CHINH_SACH}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
