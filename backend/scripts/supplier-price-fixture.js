// Fictional project suppliers and reference VND prices; no real contact details.
const suppliers=[
 ['NCC001','Bao bì lon Việt Thành'],['NCC002','Bao bì PET An Phú'],['NCC003','Nhãn và thùng Đông Nam'],
 ['NCC004','Đường Minh Phát'],['NCC005','Nước xử lý Thanh Bình'],['NCC006','Hương liệu và phụ gia Hương Việt'],
 ['NCC007','Trà và chiết xuất An Nhiên'],['NCC008','Khí thực phẩm Nam Việt'],['NCC009','Vật tư tổng hợp Phú Gia'],
].map(([code,name])=>({code,name}));
const prices=[1100,1200,120,950,1050,1100,1800,180,120,4500,22000,1800,180000,175000,170000,190000,210000,240000,200000,18000];
const materials=prices.map((price,index)=>({code:'NVL'+String(index+1).padStart(3,'0'),price:String(price),supplier:index<3?'NCC001':index<8?'NCC002':index<10?'NCC003':index===10?'NCC004':index===11?'NCC005':index===17?'NCC007':index===19?'NCC008':'NCC006'}));
module.exports={revision:'SUPPLIER_QUOTES_20261026',suppliers,materials};
