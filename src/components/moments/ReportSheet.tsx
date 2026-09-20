import React, { memo, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { REPORT_REASONS } from "../../constants/moderation";
import type { ReportReason } from "../../models/moment";
import { COLORS } from "../../constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, detail: string) => Promise<void> | void;
  isSubmitting: boolean;
}

// Modal chọn lý do báo cáo một moment.
const ReportSheet = memo(
  ({ visible, onClose, onSubmit, isSubmitting }: Props) => {
    const [reason, setReason] = useState<ReportReason | null>(null);
    const [detail, setDetail] = useState("");

    useEffect(() => {
      if (!visible) {
        setReason(null);
        setDetail("");
      }
    }, [visible]);

    return (
      <Modal visible={visible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                maxHeight: "88%",
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

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}
                >
                  Báo cáo nội dung
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close-circle" size={26} color="#555" />
                </TouchableOpacity>
              </View>
              <Text
                style={{ color: "#777", fontSize: 12.5, marginBottom: 16 }}
              >
                Báo cáo của bạn ẩn danh với người đăng. Đội ngũ kiểm duyệt sẽ xem
                xét trong vòng 24 giờ.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {REPORT_REASONS.map((r) => {
                  const active = reason === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      onPress={() => setReason(r.value)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 16,
                        marginBottom: 8,
                        backgroundColor: active
                          ? "rgba(216,201,123,0.12)"
                          : "rgba(255,255,255,0.04)",
                        borderWidth: 1,
                        borderColor: active
                          ? "rgba(216,201,123,0.5)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <Ionicons
                        name={
                          active ? "radio-button-on" : "radio-button-off"
                        }
                        size={20}
                        color={active ? COLORS.primary : "#555"}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {r.label}
                        </Text>
                        <Text
                          style={{
                            color: "#777",
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {r.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TextInput
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.07)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: "#fff",
                    fontSize: 14,
                    minHeight: 90,
                    textAlignVertical: "top",
                    marginTop: 8,
                  }}
                  placeholder="Mô tả thêm (không bắt buộc)..."
                  placeholderTextColor="#3a3a3a"
                  value={detail}
                  onChangeText={setDetail}
                  maxLength={500}
                  multiline
                />
              </ScrollView>

              <TouchableOpacity
                onPress={() => reason && onSubmit(reason, detail.trim())}
                disabled={!reason || isSubmitting}
                style={{
                  marginTop: 16,
                  paddingVertical: 15,
                  borderRadius: 16,
                  alignItems: "center",
                  backgroundColor: reason ? "#ef4444" : "#2a2a2a",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: reason ? "#fff" : "#666",
                      fontSize: 14,
                      fontWeight: "800",
                    }}
                  >
                    Gửi báo cáo
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

export default ReportSheet;
