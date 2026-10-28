# Điều kiện xưởng lập phiếu cấp nguyên liệu — 28/10/2026

Lệnh người dùng: kế hoạch thiếu nguyên liệu chỉ được lập phiếu sau khi giám đốc duyệt kế hoạch và đơn mua bổ sung cho kế hoạch đó. Trước sửa, lookup plan-lines chỉ kiểm trạng thái KHSX nên cả kế hoạch thiếu chưa duyệt mua cũng xuất hiện, khác queue xưởng.

Quy tắc chung tại material-release-gate.js:

- KHSX phải DA_DUYET hoặc DANG_THUC_HIEN, giữ scope từng phân công.
- Nhu cầu đủ vật tư, không có thiếu đã ghi khi duyệt: không bắt buộc tạo đơn mua.
- Phần thiếu snapshot khi duyệt phải có phân bổ mua đã duyệt đủ lượng theo đúng demand_id, plan_id, material_id và unit_id. Chỉ tính PO DA_DUYET/NHAN_MOT_PHAN/HOAN_THANH có approver_id, không tính NHAP/CHO_DUYET/TU_CHOI/HUY. Không chỉ kiểm sự tồn tại một PO bất kỳ hoặc một PO mua thiếu một phần.
- Nếu hiện tại phát sinh thiếu, phần thiếu còn lại phải được bao phủ bởi lượng mua đã duyệt chưa nhận. Không dùng hàng đã nhận của PO cũ làm lời hứa mua lần nữa. Lượng DECIMAL so sánh bằng BigInt.
- Xét đủ điều kiện trên toàn kế hoạch; chỉ trả phân công thuộc scope xưởng. Dữ liệu đơn mua được dùng nội bộ, không trả thông tin NCC/giá của xưởng khác.

Áp dụng cùng gate cho lookup lập phiếu, queue/handoff xưởng, API create và submit trong transaction (đọc approval với HOLDLOCK). Lookup purpose=MATERIAL mặc định; purpose=PRODUCT giữ nguồn yêu cầu nhập thành phẩm để không chặn luồng ghi nhận sản xuất cũ. Purpose không bỏ qua gate tại API tạo/gửi yêu cầu cấp nguyên liệu.

PO được duyệt cho phép xưởng lập yêu cầu; không có nghĩa nguyên liệu đã nhập kho. Không thay đổi materialStatus thành đủ khi hàng chưa về. Giữ toàn bộ QC, reservation, FEFO, tồn thực, khóa kiểm kê và posting ở các bước kho. Không tự duyệt kế hoạch/PO hoặc nhập hàng, không thay dữ liệu cũ, không schema/migration.

Nháp cấp nguyên liệu cũ vẫn giữ để xem; nếu nguồn chưa đủ duyệt mua thì API chặn gửi nháp. Phiếu đã gửi/ghi sổ giữ nguyên lịch sử, không tự hủy hay sửa dữ liệu.

Kiểm chứng chỉ cú pháp, OpenAPI/build/health và đọc dữ liệu hiện hữu. Không chạy unit/integration/E2E/regression hoặc tạo/duyệt chứng từ thử. DA_CODE_CHUA_TEST. Kiểm tay: kế hoạch thiếu/PO nháp hoặc chờ duyệt không có ở nguồn cấp; sau duyệt đủ các PO liên quan thì xuất hiện; mua thiếu lượng hoặc sai demand không mở gate. Kế hoạch đủ vật tư vẫn lập bình thường. Gửi payload trực tiếp hoặc gửi nháp cũ trước duyệt mua phải bị MATERIAL_PURCHASE_APPROVAL_REQUIRED.

Kết quả đọc thực tế trước triển khai: xuong01 có nguồn MATERIAL duy nhất phân công 4 / kế hoạch 1 / TP002 (đủ vật tư). Phân công 5 / kế hoạch 2 / TP006 chưa đủ duyệt mua nên canRequest=false, không có trong lookup MATERIAL hoặc queue WORKSHOP. Lookup PRODUCT vẫn có cả hai nguồn như trước. Không thay trạng thái bất kỳ chứng từ nào để kiểm tra. Cú pháp 63 file frontend và các file backend sửa, validate OpenAPI, Docker build đạt.
