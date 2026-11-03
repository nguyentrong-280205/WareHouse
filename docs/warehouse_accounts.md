# Danh sách tài khoản — Docker `warehouse_db`

Liệt kê thật (truy vấn trực tiếp `TaiKhoan`/`VaiTroQuyen` trên container `migrate`, 03/11/2026), không phải suy ra từ code. **Không ghi mật khẩu trong file này** — đúng quy ước xuyên suốt dự án (mật khẩu chỉ nằm trong các file guide bị `.gitignore`/trong volume Docker, không bao giờ vào docs/log/source). Xem mục "Lấy mật khẩu" ở cuối.

Tổng 25 tài khoản, 10 role, không tài khoản `admin/support`.

## 1. Bộ demo ngắn gọn (9 tài khoản, dùng cho demo hằng ngày)

Mật khẩu chung hiện tại: xem `SIMPLE-demo-login.local.md` (vừa đổi 03/11/2026).

| Đăng nhập | Vai trò | Trạng thái |
|---|---|---|
| `khach01` | Khách hàng | ACTIVE |
| `kehoach01` | Bộ phận lập kế hoạch | ACTIVE |
| `muahang01` | Bộ phận mua hàng | ACTIVE |
| `giamdoc01` | Ban giám đốc | ACTIVE |
| `quanlykho01` | Quản lý kho / Bộ phận quản lý kho | ACTIVE |
| `nhanvienkho01` | Nhân viên kho | ACTIVE |
| `qc01` | Bộ phận QC | ACTIVE |
| `xuong01` | Xưởng sản xuất (quản lý chung cả 3 xưởng XSX002/003/004) | ACTIVE |
| `kiemke01` | Hội đồng kiểm kê | ACTIVE |

## 2. Bộ tài khoản `uc01.*` (gốc UC01, song song với bộ trên)

Mật khẩu riêng từng tài khoản (dài, ngẫu nhiên) — xem `UC01-demo-login.local.md` / `uc01-demo-credentials.json`. `uc01.staff` dùng mật khẩu chung với nhóm nhân viên kho ở mục 3.

| Đăng nhập | Vai trò | Trạng thái |
|---|---|---|
| `uc01.customer` | Khách hàng | ACTIVE |
| `uc01.customer2` | Khách hàng | ACTIVE |
| `uc01.planner` | Bộ phận lập kế hoạch | ACTIVE |
| `uc01.purchasing` | Bộ phận mua hàng | ACTIVE |
| `uc01.board` | Ban giám đốc | ACTIVE |
| `uc01.warehouse` | Quản lý kho / Bộ phận quản lý kho | ACTIVE |
| `uc01.staff` | Nhân viên kho | ACTIVE |
| `uc01.qc` | Bộ phận QC | ACTIVE |
| `uc01.workshop` | Xưởng sản xuất | **LOCKED** (khóa khi gộp về `xuong01`, 27/10) |
| `uc01.council` | Hội đồng kiểm kê | ACTIVE |

## 3. Nhân viên kho được đặt tên riêng (28/10/2026)

Mật khẩu chung (ngắn, 6 ký tự, đã duyệt riêng) — xem `WAREHOUSE-STAFF-logins.local.md`.

| Đăng nhập | Vai trò | Trạng thái |
|---|---|---|
| `nguyentrong` | Nhân viên kho (Nguyễn Trọng) | ACTIVE |
| `vuthinh` | Nhân viên kho (Vũ Thịnh) | ACTIVE |
| `truongthinh` | Nhân viên kho (Trường Thịnh) | ACTIVE |
| `uc01.staff` | Nhân viên kho | ACTIVE *(chung mật khẩu với nhóm này)* |
| `nhanvienkho01` | Nhân viên kho | ACTIVE *(đã đổi sang mật khẩu nhóm 1 ngày 03/11, không còn dùng mật khẩu nhóm này)* |

## 4. Tài khoản xưởng cũ — đã khóa, chỉ giữ lịch sử (27/10/2026)

Không đăng nhập được (status `LOCKED`). Gộp về `xuong01` ở mục 1.

| Đăng nhập | Vai trò | Trạng thái |
|---|---|---|
| `xuong_ngk` | Xưởng nước giải khát | LOCKED |
| `xuong_tra` | Xưởng trà và nước trái cây | LOCKED |
| `xuong_nuoc` | Xưởng nước tinh khiết | LOCKED |

## Lấy mật khẩu

Các file guide nêu trên nằm trong Docker volume `warehouse_demo_artifacts` (không có trên host, không trong Git). Xem bằng:

```sh
docker run --rm -v warehouse_demo_artifacts:/data alpine cat /data/SIMPLE-demo-login.local.md
docker run --rm -v warehouse_demo_artifacts:/data alpine cat /data/WAREHOUSE-STAFF-logins.local.md
docker run --rm -v warehouse_demo_artifacts:/data alpine cat /data/UC01-demo-login.local.md
```

Trên Windows/Git Bash cần thêm `MSYS_NO_PATHCONV=1` trước `docker run` để đường dẫn `/data/...` không bị tự dịch sang đường dẫn Windows.
