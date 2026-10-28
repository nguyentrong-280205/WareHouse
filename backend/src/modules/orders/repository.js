const base=require('../../shared/business-repository');
async function customerOrders(c,customerId,{page=1,pageSize=20,q='',status}={}) {
  const params=[customerId],clauses=['customer_id=?'];
  if(q){clauses.push("code LIKE ? ESCAPE N'~'");params.push(require('../../shared/sql-pattern').contains(q));}
  if(status){clauses.push('status=?');params.push(status);}
  const sql=clauses.join(' AND ');
  const [[count]]=await c.execute('SELECT COUNT(*) AS n FROM DonHang WHERE '+sql,params);
  const [rows]=await c.execute('SELECT * FROM DonHang WHERE '+sql+' ORDER BY id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params);
  return{rows,total:Number(count.n)};
}
async function currentPrice(c,productId,unitId) {return(await c.execute('SELECT * FROM GiaBanThanhPham WITH (HOLDLOCK,ROWLOCK) WHERE product_id=? AND unit_id=? AND effective_at<=SYSUTCDATETIME() ORDER BY revision DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY',[productId,unitId]))[0][0];}
async function displayLines(c,orderId,estimate){
 const[rows]=await c.execute('SELECT l.*,p.code AS product_code,p.name AS product_name,u.name AS unit_name'+(estimate?',price.unit_price AS estimated_unit_price':'')+' FROM ChiTietDonHang l JOIN ThanhPham p ON p.id=l.product_id JOIN DonViTinh u ON u.id=l.unit_id '+(estimate?'OUTER APPLY (SELECT TOP (1) g.unit_price FROM GiaBanThanhPham g WHERE g.product_id=l.product_id AND g.unit_id=l.unit_id AND g.effective_at<=SYSUTCDATETIME() ORDER BY g.revision DESC) price ':'')+'WHERE l.order_id=? ORDER BY l.line_no,l.id',[orderId]);
 return rows;
}
module.exports={...base,customerOrders,currentPrice,displayLines};
