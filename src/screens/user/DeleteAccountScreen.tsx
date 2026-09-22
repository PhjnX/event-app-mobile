import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { resetToLogin } from "../../store/slices/authSlice";
import { COLORS } from "../../constants/theme";
import { getApiErrorMessage } from "../../utils/apiError";
import { WEBIE_CONTACT } from "../../constants/contact";
import {
  xinMaXoaTaiKhoan,
  xacNhanXoaTaiKhoan,
  donDepPhienDaXoa,
  maHopLe,
} from "../../services/accountService";

/**
 * Màn xoá tài khoản.
 *
 * Google Play bắt buộc người dùng phải tự xoá được tài khoản ngay trong app.
 * Luồng hai bước giống bản web: cảnh báo hậu quả → nhập mã 6 số gửi qua email →
 * hỏi lại lần cuối → xoá. Tài khoản quản trị hệ thống không vào được màn này
 * (mục trong Hồ sơ đã ẩn, backend cũng chặn bằng lỗi 403).
 */

const HAU_QUA = [
  "Hồ sơ cá nhân, ảnh đại diện, số điện thoại và địa chỉ bị xoá khỏi hệ thống.",
  "Toàn bộ khoảnh khắc bạn đã đăng trong các sự kiện sẽ bị xoá.",
  "Vé của những sự kiện chưa kết thúc sẽ bị huỷ, bạn không vào cổng được nữa.",
  "Nếu bạn là ban tổ chức, tài khoản tổ chức sẽ bị khoá.",
  "Không thể hoàn tác sau khi xoá.",
];

const phutGiay = (giay: number) =>
  `${Math.floor(giay / 60)}:${String(giay % 60).padStart(2, "0")}`;

export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s: any) => s.auth);

  const [buoc, setBuoc] = useState<"canhBao" | "nhapMa">("canhBao");
  const [dangGui, setDangGui] = useState(false);
  const [otp, setOtp] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");
  const [conLaiGuiLai, setConLaiGuiLai] = useState(0);
  const [conLaiHetHan, setConLaiHetHan] = useState(0);
  const [hoiLanCuoi, setHoiLanCuoi] = useState(false);
  /** Bật khi lỗi thuộc loại người dùng tự xử lý không được, để mở lối liên hệ. */
  const [canHoTro, setCanHoTro] = useState(false);
  const oMa = useRef<TextInput>(null);

  useEffect(() => {
    if (conLaiGuiLai <= 0) return;
    const t = setInterval(() => setConLaiGuiLai((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [conLaiGuiLai]);

  useEffect(() => {
    if (conLaiHetHan <= 0) return;
    const t = setInterval(() => setConLaiHetHan((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [conLaiHetHan]);

  const daHetHan = buoc === "nhapMa" && conLaiHetHan === 0;

  const xinMa = async (guiLai = false) => {
    setLoi("");
    setDangGui(true);
    try {
      const res = await xinMaXoaTaiKhoan();
      setBuoc("nhapMa");
      setOtp("");
      setConLaiGuiLai(res?.resendAfterSeconds ?? 60);
      setConLaiHetHan(res?.expiresInSeconds ?? 600);
      Toast.show({
        type: "success",
        text1: "Đã gửi mã xác nhận",
        text2: res?.message || "Kiểm tra hộp thư của bạn.",
      });
      setTimeout(() => oMa.current?.focus(), 200);
    } catch (e: any) {
      // 409: còn sự kiện đang hoạt động (message liệt kê tên sự kiện)
      // 403: tài khoản quản trị · 429: xin mã quá nhanh
      setLoi(getApiErrorMessage(e, "Không gửi được mã xác nhận."));
      // Google Play đòi: nếu người dùng phải làm thêm bước gì trước khi xoá thì
      // phải nói rõ VÀ có kênh hỗ trợ. 409 (còn sự kiện chưa kết thúc) và 403
      // (tài khoản quản trị) là hai trường hợp họ tự xử lý không được.
      setCanHoTro([409, 403].includes(e?.response?.status));
      if (guiLai) setConLaiGuiLai(30);
    } finally {
      setDangGui(false);
    }
  };

  const xacNhan = async () => {
    setHoiLanCuoi(false);
    setLoi("");
    if (!maHopLe(otp)) {
      setLoi("Mã xác nhận gồm đúng 6 chữ số.");
      return;
    }
    setDangGui(true);
    try {
      const res = await xacNhanXoaTaiKhoan(otp, lyDo);
      await donDepPhienDaXoa();
      dispatch(resetToLogin());
      Toast.show({
        type: "success",
        text1: "Tài khoản đã được xoá",
        text2: res?.message || "Cảm ơn bạn đã sử dụng Webie EMS.",
      });
    } catch (e: any) {
      setLoi(getApiErrorMessage(e, "Không xoá được tài khoản."));
      // Nhập sai quá số lần cho phép thì mã bị huỷ, phải xin mã mới
      if (e?.response?.status === 429) {
        setBuoc("canhBao");
        setConLaiHetHan(0);
      }
    } finally {
      setDangGui(false);
    }
  };

  /** Thư soạn sẵn gửi bộ phận hỗ trợ, kèm email tài khoản và lý do hệ thống đưa ra. */
  const guiYeuCauHoTro = () => {
    const tieuDe = "Yêu cầu xoá tài khoản Webie EMS";
    const noiDung =
      "Tôi muốn xoá tài khoản Webie EMS của mình.\n\n" +
      `Email tài khoản: ${user?.email ?? ""}\n\n` +
      `Tôi không tự xoá được vì hệ thống báo:\n${loi}\n\n` +
      "Mong bộ phận hỗ trợ xử lý giúp. Xin cảm ơn.";
    Linking.openURL(
      `mailto:${WEBIE_CONTACT.email}?subject=${encodeURIComponent(
        tieuDe,
      )}&body=${encodeURIComponent(noiDung)}`,
    ).catch(() => {});
  };

  const hopLoi = loi ? (
    <View style={s.hopLoi}>
      <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
      <View style={{ flex: 1 }}>
        <Text style={s.chuLoi}>{loi}</Text>

        {canHoTro && (
          <TouchableOpacity
            onPress={guiYeuCauHoTro}
            style={s.nutHoTro}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={14} color={COLORS.primary} />
            <Text style={s.chuHoTro}>Gửi yêu cầu hỗ trợ xoá tài khoản</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <View style={s.dauTrang}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.nutQuayLai}
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={s.tieuDeTrang}>Xoá tài khoản</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.theTaiKhoan}>
            <Text style={s.nhanNho}>TÀI KHOẢN</Text>
            <Text style={s.tenTaiKhoan}>{user?.username || "Tài khoản của bạn"}</Text>
            <Text style={s.emailTaiKhoan}>{user?.email}</Text>
          </View>

          {buoc === "canhBao" ? (
            <>
              <View style={s.theCanhBao}>
                <View style={s.hangTieuDe}>
                  <Ionicons name="warning-outline" size={18} color="#ef4444" />
                  <Text style={s.tieuDeCanhBao}>Những gì sẽ xảy ra</Text>
                </View>
                {HAU_QUA.map((h) => (
                  <View key={h} style={s.dongGach}>
                    <View style={s.chamDo} />
                    <Text style={s.chuGach}>{h}</Text>
                  </View>
                ))}
              </View>

              {hopLoi}

              <TouchableOpacity
                disabled={dangGui}
                onPress={() => xinMa()}
                activeOpacity={0.85}
                style={[s.nutDo, dangGui && { opacity: 0.6 }]}
              >
                {dangGui ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.chuNutDo}>Tiếp tục xoá tài khoản</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
                style={s.nutVien}
              >
                <Text style={s.chuNutVien}>Giữ tài khoản</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.theMa}>
                <Ionicons name="mail-open-outline" size={18} color={COLORS.primary} />
                <Text style={s.chuMa}>
                  Mã 6 chữ số đã gửi tới{" "}
                  <Text style={{ color: "#fff" }}>{user?.email}</Text>.{" "}
                  {conLaiHetHan > 0 ? (
                    `Mã hết hạn sau ${phutGiay(conLaiHetHan)}.`
                  ) : (
                    <Text style={{ color: "#ef4444" }}>
                      Mã đã hết hạn, bấm “Gửi lại mã”.
                    </Text>
                  )}
                </Text>
              </View>

              <Text style={s.nhanO}>MÃ XÁC NHẬN</Text>
              <TextInput
                ref={oMa}
                value={otp}
                onChangeText={(t) => {
                  setOtp(t.replace(/\D/g, "").slice(0, 6));
                  setLoi("");
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor="#3a3a3a"
                style={s.oMa}
              />

              {hopLoi}

              <Text style={[s.nhanO, { marginTop: 18 }]}>
                LÝ DO RỜI ĐI (KHÔNG BẮT BUỘC)
              </Text>
              <TextInput
                value={lyDo}
                onChangeText={(t) => setLyDo(t.slice(0, 500))}
                multiline
                placeholder="Chia sẻ giúp chúng tôi cải thiện dịch vụ…"
                placeholderTextColor="#3a3a3a"
                style={s.oLyDo}
              />
              <Text style={s.demChu}>{lyDo.length}/500</Text>

              <View style={s.hangGuiLai}>
                <TouchableOpacity
                  disabled={conLaiGuiLai > 0 || dangGui}
                  onPress={() => xinMa(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: conLaiGuiLai > 0 ? "#555" : COLORS.primary,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {conLaiGuiLai > 0
                      ? `Gửi lại mã sau ${conLaiGuiLai}s`
                      : "Gửi lại mã"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setBuoc("canhBao");
                    setLoi("");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#888", fontSize: 13 }}>Huỷ</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                disabled={dangGui || !maHopLe(otp) || daHetHan}
                onPress={() => setHoiLanCuoi(true)}
                activeOpacity={0.85}
                style={[
                  s.nutDo,
                  (dangGui || !maHopLe(otp) || daHetHan) && { opacity: 0.45 },
                ]}
              >
                {dangGui ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.chuNutDo}>Xoá vĩnh viễn tài khoản</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={hoiLanCuoi} transparent animationType="fade" onRequestClose={() => setHoiLanCuoi(false)}>
        <Pressable style={s.nenModal} onPress={() => setHoiLanCuoi(false)}>
          <Pressable style={s.theModal} onPress={() => {}}>
            <Text style={s.tieuDeModal}>Xoá tài khoản vĩnh viễn?</Text>
            <Text style={s.chuModal}>
              Sau bước này, hồ sơ và khoảnh khắc của bạn bị xoá, vé chưa dùng bị
              huỷ. Thao tác không thể hoàn tác.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setHoiLanCuoi(false)}
                activeOpacity={0.8}
                style={[s.nutModal, { backgroundColor: "rgba(255,255,255,0.08)" }]}
              >
                <Text style={{ color: "#ddd", fontWeight: "700" }}>
                  Không, giữ lại
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={xacNhan}
                activeOpacity={0.85}
                style={[s.nutModal, { backgroundColor: "#ef4444" }]}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  Xoá vĩnh viễn
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = {
  dauTrang: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nutQuayLai: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  tieuDeTrang: { color: "#fff", fontSize: 18, fontWeight: "800" as const },
  theTaiKhoan: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 18,
  },
  nhanNho: {
    color: "#777",
    fontSize: 10.5,
    fontWeight: "800" as const,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  tenTaiKhoan: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  emailTaiKhoan: { color: "#888", fontSize: 13, marginTop: 2 },
  theCanhBao: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.07)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  hangTieuDe: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  tieuDeCanhBao: { color: "#fca5a5", fontSize: 15, fontWeight: "800" as const },
  dongGach: { flexDirection: "row" as const, marginBottom: 9 },
  chamDo: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ef4444",
    marginTop: 8,
    marginRight: 10,
  },
  chuGach: { color: "#ddd", fontSize: 14, lineHeight: 21, flex: 1 },
  nutHoTro: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(239,68,68,0.2)",
  },
  chuHoTro: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  hopLoi: {
    flexDirection: "row" as const,
    gap: 8,
    alignItems: "flex-start" as const,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    marginTop: 14,
  },
  chuLoi: { color: "#fca5a5", fontSize: 13.5, lineHeight: 20, flex: 1 },
  nutDo: {
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center" as const,
    backgroundColor: "#ef4444",
  },
  chuNutDo: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  nutVien: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  chuNutVien: { color: "#ddd", fontSize: 15, fontWeight: "700" as const },
  theMa: {
    flexDirection: "row" as const,
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(216,201,123,0.07)",
    borderWidth: 1,
    borderColor: "rgba(216,201,123,0.25)",
    marginBottom: 18,
  },
  chuMa: { color: "#ccc", fontSize: 13.5, lineHeight: 20, flex: 1 },
  nhanO: {
    color: "#777",
    fontSize: 10.5,
    fontWeight: "800" as const,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  oMa: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 24,
    letterSpacing: 10,
    textAlign: "center" as const,
    fontWeight: "700" as const,
  },
  oLyDo: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 92,
    textAlignVertical: "top" as const,
  },
  demChu: { color: "#555", fontSize: 11, textAlign: "right" as const, marginTop: 4 },
  hangGuiLai: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 16,
  },
  nenModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 24,
  },
  theModal: {
    width: "100%" as const,
    backgroundColor: "#181818",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tieuDeModal: { color: "#fff", fontSize: 18, fontWeight: "800" as const },
  chuModal: { color: "#999", fontSize: 14, lineHeight: 21, marginTop: 8 },
  nutModal: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center" as const,
  },
};
