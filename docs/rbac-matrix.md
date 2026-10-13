# MA TRẬN PHÂN QUYỀN VAI TRÒ & CHI NHÁNH (RBAC & MULTI-TENANCY MATRIX)

Hệ thống **Badminton Shop** áp dụng mô hình phân quyền kép: **Vai trò (Role-Based Access Control)** kết hợp **Phạm vi Chi nhánh (Branch-Scoped Tenancy)** thông qua định danh `X-Branch-Id`.

---

## 1. BẢNG MA TRẬN 4 VAI TRÒ × HÀNH ĐỘNG × PHẠM VI

| Nghiệp Vụ / Hành Động | ADMIN (Toàn Hệ Thống) | BRANCH_MANAGER (Quản Lý Chi Nhánh) | STAFF (Nhân Viên Quầy / Kho) | CUSTOMER (Khách Hàng) |
|:---|:---:|:---:|:---:|:---:|
| **Xem danh mục sản phẩm & tồn khả dụng** | Toàn bộ | Toàn bộ | Toàn bộ | Toàn bộ (Chỉ thấy số lượng, không thấy giá vốn) |
| **Đặt hàng online (Giao hàng / Nhận tại quầy)** | Có | Có | Có | Có |
| **Hủy đơn hàng PENDING / AWAITING_PAYMENT** | Toàn quyền | Tại chi nhánh phụ trách | Không (Chỉ xem) | Khách tự hủy trước khi PREPARING |
| **Hủy đơn hàng PREPARING / Đã thanh toán** | Toàn quyền | Duyệt hủy tại chi nhánh | Không | Yêu cầu hỗ trợ |
| **Xác nhận đối soát thanh toán VietQR** | Có | Có | Có (Tại quầy) | Không |
| **Hoàn tiền đơn hàng (Refund)** | Duyệt toàn hệ thống | Duyệt trong hạn mức chi nhánh | Không | Gửi yêu cầu |
| **Tạo lệnh điều chuyển hàng giữa kho** | Mọi chi nhánh | Chỉ từ chi nhánh được phân công | Không | Không |
| **Xuất kho điều chuyển (IN_TRANSIT — Trừ tồn)** | Có | Chi nhánh nguồn (R8) | Chi nhánh nguồn | Không |
| **Nhập kho điều chuyển (RECEIVE / Discrepancy)** | Có | Chi nhánh đích (R8) | Chi nhánh đích | Không |
| **Kiểm kê & Điều chỉnh tồn kho** | Toàn quyền | Tại chi nhánh phụ trách | Ghi nhận thực tế | Không |
| **Tạo hồ sơ thu mua vợt cũ (Checklist quầy)** | Có | Có | Có (Tại quầy chi nhánh) | Không (Chỉ mang vợt đến quầy) |
| **Tự duyệt giá thu mua vượt ±10% (R5)** | Có | Có (Bắt buộc lý do) | **BỊ TỪ CHỐI (R5)** | Không |
| **Thu mua vợt Hạng D / Nghi hàng giả (R6)** | **BỊ TỪ CHỐI (R6)** | **BỊ TỪ CHỐI (R6)** | **BỊ TỪ CHỐI (R6)** | Không |
| **Duyệt mở bán vợt cũ lên website (R7)** | Có | Có (Chỉ vợt chi nhánh mình) | **BỊ TỪ CHỐI (R7)** | Không |
| **Tiếp nhận kiểm định bảo hành** | Toàn quyền | KTV chi nhánh | KTV chi nhánh | Gửi yêu cầu qua Web |
| **Duyệt bồi thường 1 đổi 1 / Sửa chữa** | Có | Quản lý chi nhánh | Không | Không |
| **Từ chối bảo hành (Bắt buộc lý do bằng chứng)** | Có | Quản lý chi nhánh | Không | Nhận thông báo lý do |

---

## 2. QUY TẮC BẢO MẬT PHẠM VI (BRANCH SCOPING ENFORCEMENT)

1. **Header `X-Branch-Id`**:
   - Khi nhân viên thực hiện thao tác nghiệp vụ, frontend đính kèm `X-Branch-Id`.
   - Backend đối chiếu `X-Branch-Id` với bảng `identity_db.user_branches`. Nếu nhân viên không thuộc chi nhánh đó $\rightarrow$ Trả về HTTP `403 Forbidden` ngay lập tức (Quy tắc R4).
2. **Ngăn chặn rò rỉ IDOR**:
   - Khách hàng tra cứu bảo hành bắt buộc truyền cặp `order_code` + `customer_phone` hoặc số `serial_number`. Hệ thống không cho phép duyệt tuần tự các mã đơn (IDOR Prevention).
