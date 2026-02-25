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
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAppSelector } from "../../hooks/useRedux";
import { momentApi } from "../../services/momentService";
import apiService from "../../services/apiService";

const COLORS = {
  primary: "#D8C97B",
  background: "#0a0a0a",
  backgroundCard: "#111111",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  cardBorder: "rgba(255,255,255,0.05)",
  error: "#ef4444",
};

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

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

export default function EventMomentsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId, eventName } = route.params || {};

  const { user } = useAppSelector((state) => state.auth);

  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "MINE">("ALL");

  // Post states
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Edit/Delete states
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (eventId) fetchMoments();
  }, [eventId, activeTab]);

  const fetchMoments = async () => {
    setIsLoading(true);
    try {
      let res: any;
      if (activeTab === "ALL") {
        res = await momentApi.getMoments(eventId);
      } else {
        res = await momentApi.getMyMoments(eventId);
      }

      const data = Array.isArray(res)
        ? res
        : res?.content || res?.data?.content || [];
      setMoments(data);
    } catch (error) {
      console.log("Error fetching moments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMoments();
    setRefreshing(false);
  }, [eventId, activeTab]);

  // Pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setPreviewUri(result.assets[0].uri);
    }
  };

  // Take photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setPreviewUri(result.assets[0].uri);
    }
  };

  // Post moment
  const handlePost = async () => {
    if (!caption.trim() && !selectedImage) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung hoặc chọn ảnh!");
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = "";

      // Upload image nếu có
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", {
          uri: selectedImage.uri,
          type: "image/jpeg",
          name: "moment.jpg",
        } as any);

        const uploadRes: any = await apiService.post(
          "/images/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        imageUrl = uploadRes?.url || uploadRes?.data || uploadRes || "";
      }

      // Create moment
      await momentApi.createMoment(eventId, { caption, imageUrl });

      Alert.alert("Thành công", "Đã đăng moment!");
      setCaption("");
      setSelectedImage(null);
      setPreviewUri(null);
      fetchMoments();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Đăng moment thất bại!",
      );
    } finally {
      setIsPosting(false);
    }
  };

  // Delete moment
  const handleDelete = (momentId: number) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa moment này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await momentApi.deleteMoment(eventId, momentId);
            Alert.alert("Thành công", "Đã xóa moment!");
            fetchMoments();
          } catch (error) {
            Alert.alert("Lỗi", "Xóa moment thất bại!");
          }
        },
      },
    ]);
  };

  // Edit moment
  const openEditModal = (moment: Moment) => {
    setEditingMoment(moment);
    setEditCaption(moment.caption);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingMoment) return;

    try {
      await momentApi.updateMoment(eventId, editingMoment.id, {
        caption: editCaption,
        imageUrl: editingMoment.imageUrl || "",
      });
      Alert.alert("Thành công", "Đã cập nhật moment!");
      setShowEditModal(false);
      setEditingMoment(null);
      fetchMoments();
    } catch (error) {
      Alert.alert("Lỗi", "Cập nhật thất bại!");
    }
  };

  // Render moment card
  const renderMomentCard = ({ item }: { item: Moment }) => {
    const isOwner = user?.id === item.userId;

    return (
      <View style={styles.momentCard}>
        {/* Header */}
        <View style={styles.momentHeader}>
          <Image
            source={{
              uri:
                item.userAvatar ||
                "https://placehold.co/40x40/1a1a1a/666666?text=U",
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeAgo}>
              {item.timeAgo || formatTimeAgo(item.postedAt)}
            </Text>
          </View>

          {isOwner && (
            <View style={styles.menuButtons}>
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={styles.menuBtn}
              >
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.menuBtn}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Image */}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.momentImage}
            resizeMode="cover"
          />
        )}

        {/* Caption */}
        {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
      </View>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Moments</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {eventName}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["ALL", "MINE"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "ALL" ? "Tất cả" : "Của tôi"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post Input */}
      {user && (
        <View style={styles.postContainer}>
          <View style={styles.postInputRow}>
            <Image
              source={{
                uri:
                  user.avatarUrl ||
                  "https://placehold.co/40x40/1a1a1a/666666?text=U",
              }}
              style={styles.postAvatar}
            />
            <TextInput
              style={styles.postInput}
              placeholder="Chia sẻ khoảnh khắc của bạn..."
              placeholderTextColor={COLORS.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
            />
          </View>

          {/* Preview Image */}
          {previewUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removePreview}
                onPress={() => {
                  setSelectedImage(null);
                  setPreviewUri(null);
                }}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <View style={styles.postActions}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaBtn} onPress={takePhoto}>
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.postButton,
                !caption && !selectedImage && styles.postButtonDisabled,
              ]}
              onPress={handlePost}
              disabled={isPosting || (!caption && !selectedImage)}
            >
              {isPosting ? (
                <ActivityIndicator color={COLORS.background} size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={14} color={COLORS.background} />
                  <Text style={styles.postButtonText}>Đăng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Moments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={moments}
          renderItem={renderMomentCard}
          keyExtractor={(item) => `moment-${item.id}`}
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
                name="images-outline"
                size={60}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>Chưa có moment nào</Text>
              <Text style={styles.emptyText}>
                Hãy là người đầu tiên chia sẻ!
              </Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa moment</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {editingMoment?.imageUrl && (
              <Image
                source={{ uri: editingMoment.imageUrl }}
                style={styles.editImage}
              />
            )}

            <TextInput
              style={styles.editInput}
              value={editCaption}
              onChangeText={setEditCaption}
              multiline
              placeholder="Nhập nội dung..."
              placeholderTextColor={COLORS.textMuted}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  tabs: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 10 },
  tab: { marginRight: 20, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: COLORS.text },

  // Post Input
  postContainer: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  postInputRow: { flexDirection: "row", alignItems: "flex-start" },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  postInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
  },
  previewContainer: { marginTop: 12, position: "relative" },
  previewImage: { width: "100%", height: 150, borderRadius: 12 },
  removePreview: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  mediaButtons: { flexDirection: "row" },
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(216,201,123,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonDisabled: { backgroundColor: COLORS.textMuted, opacity: 0.5 },
  postButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Moment Card
  momentCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  momentHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userInfo: { flex: 1 },
  username: { color: COLORS.text, fontSize: 14, fontWeight: "bold" },
  timeAgo: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  menuButtons: { flexDirection: "row" },
  menuBtn: { padding: 8 },
  momentImage: { width: "100%", height: 250 },
  caption: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    padding: 14,
    paddingTop: 10,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },
  editImage: { width: "100%", height: 150, borderRadius: 12, marginBottom: 16 },
  editInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "bold",
  },
});
