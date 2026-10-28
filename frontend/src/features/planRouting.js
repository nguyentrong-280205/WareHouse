export function handoffText(plan){
 const target={WORKSHOP:'bộ phận xưởng sản xuất',PURCHASING:'bộ phận mua hàng',PLANNING:'bộ phận lập kế hoạch'}[plan?.handoffTarget];
 if(!target)return '';
 if(plan.handoffTarget==='PURCHASING')return plan.handoffBlocked?'Chưa có tài khoản mua hàng đang hoạt động có quyền nhận yêu cầu.':'Đã thông báo nguyên vật liệu còn thiếu cho bộ phận mua hàng để lập đơn mua.';
 return plan.handoffBlocked?`Chưa có tài khoản ${target} đủ phạm vi xưởng để nhận phiếu. Phiếu được giữ lại, không mở rộng phân quyền.`:`Phiếu đã chuyển vào danh sách tiếp nhận của ${target}.`;
}
