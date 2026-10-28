const base=require('../../shared/business-repository');
async function requested(c,deliveryLineId){return(await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietTraHang l JOIN YeuCauTraHang h ON h.id=l.request_id WHERE l.delivery_line_id=? AND h.status<>'HUY'",[deliveryLineId]))[0][0].n;}
async function received(c,returnLineId){return(await c.execute('SELECT COALESCE(SUM(qty_base),0) AS n FROM ChiTietTiepNhanTra WHERE return_line_id=?',[returnLineId]))[0][0].n;}
async function list(c,kind,principal,{page=1,pageSize=20,status}={}){
 const customer=principal.customerId,table=kind==='deliveries'?'DotGiaoHang':kind==='returnRequests'?'YeuCauTraHang':'TiepNhanTra';
 let filter,params=[customer||principal.accountId];
 if(kind==='deliveries')filter=customer?'EXISTS(SELECT 1 AS present FROM DonHang o WHERE o.id=h.order_id AND o.customer_id=?)':'EXISTS(SELECT 1 AS present FROM PhieuXuatKho i JOIN TaiKhoan_Kho s ON s.warehouse_id=i.warehouse_id WHERE i.id=h.issue_id AND s.account_id=?)';
 else if(kind==='returnRequests')filter=customer?'h.customer_id=?':'EXISTS(SELECT 1 AS present FROM ChiTietTraHang r WHERE r.request_id=h.id) AND NOT EXISTS(SELECT 1 AS present FROM ChiTietTraHang r JOIN ChiTietPhieuXuat l ON l.id=r.issue_line_id JOIN PhieuXuatKho i ON i.id=l.issue_id WHERE r.request_id=h.id AND NOT EXISTS(SELECT 1 AS present FROM TaiKhoan_Kho s WHERE s.warehouse_id=i.warehouse_id AND s.account_id=?))';
 else filter='EXISTS(SELECT 1 AS present FROM TaiKhoan_Kho s WHERE s.warehouse_id=h.warehouse_id AND s.account_id=?)';
 if(status&&kind!=='deliveries'){filter+=' AND h.status=?';params.push(status);}
 const from=' FROM '+table+' h WHERE '+filter,[[count]]=await c.execute('SELECT COUNT(*) AS n'+from,params);
 return{rows:(await c.execute('SELECT h.*'+from+' ORDER BY h.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params))[0],total:Number(count.n)};
}
async function orderDelivered(c,orderLineId){return(await c.execute('SELECT COALESCE(SUM(d.qty_delivered),0) AS n FROM ChiTietGiaoHang d JOIN ChiTietPhieuXuat i ON i.id=d.issue_line_id WHERE i.order_line_id=?',[orderLineId]))[0][0].n;}
module.exports={...base,requested,received,list,orderDelivered};
