const base=require('../../shared/business-repository');
const types={MATERIAL:{kind:'materialQc',field:'material_qc_line_id'},PRODUCT:{kind:'productQc',field:'product_qc_line_id'},RETURN:{kind:'returnQc',field:'return_qc_line_id'}};
async function claimed(c,field,lineId,exclude='0'){if(!Object.values(types).some(t=>t.field===field))throw new Error('INVALID_QC_FIELD');return(await c.execute("SELECT COALESCE(SUM(qty_base),0) AS n FROM XuLyHangLoiTraVe WHERE "+field+"=? AND id<>? AND status IN ('NHAP','CHO_DUYET','DA_DUYET','DA_THUC_HIEN')",[lineId,exclude]))[0][0].n;}
async function all(c,{status}={}){return(await c.execute('SELECT * FROM XuLyHangLoiTraVe'+(status?' WHERE status=?':'')+' ORDER BY id DESC',status?[status]:[]))[0];}
module.exports={...base,types,claimed,all};
