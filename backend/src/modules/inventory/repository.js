const base=require('../../shared/business-repository');
async function occupied(c,warehouseId,locationId){
 const [rows]=await c.execute('SELECT t.qty_on_hand,t.capacity_factor_snapshot FROM TonKho t JOIN ViTriLuuKho v ON v.id=t.location_id WHERE v.warehouse_id=?'+(locationId?' AND v.id=?':''),[warehouseId,...(locationId?[locationId]:[])]);
 const d=require('../../shared/decimal');let total=rows.reduce((n,r)=>n+d.parse(r.qty_on_hand)*d.parse(r.capacity_factor_snapshot,9),0n);
 const [unknown]=await c.execute("SELECT occupied_capacity FROM TiepNhanChuaDinhDanh WHERE warehouse_id=? AND status='CACH_LY'"+(locationId?' AND location_id=?':''),[warehouseId,...(locationId?[locationId]:[])]);
 for(const row of unknown)total+=d.parse(row.occupied_capacity,15,35);return total;
}
async function candidates(c,warehouseId,kind,itemId){
 const material=kind==='MATERIAL',lot=material?'LoNguyenLieu':'LoThanhPham',key=material?'material_lot_id':'product_lot_id',item=material?'material_id':'product_id';
 return(await c.execute('SELECT t.*,l.expires_on,l.first_received_at FROM TonKho t WITH (UPDLOCK,HOLDLOCK,ROWLOCK) JOIN '+lot+' l ON l.id=t.'+key+" JOIN ViTriLuuKho v ON v.id=t.location_id WHERE v.warehouse_id=? AND l."+item+"=? AND t.quality_bucket='DAT' AND t.qty_on_hand>t.qty_reserved AND l.status='ACTIVE' AND v.status='ACTIVE' AND (l.expires_on IS NULL OR l.expires_on>=CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))) AND NOT EXISTS(SELECT 1 AS present FROM KhoaViTriKiemKe x WHERE x.location_id=v.id) ORDER BY CASE WHEN l.expires_on IS NULL THEN 1 ELSE 0 END,l.expires_on,CASE WHEN l.first_received_at IS NULL THEN 1 ELSE 0 END,l.first_received_at,l.id,v.id,t.id",[warehouseId,itemId]))[0];
}
async function receiptUsed(c,qcField,qcLineId,excludeId,rejected=false){
 if(!['material_qc_line_id','product_qc_line_id','return_qc_line_id'].includes(qcField))throw new Error('INVALID_QC_FIELD');
 return(await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietPhieuNhap l JOIN PhieuNhapKho h ON h.id=l.receipt_id WHERE l."+qcField+"=? AND l.generation=h.allocation_generation AND h.status IN ('DA_XAC_NHAN','HOAN_THANH') AND h.id<>? AND h.kind"+(rejected?"='REJECTED'":"<>'REJECTED'"),[qcLineId,excludeId]))[0][0].n;
}
async function issueUsed(c,field,sourceLineId,excludeId){
 if(!['order_line_id','material_request_line_id'].includes(field))throw new Error('INVALID_SOURCE_FIELD');
 return(await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietPhieuXuat l JOIN PhieuXuatKho h ON h.id=l.issue_id WHERE l."+field+"=? AND l.generation=h.allocation_generation AND (h.status='HOAN_THANH' OR (h.status='DA_XAC_NHAN' AND h.expires_at>SYSUTCDATETIME())) AND h.id<>?",[sourceLineId,excludeId]))[0][0].n;
}
async function expiredIssues(c,warehouseId){return(await c.execute("SELECT * FROM PhieuXuatKho WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE warehouse_id=? AND status='DA_XAC_NHAN' AND expires_at<=SYSUTCDATETIME() ORDER BY id",[warehouseId]))[0];}
async function capacityFactor(c,warehouseId,materialId,productId){
 return(await c.execute('SELECT f.* FROM HeSoChiemCho f WITH (HOLDLOCK,ROWLOCK) JOIN Kho k ON k.capacity_unit_id=f.capacity_unit_id WHERE k.id=? AND '+(materialId?'f.material_id=?':'f.product_id=?')+' AND f.effective_at<=SYSUTCDATETIME() ORDER BY f.revision DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY',[warehouseId,materialId||productId]))[0][0];
}
async function page(c,table,principal,{page=1,pageSize=20,status,kind,warehouseId,allowedKinds}={}){
 if(!['PhieuNhapKho','PhieuXuatKho'].includes(table))throw new Error('INVALID_DOCUMENT_TABLE');
 const clauses=['EXISTS(SELECT 1 AS present FROM TaiKhoan_Kho s WHERE s.warehouse_id=h.warehouse_id AND s.account_id=?)'],params=[principal.accountId];
 if(table==='PhieuXuatKho'&&!principal.permissions.includes('issues.allocate')&&!principal.permissions.includes('issues.confirmAllocation')){clauses.push("(h.kind<>'MATERIAL' OR EXISTS(SELECT 1 FROM PhanCongCapNguyenLieu a WHERE a.request_id=h.material_request_id AND a.warehouse_id=h.warehouse_id AND a.staff_id=?))");params.push(principal.accountId);}
 if(table==='PhieuXuatKho'&&!principal.permissions.includes('issues.allocate')&&!principal.permissions.includes('issues.confirmAllocation'))clauses.push("(h.kind<>'MATERIAL' OR h.status NOT IN ('NHAP','DA_PHAN_BO'))");
 if(table==='PhieuXuatKho'&&status==='DA_XAC_NHAN'&&!principal.permissions.includes('issues.allocate')&&!principal.permissions.includes('issues.confirmAllocation'))clauses.push('h.expires_at>SYSUTCDATETIME()');
 if(allowedKinds){if(!allowedKinds.length)return{rows:[],total:0};clauses.push('h.kind IN ('+allowedKinds.map(()=>'?').join(',')+')');params.push(...allowedKinds);}
 if(status){clauses.push('h.status=?');params.push(status);}if(kind){clauses.push('h.kind=?');params.push(kind);}
 if(warehouseId){clauses.push('h.warehouse_id=?');params.push(warehouseId);}
 const from=' FROM '+table+' h WHERE '+clauses.join(' AND '),[[count]]=await c.execute('SELECT COUNT(*) AS n'+from,params);
 return{rows:(await c.execute('SELECT h.*'+from+' ORDER BY h.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params))[0],total:Number(count.n)};
}
async function search(c,principal,{page=1,pageSize=20,warehouseId,locationId,lotId,itemId,qualityBucket,status,lotKind,q}={}){
 const clauses=['EXISTS(SELECT 1 AS present FROM TaiKhoan_Kho a WHERE a.warehouse_id=v.warehouse_id AND a.account_id=?)'],params=[principal.accountId];
 // Retired empty balances remain in the ledger, but do not occupy current-stock pages.
 clauses.push("NOT (v.status='LOCKED' AND t.qty_on_hand=0 AND t.qty_reserved=0)");
 for(const[value,clause]of [[warehouseId,'v.warehouse_id=?'],[locationId,'v.id=?'],[lotId,'COALESCE(t.material_lot_id,t.product_lot_id)=?'],[itemId,'COALESCE(ml.material_id,pl.product_id)=?'],[qualityBucket||status,'t.quality_bucket=?']])if(value){clauses.push(clause);params.push(value);}
 if(lotKind){clauses.push('t.lot_kind=?');params.push(lotKind==='MATERIAL'?'M':'P');}
 if(q){clauses.push("(COALESCE(m.code,p.code) LIKE ? ESCAPE N'~' OR COALESCE(m.name,p.name) LIKE ? ESCAPE N'~' OR COALESCE(ml.code,pl.code) LIKE ? ESCAPE N'~')");params.push(...Array(3).fill(require('../../shared/sql-pattern').contains(q)));}
 const from=' FROM TonKho t JOIN ViTriLuuKho v ON v.id=t.location_id JOIN Kho k ON k.id=v.warehouse_id LEFT JOIN LoNguyenLieu ml ON ml.id=t.material_lot_id LEFT JOIN LoThanhPham pl ON pl.id=t.product_lot_id LEFT JOIN NguyenLieu m ON m.id=ml.material_id LEFT JOIN ThanhPham p ON p.id=pl.product_id WHERE '+clauses.join(' AND ');
 const[[count]]=await c.execute('SELECT COUNT(*) AS n'+from,params),[rows]=await c.execute("SELECT t.*,v.warehouse_id,COALESCE(m.base_unit_id,p.base_unit_id) AS unit_id,COALESCE(ml.material_id,pl.product_id) AS item_id,COALESCE(m.code,p.code) AS item_code,COALESCE(m.name,p.name) AS item_name,COALESCE(ml.code,pl.code) AS lot_code,COALESCE(ml.expires_on,pl.expires_on) AS expires_on,(SELECT COALESCE(SUM(h.qty_initial-h.qty_consumed-h.qty_released),0) FROM DatGiuTon h WHERE h.balance_id=t.id AND h.status='ACTIVE' AND h.expires_at>SYSUTCDATETIME()) AS active_reserved,CAST(CASE WHEN k.status='ACTIVE' AND v.status='ACTIVE' AND COALESCE(ml.status,pl.status)='ACTIVE' AND NOT EXISTS(SELECT 1 AS present FROM KhoaViTriKiemKe x WHERE x.location_id=v.id AND x.expires_at>SYSUTCDATETIME()) THEN 1 ELSE 0 END AS bit) AS eligible"+from+' ORDER BY v.warehouse_id,v.id,t.id OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params);
 return{rows,total:Number(count.n)};
}
async function receivedFromSource(c,kind,sourceLineId){
 const config=require('../qc/repository').definitions[kind],field={materialQc:'material_qc_line_id',productQc:'product_qc_line_id',returnQc:'return_qc_line_id'}[kind];if(!config||!field)throw new Error('INVALID_QC_KIND');
 return(await c.execute('SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietPhieuNhap l JOIN PhieuNhapKho h ON h.id=l.receipt_id JOIN '+config.line+' q ON q.id=l.'+field+" WHERE q.source_line_id=? AND h.status='HOAN_THANH' AND l.generation=h.allocation_generation",[sourceLineId]))[0][0].n;
}
module.exports={...base,occupied,candidates,receiptUsed,issueUsed,expiredIssues,capacityFactor,page,search,receivedFromSource};
