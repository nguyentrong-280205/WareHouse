// Explicit local-demo exception approved by the user; no passwords in source.
const accounts=Object.freeze([
 {username:'khach01',role:'customer'},
 {username:'kehoach01',role:'planner'},
 {username:'muahang01',role:'purchasing'},
 {username:'giamdoc01',role:'board'},
 {username:'quanlykho01',role:'warehouse'},
 {username:'nhanvienkho01',role:'staff'},
 {username:'qc01',role:'qc'},
 {username:'xuong01',role:'workshop'},
 {username:'kiemke01',role:'council'},
]);
// Additional named warehouse staff explicitly approved for short local passwords.
const warehouseStaffAccounts=Object.freeze([
 {username:'uc01.staff',accountCode:'UC01_DEMO_staff'},
 {username:'nguyentrong',accountCode:'STAFF_20261028_nguyentrong'},
 {username:'vuthinh',accountCode:'STAFF_20261028_vuthinh'},
 {username:'truongthinh',accountCode:'STAFF_20261028_truongthinh'},
]);
const code=username=>warehouseStaffAccounts.find(a=>a.username===username)?.accountCode||'LOCAL_SIMPLE_'+username;
const dedicatedWorkshopAccounts=Object.freeze([
 {username:'xuong_ngk',workshopCode:'XSX002',displayName:'Xưởng nước giải khát'},
 {username:'xuong_tra',workshopCode:'XSX003',displayName:'Xưởng trà và nước trái cây'},
 {username:'xuong_nuoc',workshopCode:'XSX004',displayName:'Xưởng nước tinh khiết'},
]);
function allowed(config,username){return config.AUTH_ALLOW_SIMPLE_DEMO===true&&config.db?.database==='warehouse_db'&&([...accounts,...dedicatedWorkshopAccounts].some(a=>a.username===username)||config.db?.machine==='warehouse-sqlserver'&&warehouseStaffAccounts.some(a=>a.username===username));}
module.exports={accounts,code,allowed,dedicatedWorkshopAccounts,warehouseStaffAccounts};
