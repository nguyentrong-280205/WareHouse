# Các quyết định chặn triển khai trọn bộ 29 UC

Ngày 15/10/2026. **DA_XAC_NHAN — FS01–FS12**. Người dùng chấp thuận toàn bộ nguyên văn phương án trong tài liệu qua lệnh “Phê duyệt FS01–FS12 và tiếp tục triển khai toàn bộ29UseCase”. Cho phép đồng bộ contract và thực hiện ngay code FE/BE/MySQL trong cùng nhiệm vụ; không chạy test tự động, không dừng sau bước tài liệu. Phần mô tả điểm chặn/phương án bên dưới giữ nguyên như hồ sơ tại thời điểm phê duyệt; các nhãn CHUA_DUYET trong mô tả lịch sử không phủ nhận xác nhận này. Các ngoại lệ nằm ngoài FS01–12 vẫn chưa duyệt.

Lệnh mới đã giao toàn bộ 29 UC trong một nhiệm vụ, bỏ cổng dừng từng UC và hoãn chạy test tự động. Không cần giao lại từng UC. Tuy nhiên lệnh chỉ thay quy trình, không phê duyệt các chính sách nghiệp vụ còn mở; mục 10 của lệnh cho phép dừng khi gặp quyết định nghiệp vụ quan trọng chưa duyệt. Tài liệu này gom các quyết định đó để duyệt cùng lần.

## Bằng chứng chặn hiện có

- SRS FR008/RULE15 và decisions D01/D06/D12 vẫn để hao hụt/làm tròn CHUA_DUYET. Contract plans.create, orders.submit và purchases.submit yêu cầu POLICY_NOT_APPROVED khi thiếu rule. Không thể coi luồng đơn hàng → sản xuất → mua hàng hoạt động đầy đủ nếu chỉ viết endpoint luôn trả lỗi policy.
- SRS FR104, decisions D03 và contract issues.confirmAllocation chưa chốt TTL/gia hạn reservation bắt buộc. Không được lấy timeout auth làm TTL giữ tồn.
- StocktakeInput chỉ có FROZEN_SCOPE nhưng description nói rõ chưa duyệt; finite lease và quyền lập/hủy/gia hạn còn mở. Đây là quyết định về vận hành kho, không chỉ việc chọn khóa SQL.
- Contract có **105 operations / 87 paths / 89 schemas**, trong đó **9 operations** mang x-approval-status=CHUA_DUYET: dispositions.decide; stocktakes.create/cutoff/cancel/renewLocks; reservations.renew; deliveries.confirm; returnRequests.create; returnReceptions.post.
- ProductInput và OrderInput không có nguồn giá bán; OrderResult có unitPrice/amount server-owned. Không có cơ sở tự đặt giá0 hoặc cho khách tự gửi đơn giá.
- ReturnReceptionInput và ReturnRequestInput bắt buộc lô/nguồn xác minh; SRS FR039/KK04 lại yêu cầu tiếp nhận cách ly hàng không rõ lô. API hiện tại chưa diễn đạt được nhánh này.
- Có deliveries.confirm nhưng chưa có API tạo/đọc chuyến giao; chưa có API ghi chuyến NCC giao để tạo các sourceLineId QC; thiếu GET/list cho các hồ sơ kiểm kê/hàng trả/xử lý lỗi và lookup theo actor. Chỉ dùng dữ liệu seed không đáp ứng yêu cầu toàn bộ luồng thao tác bằng frontend.

## Bảng lựa chọn đề xuất

**FS01, FS02, FS03, FS04, FS05, FS06, FS07, FS08, FS09, FS10, FS11, FS12: DA_XAC_NHAN ngày15/10/2026 bởi người dùng.** Nội dung chi tiết dưới đây là phương án đã được chọn, được phép áp dụng vào code/contract/schema liên quan.

| ID | Quyết định cần chốt / nguồn | Phương án đề xuất cụ thể | UC chịu tác động |
|---|---|---|---|
| FS01 | Làm tròn VND — NT06, D06/D12, RULE15 | HALF_UP về0 chữ số **từng dòng tại xác nhận**, tổng chứng từ = tổng thành tiền dòng đã chốt. Tính lượng×giá chính xác trước bước này, không round trung gian; snapshot rule/version; giá/qty vượt scale bị reject trước MySQL. Có thể chọn HALF_EVEN hoặc làm tròn tổng thay thế nhưng cần chỉ rõ cách phân bổ lại dòng. | UC11/26/27 |
| FS02 | Nguồn giá bán — D12; OrderInput/Result | Giá bán version theo SKU/đơn vị do Quản lý kho cấu hình trong UC25; khách chỉ chọn hàng/lượng, server lấy giá hiệu lực lúc xác nhận và snapshot. Bổ sung salesPrices[{unitId,unitPrice}] cho product create/update/read để không tạo UC định giá riêng; không sửa giá chứng từ đã xác nhận. Giá demo là dữ liệu giả ghi rõ, không mặc định giá sản xuất. | UC25/11; thay đổi contract có căn cứ |
| FS03 | BOM/nhu cầu mua/sản lượng — D01/D02 | Hao hụt ban đầu **0% theo phê duyệt này nếu được chấp thuận**, thể hiện rõ trong cấu hình/version BOM. Chỉ làm tròn nhu cầu cuối lúc xác nhận: CEILING tới1 đơn vị cho vật tư rời, tới0.000001 cho kg/lít; trước đó giữ phép tính chính xác. Không sản xuất/cấp vượt nguồn đơn/nhu cầu. PO đã duyệt còn chưa nhận và phân bổ đúng demand được trừ riêng khi tính **cần mua**, không cộng vào tồn cấp phát; phần nhận lỗi không được coi là nguồn đáp ứng. | UC02/03/22/24/26 |
| FS04 | Reservation — D03, FR103–105 | TTL120 phút từ confirm; Bộ phận quản lý kho đúng scope được gia hạn **một lần**, tối đa120 phút thêm, hard limit240 phút từ confirm gốc. Không auto-renew. Tranh giữ theo transaction thành công trước, không cơ chế ưu tiên ngầm. Hết hạn/reopen/cancel giải phóng phần chưa consume và vô hiệu phân bổ atomic; nhiều phiếu phục vụ nguồn từng phần, mỗi phiếu post toàn bộ atomic. | UC15/12/23 |
| FS05 | Sức chứa/UC13 — D03/D06 | **Không bật capacity reservation UC13** ở bản này; confirm chỉ kiểm snapshot, post luôn khóa/kiểm quota/sức chứa lại. Sức chứa tuyến tính theo KG hoặc M3 với factor/version bắt buộc cho từng item; tính cả mọi bucket và hàng chưa định danh; không dùng dung tích đồ uống thay occupancy. Không đổi factor đã dùng hoặc hạ capacity dưới mức occupied. PALLET_SLOT cần lựa chọn riêng quy tắc pallet lẻ trước khi bật, vẫn hỗ trợ pallet như đơn vị đếm/đóng gói. | UC19/13/16/17/21/25/30 |
| FS06 | HSD/FEFO — D13 | Lô được dùng đến hết ngày HSD theo Asia/Ho_Chi_Minh, chặn từ00:00 ngày kế tiếp; FEFO theo HSD, bằng HSD thì first_received_at rồi lot id và location id. Không HSD thì FIFO. Không bật ngoại lệ FEFO hoặc hợp đồng hạn tối thiểu bổ sung trong bản này; không xuất hàng hết hạn/cách ly/lỗi. | UC15/12/23/05/06 |
| FS07 | Kiểm kê — D09/D04, SRS8 | FROZEN_SCOPE; Quản lý kho tạo/chốt phạm vi, phân công Hội đồng, được hủy/gia hạn; Hội đồng đếm/xác nhận, QLK xác minh, BGĐ duyệt điều chỉnh. Lease60 phút, gia hạn tay tối đa60 phút/lần, hard limit240 phút từ cut-off, không auto-renew. Chênh lệch bất kỳ cần ít nhất1 lần đếm lại độc lập và evidence/lý do trước đề nghị. Hết hạn/hủy/gián đoạn vô hiệu proposal cũ trước mở khóa. Không tự cắt reservation nếu adjustment làm reserved>on_hand:409, QLK phải release phiếu chưa post hợp lệ trước BGĐ thử lại. | UC07/08/09 |
| FS08 | Giao hàng/return actor — D05/D12 | UC12 post tạo dispatch gắn các dòng xuất, delivered=0; Nhân viên kho đúng scope xác nhận giao từng phần, không vượt dispatched chưa giao. Khách hàng tạo yêu cầu trả cho đơn thuộc cùng customer_id; Nhân viên kho nhận vật lý vào kho/vị trí CONTROLLED, QC đánh giá; không cho trả vượt delivered còn chưa trả. Không thêm actor giao vận hoặc UC mới. | UC12/14/17 |
| FS09 | Hàng không rõ lô/nguồn — FR039/KK04, D05 | Nhân viên kho được lập phiếu cách ly chưa định danh, ghi SKU nếu biết, mã lô khai báo, lượng/đơn vị, vị trí và lượng chiếm chỗ; không bịa FK lô hoặc tăng DAT. QLK xác minh, đối chiếu nguồn giao và lô thật, kiểm quota trước chuyển sổ chưa định danh sang quarantine có FK; giữ trace/evidence, không cộng vật lý hai lần. Cho phép bổ sung API nhập/đọc/xác minh riêng dưới UC14 vì contract hiện tại chỉ nhận lô đã xác minh. Không cho bỏ qua nguồn để restock. | UC14/17/18/19; contract cần mở rộng |
| FS10 | Hàng lỗi/tái xử lý/QC — D05/D10 | QLK đề xuất, BGĐ khác người đề xuất duyệt, QLK đúng scope thực hiện có chứng từ. QC gốc đã chốt bất biến; REWORK tạo đợt/kết quả mới liên kết hồ sơ xử lý, quota riêng bằng lượng đã tái xử lý, không kiểm trùng quota gốc. DISPOSAL/SUPPLIER_RETURN chỉ giảm lượng vật lý đang thuộc kho bằng posting/ledger hợp lệ. Phần chưa từng ghi sổ kho phải có chứng từ tiếp nhận trước khi được ghi giảm; không tạo ledger âm để xử lý lượng ngoài sổ. Cần hỗ trợ nhập vật lý cách ly khi tiếp nhận NL/TP lỗi, không biến QC thành thao tác ghi tồn. | UC18/04/29/14/21/16; contract cần mở rộng nguồn rework/intake |
| FS11 | Dữ liệu hỗ trợ, năng lực và scope — D07/D11 | Nhà cung cấp/xưởng/BOM/đơn vị/calendar/factor hỗ trợ dùng seed versioned giả và lookup read trong bản29UC; chưa thêm màn quản trị/CRUD ngoài UC. Calendar phải khai báo ngày làm việc và quota theo SKU/xưởng; lượng KHSX được phân theo từng ngày, tổng không vượt quota đã cấu hình, không tự đặt lịch nghỉ/năng lực. Dữ liệu giả có seed tương ứng. Scope kho/xưởng cấp tường minh qua seed/config riêng, không NULL/toàn quyền. Kho mới do QLK tạo chỉ cấp scope cho người tạo, không cho toàn bộ role; các account khác phải được cấp rõ. | UC02/03/19 và mọi thao tác kho/xưởng |
| FS12 | Phần API/cấu hình còn thiếu — D11/D12/NFR11 và các khoảng trống ở trên | Cho phép bổ sung các API nguồn/lookup/list/detail dưới chính UC hiện có như danh sách bên dưới; giữ nguyên paths/fields hiện hữu trừ các mở rộng có ghi rõ. Cấu hình cảnh báo do QLK theo SKU/kho: low-stock threshold, near-expiry days, slow-moving days bắt buộc nhập/seed có revision; không tự lấy số mock làm policy. Giữ audit/RBAC/scope cho cấu hình. Không thêm UC28 hoặc UC mới. | Luồng FE→API đầy đủ cho29UC |

### Delta contract cần thiết để review khi các dòng liên quan được chấp thuận

Đây là danh sách đề xuất; **chưa sửa api_contract.yaml** và chưa cấp permissions:

1. FS02: bổ sung salesPrices cho catalog sản phẩm, giá server-owned/snapshot cho đơn hàng; xác định quantity là lượng theo unitId, server quy đổi quantityBase bằng packagingVersionId. Không tự nhân đôi hệ số do mô tả Quantity dùng chung đang ghi “cơ sở”.
2. FS08: GET/list/detail dispatch và return request/reception, hoặc trả liên kết dispatch từ kết quả UC12; cấp deliveries.confirm cho Nhân viên kho và returnRequests.create cho KH own customer, returnReceptions.post cho NVKho đúng scope.
3. FS09: API tạo/list/detail/xác minh phiếu return chưa định danh. Không chỉ nullable productLotId ở API cũ rồi bỏ kiểm FK/quota; chuyển tiếp sau xác minh phải có nguồn giao thật.
4. FS10: ghi nhận đợt NCC giao/đợt TP hoàn thành và chứng từ cách ly liên quan để sinh sourceLineId QC, cùng các trường liên kết đợt REWORK. Ghi metadata giao/hoàn thành không tự thành DAT; mọi tiếp nhận vật lý ghi kho phải có chứng từ/ledger và kiểm capacity riêng.
5. FS07/10: GET/list/detail kiểm kê, phiên đếm, xác minh, đề nghị điều chỉnh và phương án xử lý lỗi để FE không phụ thuộc response tạo mới còn trong memory.
6. FS11: lookups units, products, order lines, approved plan lines, workshops, suppliers, BOM/factors theo permission của UC tiêu thụ + scope; không cấp toàn quyền UC06/products.read/orders.read cho actor chỉ cần lookup. Không lộ giá mua/dữ liệu khách khác.
7. FS12: thao tác đọc/cập nhật cấu hình cảnh báo versioned thuộc UC05. Cấu hình chưa có thì UI hiển thị chưa cấu hình; không đánh giá giả “không có cảnh báo”.

Các trường/endpoint chính xác và SQL bổ sung sẽ được đối chiếu lại blueprint khi triển khai; những thay đổi phát sinh ngoài phương án được chọn vẫn phải báo tác động, không coi việc duyệt bảng này là duyệt endpoint/bảng nghiệp vụ tùy ý.

## Có thể trì hoãn mà không chặn phạm vi cơ bản

IP thresholds/SSO/MFA/đổi-reset-cấp tài khoản qua UI, capacity hold UC13, FIFO/FEFO exception, overproduction exception, vận hành kiểm kê cuốn chiếu, reversal sau posting, multi-role account, tối ưu vận tải, CI/load/RPO/RTO/backup retention chưa được giao hoặc chưa duyệt. Không mở bypass hoặc quyền ngoại lệ cho các mục này. Những thành phần thuộc luồng chuẩn không được đẩy vào nhóm trì hoãn để bỏ UC.

Giữ các trường hợp ngoại lệ an toàn đã có: không sửa posted/QC đã chốt; không có policy cho ngoại lệ thì từ chối. Đây không thay thế các phần tử bắt buộc của luồng chuẩn đang chờ FS01–12.

## Cách phản hồi

Có thể trả lời “Chấp thuận FS01–FS12 theo đề xuất”, hoặc ghi từng ID và nội dung thay thế; nếu chỉ chấp thuận một phần sẽ áp đúng phần đó. Cấu hình ví dụ/demo không là thông số thật của nhà máy. Chưa có dòng nào được tự đánh DA_XAC_NHAN.

Sau khi chốt các điểm chặn, tiếp tục **cùng nhiệm vụ29UC**, không cần prompt riêng/không dừng sau từng UC. Không chạy unit/integration/E2E/regression cho đến khi người dùng đổi lệnh. Lần rà soát này chưa code thêm UC, chưa tạo/apply migration, không chạy Docker/test hoặc ghi database.
