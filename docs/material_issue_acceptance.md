# Nhân viên tiếp nhận phiếu xuất nguyên liệu — 28/10/2026

Người dùng yêu cầu quản lý lập phiếu gửi nhân viên và trừ tồn khi nhân viên tiếp nhận. Tận dụng UC15/UC23 cùng PhieuXuatKho, DatGiuTon, StockPosting và phân công đã có; không tạo trạng thái, bảng hoặc endpoint mới.

## Luồng

1. Quản lý có issues.allocate và issues.confirmAllocation chọn phiếu xưởng, kho, nhân viên, lô/vị trí/lượng rồi bấm Lập và gửi phiếu. Tạo/cập nhật phân bổ nguyên liệu và xác nhận giữ tồn trong một transaction/idempotency; nếu có phân công mới thì phân công cũng thuộc transaction đó. Trạng thái DA_XAC_NHAN hiển thị Chờ nhân viên tiếp nhận. Chỉ reserved/available thay đổi, on_hand không bị trừ.
2. Phiếu đã gửi được nhân viên đã phân công tại đúng kho nhìn thấy. Phiếu DA_PHAN_BO cũ vẫn có thao tác Gửi phiếu cho nhân viên dành cho quản lý. Không tự gửi hoặc tiếp nhận các phiếu đã tồn tại khi triển khai.
3. Nhân viên dùng issues.postMaterial bấm Tiếp nhận phiếu. Đây chính là POST /issues/{id}/post-material hiện hành với expectedVersion, expectedAllocationVersion, CSRF và Idempotency-Key. Kiểm lại actor/quyền/scope/phân công, khác người lập, trạng thái/version, hạn reservation, quota nguồn, lô/QC/FEFO/đơn vị/số lượng và khóa kiểm kê. Tiêu thụ reservation, trừ on_hand, tạo StockPosting/sổ và chuyển HOAN_THANH trong cùng transaction. Ghi thêm audit tiếp nhận với chính nhân viên và thời điểm; posted_at là thời điểm tiếp nhận/ghi sổ.
4. Nếu có lỗi, rollback toàn bộ; không lưu trạng thái đã tiếp nhận khi tồn chưa trừ. Gửi lại cùng idempotency key trả kết quả cũ; key khác trên phiếu hoàn tất bị chặn trạng thái/version; ràng buộc StockPosting và khóa phiếu chặn ghi sổ kép. Với nhiều người được giao, chỉ lần tiếp nhận hợp lệ đầu tiên hoàn tất; các người còn lại phải tải lại.

Reservation vẫn dùng TTL 120 phút/gia hạn một lần/hard 240 theo FS04. Phiếu hết hạn cần quản lý điều phối/gửi lại theo quy trình hiện có, không tiếp nhận bằng cách bỏ kiểm giữ tồn. Không thay luồng nhập kho hoặc xuất thành phẩm. Không sửa SRS/Domain, không migration/seed, không tự tiếp nhận phiếu thật. Không chạy unit/integration/E2E/regression; chỉ cú pháp/OpenAPI/build/health. DA_CODE_CHUA_TEST; cần người dùng kiểm tay và nghiệm thu.

## Kiểm tay khi được giao

- Quản lý lập/gửi: chỉ reserved tăng; nhân viên đúng phân công nhận được phiếu, người ngoài không xem/tiếp nhận được.
- Nhân viên tiếp nhận phiếu hợp lệ: đúng từng dòng lô/vị trí giảm on_hand, hold được tiêu thụ, có sổ/audit và phiếu hoàn tất.
- Bấm hai lần, retry cùng key, hai nhân viên cùng thao tác: mỗi phiếu chỉ có một StockPosting, tồn chỉ giảm một lần.
- Thiếu tồn, sai version/phân bổ, hết hạn, lô không đạt/hết hạn, sai FEFO, kiểm kê khóa hoặc đổi scope: giao dịch bị chặn/rollback, không mất tồn và không báo tiếp nhận thành công.
