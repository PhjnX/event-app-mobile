import apiService from "./apiService";

/**
 * Ép caption và imageUrl về đúng chuỗi trước khi gửi lên.
 *
 * MomentRequestDTO khai cả hai là String. Nếu lỡ truyền vào một object — hay
 * gặp nhất là gán nguyên response của POST /images/upload thay vì bóc lấy URL —
 * backend trả 500 kèm "Cannot deserialize value of type java.lang.String from
 * Object value", một thông điệp chẳng chỉ ra trường nào sai. Chặn ngay tại đây
 * và nói rõ.
 */
const sanitizeMomentPayload = (data: {
  caption: string;
  imageUrl: string;
}): { caption: string; imageUrl: string } => {
  const bad = (Object.keys(data) as (keyof typeof data)[]).filter(
    (k) => data[k] != null && typeof data[k] !== "string",
  );
  if (bad.length) {
    console.error("Payload moment sai kiểu:", { data, truongSai: bad });
    throw new Error(
      `Dữ liệu gửi lên sai kiểu ở trường: ${bad.join(", ")}. Vui lòng thử lại.`,
    );
  }
  return { caption: data.caption ?? "", imageUrl: data.imageUrl ?? "" };
};

export const momentApi = {
  // Lấy tất cả moments của event (có phân trang)
  getMoments: (eventId: number | string, page = 0, size = 10) => {
    return apiService.get(`/events/${eventId}/moments`, {
      params: { page, size, sort: "postedAt,desc" },
    });
  },

  // Lấy moments của tôi trong event
  getMyMoments: (eventId: number | string) => {
    return apiService.get(`/events/${eventId}/moments/me`);
  },

  // Tạo moment mới
  createMoment: (
    eventId: number | string,
    data: { caption: string; imageUrl: string },
  ) => {
    return apiService.post(
      `/events/${eventId}/moments`,
      sanitizeMomentPayload(data),
    );
  },

  // Cập nhật moment
  updateMoment: (
    eventId: number | string,
    momentId: number | string,
    data: { caption: string; imageUrl: string },
  ) => {
    return apiService.put(
      `/events/${eventId}/moments/${momentId}`,
      sanitizeMomentPayload(data),
    );
  },

  // Xóa moment
  deleteMoment: (eventId: number | string, momentId: number | string) => {
    return apiService.delete(`/events/${eventId}/moments/${momentId}`);
  },
};

// Các thao tác kiểm duyệt (báo cáo, chặn) nằm ở services/moderationService.ts
