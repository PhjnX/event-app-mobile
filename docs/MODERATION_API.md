# Moments — Moderation API (spec cho backend Spring)

Mobile đã code xong phía client. Backend cần bổ sung các endpoint dưới đây để hệ
thống hoạt động đầy đủ và app đạt yêu cầu **User Generated Content policy** của
Google Play.

Base URL: `https://event-app-y77p.onrender.com/api`
Tất cả endpoint yêu cầu header `Authorization: Bearer <token>`.

---

## Tổng hợp — 9 API mới, 2 API sửa, 2 bảng DB mới

| # | Method | Endpoint | Mục | Ưu tiên |
|---|--------|----------|-----|---------|
| 1 | `POST` | `/events/{eventId}/moments/{momentId}/report` | §1 | 🔴 Bắt buộc |
| 2 | `POST` | `/users/{userId}/block` | §2 | 🔴 Bắt buộc |
| 3 | `DELETE` | `/users/{userId}/block` | §2 | 🔴 Bắt buộc |
| 4 | `GET` | `/users/me/blocks` | §2 | 🔴 Bắt buộc |
| — | `GET` | `/events/{eventId}/moments` ⚙️ **sửa** | §3 | 🔴 Bắt buộc |
| — | `GET` | `/events/{eventId}/moments/me` ⚙️ **sửa** | §3 | 🔴 Bắt buộc |
| 5 | `GET` | `/admin/reports` | §5 | 🟡 Cho web admin |
| 6 | `POST` | `/admin/moments/{momentId}/remove` | §5 | 🟡 Cho web admin |
| 7 | `POST` | `/admin/moments/{momentId}/restore` | §5 | 🟡 Cho web admin |
| 8 | `POST` | `/admin/users/{userId}/suspend` | §5 | 🟡 Cho web admin |
| 9 | `POST` | `/users/me/accept-content-policy` | §4 | 🟢 Làm sau được |

Ngoài ra: WebSocket `/topic/event/{eventId}/moments` không đẩy moment
`UNDER_REVIEW`, và đẩy sự kiện `DELETE` khi admin gỡ bài (§3).

### Thay đổi database

**Bảng mới `moment_reports`**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | BIGINT PK | |
| `moment_id` | BIGINT FK | |
| `reporter_id` | BIGINT FK | UNIQUE cùng `moment_id` — chặn báo cáo trùng (§1) |
| `reason` | VARCHAR/ENUM | 8 giá trị, xem §1 |
| `detail` | VARCHAR(500) | nullable |
| `status` | VARCHAR | `PENDING` / `RESOLVED` / `DISMISSED` |
| `created_at` | TIMESTAMP | |
| `resolved_at` | TIMESTAMP | nullable |
| `resolved_by` | BIGINT FK | nullable, admin xử lý |

**Bảng mới `user_blocks`**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | BIGINT PK | |
| `blocker_id` | BIGINT FK | UNIQUE cùng `blocked_id` |
| `blocked_id` | BIGINT FK | |
| `created_at` | TIMESTAMP | |

**Sửa bảng có sẵn**

- `moments`: thêm cột `status VARCHAR DEFAULT 'VISIBLE'` (§3)
- `users`: thêm `content_policy_accepted_version`, `content_policy_accepted_at` (§4)
- `users`: thêm `moment_suspended_until TIMESTAMP` (§5, cho endpoint suspend)

---

## 1. Báo cáo một moment

```
POST /events/{eventId}/moments/{momentId}/report
```

**Body**

```json
{
  "reason": "SEXUAL_CONTENT",
  "detail": "Mô tả thêm, tối đa 500 ký tự (không bắt buộc)"
}
```

`reason` là enum:
`SEXUAL_CONTENT` | `NUDITY` | `VIOLENCE` | `HARASSMENT` | `HATE_SPEECH` | `SPAM` | `CSAE` | `OTHER`

**Response `200`**

```json
{ "id": 123, "status": "PENDING" }
```

**Quy tắc**

- Mỗi user chỉ báo cáo một moment một lần → lần thứ hai trả `409 Conflict`
  (client coi 409 là thành công, không báo lỗi cho người dùng).
- Không cho báo cáo moment của chính mình → `400`.
- Khi số **báo cáo từ những user khác nhau** đạt ngưỡng (đề xuất `>= 3`),
  hoặc khi `reason = CSAE` (chỉ cần **1** báo cáo), tự động đặt
  `moment.status = UNDER_REVIEW` và ẩn khỏi feed công khai ngay.
- Ghi log: người báo cáo, thời điểm, lý do — phục vụ khiếu nại.

---

## 2. Chặn / bỏ chặn người dùng

```
POST   /users/{userId}/block     -> 200 { "blockedUserId": 12 }
DELETE /users/{userId}/block     -> 204
GET    /users/me/blocks?page=0&size=100
```

**Response của `GET /users/me/blocks`** (Spring `Page`)

```json
{
  "content": [
    {
      "userId": 12,
      "username": "nguyenvana",
      "avatarUrl": "https://...",
      "blockedAt": "2026-09-03T10:00:00Z"
    }
  ],
  "last": true
}
```

**Quy tắc**

- Không cho tự chặn chính mình → `400`.
- Chặn là **một chiều** (A chặn B thì A không thấy B; B vẫn thấy A) — đủ theo
  yêu cầu của Google. Nếu muốn hai chiều thì lọc cả hai hướng ở mục 3.

---

## 3. Lọc feed theo kiểm duyệt (sửa endpoint đã có)

```
GET /events/{eventId}/moments?page=&size=&sort=postedAt,desc
GET /events/{eventId}/moments/me
```

Cần bổ sung **cả hai** thay đổi sau:

1. **Thêm field `status` vào MomentDTO**: `"VISIBLE" | "UNDER_REVIEW" | "REMOVED"`.
   Client coi thiếu field = `VISIBLE`.
2. **Loại khỏi kết quả**:
   - moment của user mà người gọi đã chặn;
   - moment có `status = REMOVED`;
   - moment có `status = UNDER_REVIEW` **trừ khi** người gọi là chủ bài viết
     (chủ bài viết vẫn thấy kèm nhãn "đang kiểm duyệt").

Client cũng lọc lại một lần nữa ở phía mobile để phòng trường hợp server chưa
kịp đồng bộ, nhưng **lọc phía server là bắt buộc** — nếu không, nội dung vi phạm
vẫn đi qua mạng tới thiết bị người dùng.

WebSocket `/topic/event/{eventId}/moments` cũng nên **không** đẩy `CREATE` của
moment `UNDER_REVIEW`, và nên đẩy sự kiện `DELETE` khi admin gỡ một moment.

---

## 4. Chấp nhận quy tắc cộng đồng

```
POST /users/me/accept-content-policy
Body: { "version": "1.0" }
-> 200
```

Lưu `contentPolicyAcceptedVersion` + `contentPolicyAcceptedAt` vào user, và trả
`contentPolicyAcceptedVersion` trong `GET /users/me`.

Client hiện lưu ở `AsyncStorage` và gọi endpoint này **best-effort** (lỗi không
chặn luồng đăng bài), nên có thể triển khai sau. Nhưng nên có để chứng minh với
Google là đã thu thập chấp thuận.

---

## 5. Công cụ cho admin (SADMIN)

Không thuộc app mobile, nhưng **Google sẽ hỏi** app xử lý báo cáo như thế nào.
Cần tối thiểu (web admin hoặc endpoint + Postman):

```
GET   /admin/reports?status=PENDING&page=&size=
      -> danh sách báo cáo kèm nội dung moment, người đăng, người báo cáo, lý do

POST  /admin/moments/{momentId}/remove
      Body: { "note": "lý do gỡ" }
      -> moment.status = REMOVED, đẩy WS DELETE, gửi thông báo cho chủ bài viết

POST  /admin/moments/{momentId}/restore
      -> moment.status = VISIBLE, đóng các report liên quan

POST  /admin/users/{userId}/suspend
      Body: { "days": 7, "reason": "..." }
      -> chặn user đăng moment mới trong khoảng thời gian đó
```

**Cam kết vận hành cần ghi trong Data safety / mô tả app**: mọi báo cáo được xem
xét trong vòng **24 giờ**.

---

## 6. Checklist trước khi nộp lên Google Play

Phía mobile (đã xong):

- [x] Nút … + **Báo cáo nội dung** trên mọi bài viết của người khác
- [x] **Chặn người dùng** ngay trong feed
- [x] **Ẩn bài viết** đơn lẻ trên thiết bị
- [x] Ẩn nội dung ngay sau khi báo cáo (không phải chờ server)
- [x] Màn **Quy tắc cộng đồng** + bắt buộc đồng ý trước lần đăng đầu tiên
- [x] Màn **Người dùng đã chặn** trong Hồ sơ, có bỏ chặn
- [x] Kênh liên hệ kiểm duyệt (email) trong Hồ sơ và trong Quy tắc cộng đồng
- [x] Xử lý trạng thái `UNDER_REVIEW` / `REMOVED`
- [x] Người dùng tự xoá nội dung của mình (đã có sẵn)

Phía backend (cần làm):

- [ ] Mục 1 — endpoint report + auto-hide theo ngưỡng
- [ ] Mục 2 — endpoint block/unblock/list
- [ ] Mục 3 — thêm `status` + lọc feed theo block/status
- [ ] Mục 4 — lưu chấp thuận quy tắc
- [ ] Mục 5 — công cụ admin xử lý báo cáo trong 24h

Ngoài code (làm trên Play Console):

- [ ] Điền phần **"App access"** và mục UGC trong bảng câu hỏi Content rating
- [ ] Cập nhật **Privacy Policy** có nêu rõ cơ chế kiểm duyệt UGC
- [ ] Nếu app cho phép người lạ tương tác: khai báo trong **Data safety**
