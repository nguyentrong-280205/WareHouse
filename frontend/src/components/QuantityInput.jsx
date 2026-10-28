import {useState} from 'react';
import {formatQuantity} from '../utils/formatNumber';

// Keep the user's partial decimal while editing, trim padding outside the field.
// API/form state continues to use canonical decimal strings with a dot.
export default function QuantityInput({value,onChange,onFocus,onBlur,...props}) {
  const [focused,setFocused]=useState(false);
  return <input {...props} type="text" inputMode="decimal"
    value={focused?String(value??'').replace('.',','):formatQuantity(value??'')}
    onFocus={event=>{setFocused(true);const compact=formatQuantity(value??'','.');if(!props.readOnly&&compact!==String(value??''))onChange(compact);onFocus?.(event);}}
    onBlur={event=>{setFocused(false);onBlur?.(event);}}
    onChange={event=>onChange(event.target.value.replace(',','.'))}/>;
}
