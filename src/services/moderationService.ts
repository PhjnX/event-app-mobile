import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "./apiService";
import { MODERATION_KEYS, CONTENT_POLICY_VERSION } from "../constants/moderation";
import type { BlockedUser, HiddenMoment, ReportReason } from "../models/moment";

/**
 * Dịch vụ kiểm duyệt nội dung do người dùng tạo (Moments).
 *
 * Bắt buộc theo chính sách UGC của Google Play:
 * - Báo cáo nội dung phản cảm ngay trong app
 * - Chặn người dùng khác
 * - Ẩn nội dung đã báo cáo/chặn khỏi thiết bị người dùng ngay lập tức
 *
 * Backend (Spring) cần cung cấp các endpoint tương ứng — xem docs/MODERATION_API.md.
 * Mọi thao tác đều có lớp cache cục bộ để UI phản hồi tức thì kể cả khi server
 * chưa kịp đồng bộ.
 */

// ─── Báo cáo moment ───────────────────────────────────────────────────────────
export const reportMoment = (
  eventId: number | string,
  momentId: number | string,
  payload: { reason: ReportReason; detail?: string },
) => {
  return apiService.post(
    `/events/${eventId}/moments/${momentId}/report`,
    payload,
  );
};

// ─── Chặn / bỏ chặn người dùng ────────────────────────────────────────────────
export const blockUser = (userId: number | string) => {
  return apiService.post(`/users/${userId}/block`);
};

export const unblockUser = (userId: number | string) => {
  return apiService.delete(`/users/${userId}/block`);
};

export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const res: any = await apiService.get(`/users/me/blocks`, {
    params: { page: 0, size: 100 },
  });
  // Backend có thể trả Page<T>, { data: Page<T> } hoặc mảng thuần
  const raw = res?.content ?? res?.data?.content ?? res;
  const list: BlockedUser[] = Array.isArray(raw) ? raw : [];
  await setCachedBlockedUsers(list);
  return list;
};

// ─── Chấp nhận quy tắc cộng đồng ──────────────────────────────────────────────
/**
 * Phiên bản quy tắc đang áp dụng. Mặc định lấy hằng số trong code, rồi cập nhật
 * theo GET /users/content-policy/version (công khai, không cần token). Nhờ vậy
 * khi backend nâng phiên bản quy tắc, người dùng được hỏi đồng ý lại mà không
 * phải phát hành bản app mới.
 */
let phienBanHienTai = CONTENT_POLICY_VERSION;
let dangLayPhienBan: Promise<string> | null = null;

/** Chỉ gọi server một lần mỗi phiên; lỗi mạng thì giữ phiên bản đang có. */
export const fetchCurrentPolicyVersion = (): Promise<string> => {
  if (!dangLayPhienBan) {
    dangLayPhienBan = apiService
      .get<any>(`/users/content-policy/version`)
      .then((res: any) => {
        const v = res?.currentVersion ?? res?.data?.currentVersion;
        if (typeof v === "string" && v.trim()) phienBanHienTai = v.trim();
        return phienBanHienTai;
      })
      .catch(() => {
        dangLayPhienBan = null; // lần sau thử lại
        return phienBanHienTai;
      });
  }
  return dangLayPhienBan;
};

// Gọi server best-effort; nguồn sự thật chính là AsyncStorage cục bộ.
export const acceptContentPolicy = async () => {
  const phienBan = await fetchCurrentPolicyVersion();
  await AsyncStorage.setItem(MODERATION_KEYS.POLICY_ACCEPTED, phienBan);
  try {
    await apiService.post(`/users/me/accept-content-policy`, {
      version: phienBan,
    });
  } catch {
    // Không chặn luồng nếu endpoint chưa sẵn sàng
  }
};

export const hasAcceptedCurrentPolicy = async (): Promise<boolean> => {
  const phienBan = await fetchCurrentPolicyVersion();
  const v = await AsyncStorage.getItem(MODERATION_KEYS.POLICY_ACCEPTED);
  return v === phienBan;
};

/**
 * Đồng bộ trạng thái đồng ý quy tắc từ server.
 *
 * GET /users/me trả `contentPolicyAcceptedVersion`. Nhờ đó người đã đồng ý
 * trên web không bị hỏi lại khi mở app, và ngược lại. Payload của /auth/signin
 * trả null nên phải lấy từ /users/me.
 */
export const syncPolicyAcceptance = async (
  serverVersion?: string | null,
): Promise<boolean> => {
  const phienBan = await fetchCurrentPolicyVersion();
  if (serverVersion && serverVersion === phienBan) {
    try {
      await AsyncStorage.setItem(MODERATION_KEYS.POLICY_ACCEPTED, serverVersion);
    } catch {
      /* bỏ qua */
    }
    return true;
  }
  return hasAcceptedCurrentPolicy();
};

// ─── Cache: moment ẩn cục bộ (sau khi báo cáo hoặc chọn "Ẩn") ──────────────────
/**
 * Bản đầu chỉ lưu mảng id thuần, nên không hiện ra được cho người dùng biết họ
 * đã ẩn bài nào để mà bỏ ẩn. Nay lưu kèm caption và tên tác giả. Dữ liệu cũ vẫn
 * đọc được — id thuần được nâng cấp tại chỗ, không mất gì.
 */
export const getHiddenMoments = async (): Promise<HiddenMoment[]> => {
  try {
    const raw = await AsyncStorage.getItem(MODERATION_KEYS.HIDDEN_MOMENTS);
    const parsed: unknown[] = raw ? JSON.parse(raw) : [];
    return parsed
      .map((x) => (typeof x === "number" ? { id: x } : (x as HiddenMoment)))
      .filter((x) => typeof x?.id === "number");
  } catch {
    return [];
  }
};

export const getHiddenMomentIds = async (): Promise<number[]> =>
  (await getHiddenMoments()).map((h) => h.id);

export const hideMomentLocally = async (
  momentId: number,
  meta?: Omit<HiddenMoment, "id" | "hiddenAt">,
): Promise<number[]> => {
  const list = await getHiddenMoments();
  if (!list.some((h) => h.id === momentId)) {
    list.push({ ...meta, id: momentId, hiddenAt: new Date().toISOString() });
    await AsyncStorage.setItem(
      MODERATION_KEYS.HIDDEN_MOMENTS,
      JSON.stringify(list),
    );
  }
  return list.map((h) => h.id);
};

/** Bỏ ẩn một bài đã ẩn trên thiết bị này. */
export const unhideMomentLocally = async (
  momentId: number,
): Promise<HiddenMoment[]> => {
  const next = (await getHiddenMoments()).filter((h) => h.id !== momentId);
  await AsyncStorage.setItem(
    MODERATION_KEYS.HIDDEN_MOMENTS,
    JSON.stringify(next),
  );
  return next;
};

// ─── Cache: danh sách người dùng bị chặn ──────────────────────────────────────
export const getCachedBlockedUsers = async (): Promise<BlockedUser[]> => {
  try {
    const raw = await AsyncStorage.getItem(MODERATION_KEYS.BLOCKED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setCachedBlockedUsers = async (list: BlockedUser[]) => {
  await AsyncStorage.setItem(
    MODERATION_KEYS.BLOCKED_USERS,
    JSON.stringify(list),
  );
};

export const addBlockedUserLocally = async (u: BlockedUser) => {
  const list = await getCachedBlockedUsers();
  if (!list.some((x) => x.userId === u.userId)) {
    list.push({ ...u, blockedAt: new Date().toISOString() });
    await setCachedBlockedUsers(list);
  }
  return list;
};

export const removeBlockedUserLocally = async (userId: number) => {
  const list = (await getCachedBlockedUsers()).filter(
    (x) => x.userId !== userId,
  );
  await setCachedBlockedUsers(list);
  return list;
};

export default {
  reportMoment,
  blockUser,
  unblockUser,
  getBlockedUsers,
  acceptContentPolicy,
  hasAcceptedCurrentPolicy,
  getHiddenMomentIds,
  hideMomentLocally,
  getCachedBlockedUsers,
  setCachedBlockedUsers,
  addBlockedUserLocally,
  removeBlockedUserLocally,
};
