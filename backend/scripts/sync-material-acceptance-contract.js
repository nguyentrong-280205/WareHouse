const fs=require('node:fs'),path=require('node:path');
const descriptions={
 'issues.allocate':'Phiếu MATERIAL: cần đồng thời issues.allocate và issues.confirmAllocation. Lập phiếu, phân công nếu có và xác nhận reservation trong một transaction; trả DA_XAC_NHAN để nhân viên tiếp nhận. Chưa trừ on_hand. SALE giữ quy trình phân bổ hiện hành.',
 'issues.updateAllocation':'Phiếu MATERIAL còn được sửa sẽ cập nhật phân bổ và gửi lại trong cùng transaction, kiểm quyền xác nhận reservation; không sửa phiếu đã gửi khi chưa mở lại. SALE giữ quy trình hiện hành.',
 'issues.confirmAllocation':'Xác nhận giữ tồn; với MATERIAL đây là thao tác Gửi phiếu cho nhân viên cho phiếu DA_PHAN_BO đã tồn tại. Chỉ thay reserved/available, không trừ on_hand.',
 'issues.postMaterial':'Nhân viên được phân công tiếp nhận phiếu MATERIAL DA_XAC_NHAN tại kho được cấp. Nhân viên phải khác người lập; kiểm version/phân bổ/hold TTL/quota/FEFO/QC/đơn vị/khóa kiểm kê. Tiêu thụ reservation, trừ on_hand, ghi StockPosting/sổ/audit tiếp nhận và chuyển HOAN_THANH cùng transaction/idempotency. Không có trạng thái tiếp nhận độc lập trước khi trừ tồn.',
};
for(const file of ['api_contract.yaml','runtime_api.json']){
 const target=path.resolve(__dirname,'../../docs',file),api=JSON.parse(fs.readFileSync(target,'utf8'));
 for(const item of Object.values(api.paths))for(const operation of Object.values(item))if(descriptions[operation.operationId])operation.description=descriptions[operation.operationId];
 const document=api.components.schemas.DocumentResult;document.properties.warehouseName={type:'string',nullable:true};
 for(const name of ['itemName','sourceLineName','lotCode','locationName','unitName'])document.properties.lines.items.properties[name]={type:'string',nullable:true};
 fs.writeFileSync(target,JSON.stringify(api,null,2)+'\n');
}
console.log('Material issue acceptance contract synchronized; no database or requests executed.');
