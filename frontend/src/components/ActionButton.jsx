export default function ActionButton({variant='secondary',className='',type='button',children,...props}){
 const colors={secondary:'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',danger:'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',primary:'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'};
 return <button type={type} {...props} className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-45 ${colors[variant]||colors.secondary} ${className}`}>{children}</button>;
}
