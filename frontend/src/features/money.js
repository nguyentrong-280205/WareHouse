// Format decimal strings without losing DECIMAL/BIGINT precision through Number.
export function moneyText(value){
 if(value===null||value===undefined)return '—';
 const text=String(value);if(!/^\d+(\.\d+)?$/.test(text))return text;
 const[whole,fraction='']=text.split('.'),tail=fraction.replace(/0+$/,'');
 return whole.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(tail?','+tail:'');
}
