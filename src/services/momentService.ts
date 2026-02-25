import apiService from "./apiService";

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
    return apiService.post(`/events/${eventId}/moments`, data);
  },

  // Cập nhật moment
  updateMoment: (
    eventId: number | string,
    momentId: number | string,
    data: { caption: string; imageUrl: string },
  ) => {
    return apiService.put(`/events/${eventId}/moments/${momentId}`, data);
  },

  // Xóa moment
  deleteMoment: (eventId: number | string, momentId: number | string) => {
    return apiService.delete(`/events/${eventId}/moments/${momentId}`);
  },
};
