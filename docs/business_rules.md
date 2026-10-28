# Quy tắc nghiệp vụ và vòng đời — bản nháp

Hiện thực16/10/2026: các bất biến FS01–12 đã được nối vào service/repository và UI cho29UC, **DA_CODE_CHUA_TEST**, không thay nội dung SRS/Domain. [Bàn giao](full_system_handoff.md) nêu thao tác và giới hạn chưa kiểm. Điều kiện bảo quản NL khai báo phải khớp storageRule vị trí khi phân bổ/ghi sổ; không đổi rule vị trí trái với NL đang lưu. UC13 xác nhận không giữ sức chứa; snapshot không là lời hứa đủ chỗ ở lần ghi sổ sau. PO đủ lượng giao chuyển HOAN_THANH, lượng QC/lượng nhập theo nguồn riêng. Tồn theo kỳ dùng ledger, reservation chỉ công bố hiện tại; tỷ lệ chênh lệch trả numerator/denominator chính xác, FE hiển thị phần trăm tối đa4chữ số, không làm thay đổi lượng/tiền nghiệp vụ.

## Quyết định được xác nhận15/10/2026

FS01–FS12 [đã được người dùng duyệt nguyên văn](full_system_policy_approval.md). Áp dụng HALF_UP mỗi dòng khi xác nhận VND; giá bán SKU/đơn vị versioned; BOM hao hụt0% và CEILING cuối nhu cầu theo đơn vị; PO còn hiệu lực chỉ giảm cần mua, không là tồn cấp phát. Reservation120phút, gia hạn1lần tối đa120phút, hard240phút; không capacity hold UC13. Capacity KG/M3 tuyến tính, HSD hết ngày Việt Nam, FEFO/HSD→first_received_at→lot/location. Kiểm kê FROZEN_SCOPE lease60/hard240phút, quyền QLK/Hội đồng/BGĐ theo phiếu. Giao/nhận trả bởi NVKho, yêu cầu trả bởi KH đúng scope; hàng chưa rõ lô cách ly/xác minh, REWORK tạo đợt QC mới và không sửa kết luận gốc. Các CHUA_DUYET bên dưới cho đúng các điểm đã nêu nay là lịch sử; ngoại lệ ngoài phiếu vẫn không được mở. Các constants hiện có ở backend/src/shared/business-policy.js chưa là bằng chứng runtime/test.

Nguồn SRS 2.3 BR01–BR14, RULE01–RULE17, mục 8; README mục 4. Phạm vi 29 UC và điều phối không ghi tồn đã xác nhận; các policy chi tiết dưới đây **CHỜ DUYỆT**. Không thay SRS bằng giả định ngầm.

## Bất biến

1. Mọi balance = tổng ledger signed_delta của cùng lô/vị trí/bucket; opening balance cũng cần chứng từ seed/điều chỉnh hợp lệ ở DB test, không sửa số tồn form. Đối chiếu sau mỗi posting.
2. DAT/QUARANTINE/FAILED/EXPIRED là lượng theo bucket, không gán cả lô DAT khi QC chỉ đạt một phần. Lot hold hoặc expiry chặn mọi xuất DAT của lô; ngày hết hạn áp dụng D13.
3. Khả dụng = lượng DAT còn hạn, không hold, ở vị trí được phép − reservation tồn hiệu lực (bắt buộc UC15). Hàng chờ QC/hàng trả/cách ly/lỗi không khả dụng. Không trừ reservation hai lần khi fulfillment.
4. QC từng dòng: inspected=accepted+rejected, số không âm; inspected<=received; accepted_received<=accepted. Nhiều lần nhập khóa cùng quota để không nhập vượt. Kết luận chốt bất biến; thay đổi phải revision có audit và kiểm downstream.
5. Điều phối UC13/15 chỉ đổi phiếu dự thảo, dòng phân bổ, coordinator/version và audit; không thay on_hand/projection số còn lại lô/StockPosting/ledger; UC15 phải thay qty_reserved/available qua reservation trong transaction. Draft không được gọi là hàng đã nhập/xuất. UC13 reservation sức chứa CHUA_DUYET.
6. UC16/17/21/12/23 phải kiểm lại nguồn/phân bổ/QC/HSD/lock/capacity/tồn trong transaction. Phân bổ stale trả 409, phải điều phối lại. Posting từng phiếu atomic; phục vụ từng phần bằng nhiều phiếu cùng nguồn, không sửa phần posted.
7. FEFO: HSD tăng dần, tie first_received_at rồi id; FIFO nếu loại không có HSD. Hàng không đạt/hold/quá hạn không được chọn. Ngoại lệ FEFO có quyền/lý do/duyệt riêng, không cho ngoại lệ bán hàng lỗi/hết hạn.
8. Quy đổi snapshot theo phiên bản SKU/lô; kg/lít không đổi lẫn nhau khi thiếu density hợp lệ. Thành phẩm rời nguyên chai/lon. Không cộng tổng các chiều khác nhau; decimal không làm tròn trung gian.
9. Sức chứa theo cùng dimension (kg/m3/pallet-slot), gồm mọi hàng vật lý trong vị trí kể cả quarantine/chưa định danh; khóa position khi nhập đồng thời. Factor/rounding capacity cần D06 duyệt.
10. KHSX duyệt mới tạo request xuất NL/nhập TP. Định mức snapshot tại kế hoạch; nhu cầu mua trừ phần tồn phân bổ và PO còn hiệu lực theo D01, không biến PO chưa nhận thành tồn cấp phát.
11. Return phải gắn dòng giao/lô nguồn và tổng nhận không vượt lượng giao chưa trả. Không biết lô thì tiếp nhận cách ly chưa định danh, không tạo lô giả. Khi nhập lại đã ghi vật lý quarantine thì chuyển bucket/vị trí bằng hai ledger legs, không cộng vật lý lần hai; UC18 giảm tồn chỉ có chứng từ xử lý đã duyệt.
12. Chứng từ posted bất biến; hủy sau post là reversal có chứng từ/duyệt, kiểm các quota và downstream, không DELETE/update tồn trực tiếp. Không xóa cứng catalog/lot/location đã có lịch sử.

## Vòng đời theo loại, đề xuất D04

| Loại | Chuyển trạng thái hợp lệ | Quyền và ảnh hưởng |
|---|---|---|
| Danh mục | ACTIVE ↔ LOCKED | Quản lý kho; khóa không mất lịch sử, không cho dùng mới |
| DonHang | NHAP → XAC_NHAN → DANG_GIAO → DA_GIAO; NHAP/XAC_NHAN → HUY nếu chưa phát sinh | khách own order; chính sách giao/cancel D12, xuất chưa đồng nghĩa giao |
| KHSX | tạo → CHO_DUYET → DA_DUYET hoặc TU_CHOI; DA_DUYET → DANG_THUC_HIEN → HOAN_THANH | planner lập, BGĐ duyệt; sửa từ chối thành revision mới; duyệt không ghi tồn |
| PO | NHAP → CHO_DUYET → DA_DUYET/TU_CHOI; DA_DUYET → NHAN_MOT_PHAN → HOAN_THANH | mua hàng/BGĐ; QC theo PO đã duyệt, không ghi tồn PO |
| Yêu cầu xuất NL | NHAP → DA_GUI → DANG_CAP → HOAN_THANH; NHAP/DA_GUI → HUY nếu chưa cấp | xưởng đúng phân công, kho fulfillment; không cấp vượt định mức chưa duyệt ngoại lệ |
| Yêu cầu nhập TP | NHAP → CHO_QC → QC_HOAN_TAT → DANG_NHAP → HOAN_THANH | xưởng/QC/kho; lượng lỗi đi phương án xử lý riêng |
| Biên bản QC | NHAP → DA_CHOT | QC, định lượng accepted/rejected độc lập kết quả; chưa chốt không nhập DAT |
| Phiếu nhập/xuất thực tế | NHAP → CHO_NHAP_XUAT → HOAN_THANH; chưa post → HUY; stale → NHAP qua thao tác điều phối lại có lý do/version | UC13/15 xác nhận phân bổ; UC16/17/21/12/23 post mới ghi tồn; HOAN_THANH bất biến |
| Yêu cầu trả | CHO_TIEP_NHAN → CACH_LY → CHO_QC → DA_QC → HOAN_THANH | quyền tiếp nhận D05; không mặc định tăng DAT |
| Xử lý lỗi | NHAP → CHO_DUYET → DA_DUYET/TU_CHOI → DA_THUC_HIEN | QLK đề nghị, BGĐ duyệt đề xuất D05; chứng từ xử lý thực tế mới giảm/chuyển tồn |
| Kiểm kê | NHAP → DANG_DEM → CHO_XAC_MINH → CHO_DUYET → DA_DIEU_CHINH → DONG; không lệch có thể xác minh → DONG | scope lock từ cut-off; đóng sau xử lý đầy đủ, từ chối không ghi tồn; phải đóng/hủy/gián đoạn và giải phóng khóa hữu hạn an toàn |
| Đề nghị điều chỉnh | NHAP → CHO_DUYET → DA_DUYET/TU_CHOI | UC08 lập, UC09 duyệt+post atomic; retry cùng key trả kết quả cũ, hành động lại key khác 409 |

Không dùng NHAP (draft) làm nghĩa hàng đã nhập. Chuyển trạng thái cần role + scope + expectedVersion, audit trước/sau; 400/422/409 phải không để dữ liệu dở dang. Đề xuất maker khác approver, cần duyệt multi-role/admin override.

## Kiểm kê chai/lon

Theo SRS AC-KK01–10: mỗi dòng SKU–lô–vị trí–bucket, không gộp lô; snapshot tại cut-off, đếm thùng/lốc/pallet/lẻ với hệ số version chốt; 2 thùng ×24+3=51 chỉ với SKU quy cách 24. Đếm riêng vỡ/móp/rò rỉ/seal/nhãn, hết hạn; hàng lỗi vật lý không mất số đếm. Vị trí không có tồn vẫn phải xác nhận trống, hàng thừa tạo dòng ngoài snapshot.

Đề xuất D09 khóa toàn vị trí trong phạm vi đến kết thúc đối chiếu/điều chỉnh; ngoài phạm vi vận hành bình thường. Posting và cut-off cùng khóa row vị trí để không lọt giao dịch giữa snapshot và scope lock. Submitted count không sửa, đếm lại tạo phiên mới độc lập, mọi phiên giữ nguyên. Không dùng AUTO_INCREMENT ledger max như thứ tự commit duy nhất; snapshot chụp dưới khóa phạm vi, cutoff/checkpoint là chứng cứ kèm transaction.

Chênh lệch=thực đếm quy đổi−snapshot nếu phạm vi frozen. Cuốn chiếu (nếu duyệt) phải quy về thời điểm từng lần đếm theo ledger đã commit, không lấy current tồn trừ số đếm cũ. Tỷ lệ=N/A nếu tồn so sánh=0. Sai vị trí nhưng đúng tổng cần chứng từ di chuyển/điều chỉnh vị trí hai leg, không tăng/giảm toàn SKU giả. UC08 không sửa tồn; UC09 chỉ post đề nghị verified/được duyệt một lần. Sau mở khóa do hủy/gián đoạn/hết lease, các đề nghị dựa snapshot cũ không được post; cần đợt mới/cut-off mới. Kiểm kê cuốn chiếu CHUA_DUYET.

## Cảnh báo và cấu hình chưa chốt

Ngưỡng cận hạn/low stock/cycle count theo SKU/kho, revision effective_at và audit; 30 ngày, p95 3s/5s, 50 users, RPO/RTO chỉ mức đề xuất SRS. Report tách on_hand/available/quarantine, nhóm cùng đơn vị; slow-moving có định nghĩa ngày/tần suất cần duyệt. Không lấy mock frontend làm policy sản xuất.

## Quy tắc hiện hành theo xác nhận — 11/10/2026

Các lựa chọn kỹ thuật/tie-break/rounding/maker-checker trong phần đề xuất cần CHUA_DUYET; không coi ví dụ là policy đã phê duyệt.

**Định mức và thiếu NL.** Dòng KHSX bắt buộc bom_version_id của đúng SKU, hiệu lực tại thời điểm áp dụng, không sửa hồi tố. N=requirement theo sản lượng; I=net đã cấp hợp lệ cho demand; H=hold hiệu lực riêng demand; remaining=max(0,N−I−H). Free là tồn DAT đủ điều kiện trừ TẤT CẢ hold một lần. Thiếu=max(0,remaining−free được phân cho demand). Không cộng cùng free cho nhiều demand; snapshot chỉ dự kiến, hold mới bảo đảm. Trừ PO chỉ khi policy CHUA_DUYET được duyệt, không coi PO là tồn khả dụng. Hao hụt/làm tròn CHUA_DUYET; không mặc định zero nếu cần rule chưa cấu hình.

**UC15.** Save draft không giữ tồn; confirm tạo hold và chuyển CHO_NHAP_XUAT trong cùng transaction. on_hand=100, confirm70 → reserved70, available30, ledger không đổi. Phiếu khác không giữ được40. Post70 kiểm hold còn hiệu lực/đúng dòng/lô/vị trí → on_hand30, reserved0, available30 và ledger−70 cùng transaction. Không trừ reserved lần nữa khỏi on_hand. Cancel/reopen phần chưa post release hold/audit, on_hand và ledger giữ nguyên; allocation mới phải kiểm/giữ lại. Release riêng làm phiếu mất điều kiện post và quay NHAP. Hết hạn/khóa chất lượng/kiểm kê chặn post, không cho dùng hold của phiếu khác. TTL/gia hạn/ưu tiên CHUA_DUYET; expiry cleanup phải đồng bộ cached reserved. Kiểm cả quota source (order/demand) và quota stock khi nhiều phiếu.

**UC13/QC.** Một nguồn có nhiều batch kiểm theo lượng chưa kiểm, mỗi batch có dòng mặt hàng/lô và accepted/rejected. Chốt quota mới cho phép điều phối DAT. Receipt từng phần ≤accepted−received_good; một batch không kết luận hiệu lực trùng cùng phần lượng. Hàng lỗi/cách ly không thành DAT. Nếu duyệt giữ capacity, tính remaining=capacity−occupied−active held, post own hold chuyển sang occupied, không cộng occupied hai lần. Nếu chưa duyệt giữ capacity, confirm chỉ kiểm snapshot, posting luôn khóa/kiểm lại capacity và QC quota; phân bổ cạnh tranh có thể bị từ chối tại post. Kết thúc request dựa tổng lượng nhận/đã QC/đã nhập/đã xử lý, không chỉ vì một QC header đã chốt. Quy tắc đóng phần lỗi/remaining CHUA_DUYET.

**Kiểm kê.** Khóa có expires_at/heartbeat/owner/generation; không TTL vô hạn, không gia hạn tự động vô hạn. DONG/HUY/GIAN_DOAN terminal phải giải phóng scope atomically; gián đoạn/hết hạn vô hiệu hóa đề nghị chưa post trước mở khóa. Recovery worker và kiểm lười tại inventory transaction dùng chung location gate, không cần worker sống để giữ khóa mãi. UC09 chỉ nhận generation đang active, chưa hết lease; reject không ghi tồn. Tham số lease/quyền cancel/renew CHUA_DUYET; thiếu cấu hình hợp lệ thì không bắt đầu cut-off.

**Giao/nhận trả.** Sổ giao thành công gắn dòng xuất/lô/đơn, không suy ra delivered từ posting. Return nhận vật lý ≤SUM(delivered)−SUM(return_received) trừ ngoại lệ đã duyệt có số lượng/nguồn/actor. Tiếp nhận quarantine là chứng từ vật lý; QC không thay tồn; UC17 chuyển quarantine→DAT bằng hai ledger legs sau QC/UC13, không tạo receipt vật lý lặp. Hàng không rõ lô không được restock.

**Đơn vị/thời gian.** Factor SKU phiên bản, quy đổi về base unit và giữ snapshot cho mọi dòng. Capacity có dimension/unit và hệ số chiếm chỗ riêng; thể tích đồ uống không phải thể tích chiếm chỗ kho. Báo cáo nhóm đơn vị tương thích. Timestamp UTC, ngày nghiệp vụ/hiển thị Asia/Ho_Chi_Minh; biên HSD và số làm tròn CHUA_DUYET.

## Tiền và authentication đã xác nhận 12/10/2026

Chỉ VND, amount DECIMAL(20,0), qty/price(20,6), factor(20,9); không làm tròn trung gian. Xác nhận chứng từ phải áp dụng rule rounding được duyệt/version snapshot. Mode, line-vs-total/cách cộng tổng CHUA_DUYET: thiếu rule chặn bước chốt tiền, không tự dùngHALF_UP/cast DB. Chính sách giá/hao hụt/FEFO/capacity/hold/kiểm kê vẫn mở.

KhachHang1:N TaiKhoan, customer_id nullable không UNIQUE; role/action/customer scope quyết định truy cập, created_by chỉ audit. Nội bộ NULL không nghĩa toàn quyền. Session HttpOnly+CSRF/Argon2id, idle 30 phút/hard 8 giờ (không remember-me/refresh token), khóa tạm 15 phút sau 5 lần sai trong 15 phút, password 12–128 đã xác nhận. Không dùng các timeout auth cho reservation hoặc lease kiểm kê.
