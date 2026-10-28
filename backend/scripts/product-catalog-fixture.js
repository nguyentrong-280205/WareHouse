// User-approved sample catalog, 23/10/2026. Not manufacturer specifications.
const names=[
 ['Nước ngọt Cola lon 330ml','CAN',330],['Nước ngọt Cola chai PET 500ml','PET',500],['Nước ngọt Cola chai PET 1.5L','PET',1500],
 ['Nước ngọt cam lon 330ml','CAN',330],['Nước ngọt cam chai PET 500ml','PET',500],['Nước ngọt chanh lon 330ml','CAN',330],
 ['Nước ngọt chanh chai PET 500ml','PET',500],['Nước ngọt dâu chai PET 500ml','PET',500],['Nước tăng lực lon 250ml','CAN',250],
 ['Nước tăng lực lon 330ml','CAN',330],['Trà xanh chai PET 500ml','PET',500],['Trà chanh chai PET 500ml','PET',500],
 ['Nước cam chai PET 350ml','PET',350],['Nước đào chai PET 450ml','PET',450],['Nước tinh khiết chai PET 500ml','PET',500],
];
module.exports={revision:'PRODUCT_CATALOG_20261023',effectiveFrom:'2026-10-23',products:names.map(([name,containerType,volumeMl],index)=>({
 code:'TP'+String(index+1).padStart(3,'0'),name,containerType,volumeMl:volumeMl+'.000000',baseUnitCode:containerType==='CAN'?'CAN':'BOTTLE',
 shelfLifeDays:index<8?365:index<10?540:index<14?270:365,cartonsPerPallet:index===14?80:60,
 description:'Sản phẩm mẫu phục vụ đồ án; hạn sử dụng và quy cách là dữ liệu mẫu, không phải thông số kỹ thuật được xác nhận của nhà sản xuất.',
}))};
