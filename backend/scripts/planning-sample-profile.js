// Fictional project data only: not a manufacturer recipe, specification or operating instruction.
const {products}=require('./product-catalog-fixture');
const materials=[
 ['NVL001','Vỏ lon 250ml','PIECE','2000','0.015'],['NVL002','Vỏ lon 330ml','PIECE','2000','0.020'],['NVL003','Nắp lon','PIECE','2000','0.003'],
 ['NVL004','Vỏ chai PET 350ml','PIECE','2000','0.020'],['NVL005','Vỏ chai PET 450ml','PIECE','2000','0.023'],['NVL006','Vỏ chai PET 500ml','PIECE','2000','0.025'],['NVL007','Vỏ chai PET 1.5L','PIECE','2000','0.040'],
 ['NVL008','Nắp chai','PIECE','2000','0.002'],['NVL009','Nhãn chai','PIECE','2000','0.001'],['NVL010','Thùng carton','PIECE','500','0.100'],
 ['NVL011','Đường tinh luyện','KG','500','1'],['NVL012','Nước đã xử lý','L','1000','1'],['NVL013','Hương Cola','KG','20','1'],['NVL014','Hương cam','KG','20','1'],['NVL015','Hương chanh','KG','20','1'],['NVL016','Hương dâu','KG','20','1'],['NVL017','Nguyên liệu tăng lực','KG','20','1'],['NVL018','Trà chiết xuất','KG','20','1'],['NVL019','Hương đào','KG','20','1'],['NVL020','CO2 thực phẩm','KG','100','1'],
].map(([code,name,unit,initialQuantity,capacityFactor])=>({code,name,unit,initialQuantity:initialQuantity+'.000000',capacityFactor,requiresExpiry:unit!=='PIECE'}));
const scaled=n=>(n/1000000n)+'.'+(n%1000000n).toString().padStart(6,'0');
const recipes=products.map((p,index)=>{
 const volume=BigInt(p.volumeMl.split('.')[0])*24n;
 const list=[{code:p.containerType==='CAN'?(index===8?'NVL001':'NVL002'):({'350':'NVL004','450':'NVL005','500':'NVL006','1500':'NVL007'}[p.volumeMl.split('.')[0]]),quantity:'24.000000'},{code:p.containerType==='CAN'?'NVL003':'NVL008',quantity:'24.000000'},{code:'NVL010',quantity:'1.000000'},{code:'NVL012',quantity:scaled(volume*1000n)}];
 if(p.containerType!=='CAN')list.push({code:'NVL009',quantity:'24.000000'});
 if(index!==14){
  const sugar=index<8?80n:index<10?110n:index<12?60n:90n;
  list.push({code:'NVL011',quantity:scaled(volume*sugar)});
  const flavor=index<3?'NVL013':[3,4,12].includes(index)?'NVL014':[5,6,11].includes(index)?'NVL015':index===7?'NVL016':index<10?'NVL017':index<12?'NVL018':'NVL019';
  list.push({code:flavor,quantity:scaled(volume)});
  if(index===11)list.push({code:'NVL018',quantity:scaled(volume)});
  if(index<10)list.push({code:'NVL020',quantity:scaled(volume*6n)});
 }
 const primary=index<10?(p.containerType==='CAN'?'XSX001':'XSX002'):index<14?'XSX003':'XSX004';
 const compatible=p.containerType==='CAN'?['XSX001']:index===14?['XSX004','XSX002','XSX003']:[primary,...['XSX002','XSX003'].filter(x=>x!==primary)];
 return{productCode:p.code,output:'24.000000',materials:list,primary,workshops:compatible};
});
module.exports={revision:'PLANNING_SUGGESTIONS_20261023',materials,recipes,startDate:'2026-10-23',endDate:'2026-12-31',dailyCapacity:'9600.000000'};
