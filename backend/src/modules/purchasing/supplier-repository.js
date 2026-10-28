async function currentQuotes(c,supplierId){
 return(await c.execute(`SELECT q.id,q.material_id,q.unit_id,q.unit_price,q.revision,q.effective_at FROM
 (SELECT b.*,ROW_NUMBER() OVER(PARTITION BY supplier_id,material_id,unit_id ORDER BY revision DESC) AS rn
 FROM BaoGiaNguyenLieu b JOIN NguyenLieu m ON m.id=b.material_id AND m.status='ACTIVE'
 WHERE b.supplier_id=? AND b.effective_at<=SYSUTCDATETIME()) q WHERE q.rn=1 ORDER BY q.material_id,q.unit_id`,[supplierId]))[0];
}
async function supports(c,supplierId,materialId,unitId){return(await currentQuotes(c,supplierId)).some(q=>String(q.material_id)===String(materialId)&&String(q.unit_id)===String(unitId));}
module.exports={currentQuotes,supports};
