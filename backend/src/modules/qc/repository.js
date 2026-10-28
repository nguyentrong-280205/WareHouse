const base=require('../../shared/business-repository');
const definitions=Object.freeze({
 materialQc:{header:'BienBanQCNguyenLieu',line:'ChiTietQCNguyenLieu',source:'DotGiaoNguyenLieu',sourceLine:'ChiTietGiaoNL',sourceKey:'delivery_id',lot:'material_lot_id',quantity:'qty_received',scope:'warehouse'},
 productQc:{header:'BienBanQCThanhPham',line:'ChiTietQCThanhPham',source:'PhieuNhapKhoThanhPham',sourceLine:'ChiTietYeuCauNhapTP',sourceKey:'request_id',lot:'product_lot_id',quantity:'qty_completed',scope:'workshop'},
 returnQc:{header:'KetQuaKiemTraHangTra',line:'ChiTietQCHangTra',source:'TiepNhanTra',sourceLine:'ChiTietTiepNhanTra',sourceKey:'reception_id',lot:'product_lot_id',quantity:'qty_base',scope:'warehouse'},
});
async function inspected(c,kind,sourceLineId,rework=false){const t=definitions[kind];return(await c.execute('SELECT COALESCE(SUM(l.qty_inspected),0) AS n FROM '+t.line+' l JOIN '+t.header+' h ON h.id=l.qc_id WHERE l.'+(rework?'rework_batch_id':'source_line_id')+"=? AND h.status='DA_XAC_NHAN'",[sourceLineId]))[0][0].n;}
async function list(c,kind,principal,{page=1,pageSize=20,status}={}){
 const t=definitions[kind],warehouse=t.scope==='warehouse',scopeTable=warehouse?'TaiKhoan_Kho':'TaiKhoan_Xuong',scopeColumn=warehouse?'warehouse_id':'workshop_id';
 const where='(EXISTS(SELECT 1 AS present FROM '+scopeTable+' a WHERE a.'+scopeColumn+'=s.'+scopeColumn+' AND a.account_id=?) OR EXISTS(SELECT 1 AS present FROM TaiKhoan_Kho a WHERE a.warehouse_id=b.warehouse_id AND a.account_id=?))'+(status?' AND h.status=?':'');
 const params=[principal.accountId,principal.accountId,...(status?[status]:[])],from=' FROM '+t.header+' h LEFT JOIN '+t.source+' s ON s.id=h.source_id LEFT JOIN DotTaiXuLy b ON b.id=h.rework_batch_id WHERE '+where;
 const[[count]]=await c.execute('SELECT COUNT(*) AS n'+from,params);
 const[rows]=await c.execute('SELECT h.*'+from+' ORDER BY h.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params);return{rows,total:Number(count.n)};
}
async function delivered(c,purchaseLineId){return(await c.execute('SELECT COALESCE(SUM(qty_received),0) AS n FROM ChiTietGiaoNL WHERE purchase_line_id=?',[purchaseLineId]))[0][0].n;}
async function origin(c,kind,header,{lock=false}={}){const t=definitions[kind];if(header.rework_batch_id){const row=await base.one(c,'DotTaiXuLy',{id:header.rework_batch_id},{lock});return row&&{...row,_rework:true};}return base.one(c,t.source,{id:header.source_id},{lock});}
async function originalLine(c,t,origin,id,{lock=false}={}){if(origin._rework){if(String(origin.id)!==String(id))return undefined;return{...origin,[t.quantity]:origin.qty_processed,unit_id:undefined};}return base.one(c,t.sourceLine,{id,[t.sourceKey]:origin.id},{lock});}
async function receivedGood(c,kind,qcLineId){const field={materialQc:'material_qc_line_id',productQc:'product_qc_line_id',returnQc:'return_qc_line_id'}[kind];return(await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietPhieuNhap l JOIN PhieuNhapKho h ON h.id=l.receipt_id WHERE l."+field+"=? AND h.status='HOAN_THANH' AND h.kind<>'REJECTED' AND l.generation=h.allocation_generation",[qcLineId]))[0][0].n;}
module.exports={...base,definitions,inspected,list,delivered,origin,originalLine,receivedGood};
