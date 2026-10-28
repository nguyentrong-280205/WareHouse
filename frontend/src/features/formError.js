function fieldLabel(path,fields){
 const parts=String(path).split('.'),labels=[];let current=fields;
 for(const part of parts){
  if(/^\d+$/.test(part)){labels.push('dòng '+(Number(part)+1));continue;}
  const field=current?.find(f=>f.name===part);labels.push(field?.label||part);current=field?.fields;
 }
 return labels.join(' / ');
}
export function formError(error,fields,fallback){
 const detail=error.response?.data?.error;
 if(detail?.code==='VALIDATION_FAILED'&&detail.fieldErrors?.length)return 'Vui lòng kiểm tra dữ liệu tại: '+detail.fieldErrors.map(f=>fieldLabel(f.field,fields)).join('; ')+'.';
 return detail?.message||fallback;
}
