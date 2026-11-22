const variants = {
	primary: 'wms-button--primary',
	secondary: '',
	outline: '',
	ghost: 'wms-button--ghost',
	danger: 'wms-button--danger'
};

function Button({
	children,
	variant = 'primary',
	size = 'md',
	icon: Icon,
	className = '',
	disabled = false,
	onClick,
	type = 'button',
	...props
}) {
	const sizeStyle = { sm: 'wms-button--compact', lg: 'min-h-12 px-4' }[size] || '';

	return (
		<button
			type={type}
			disabled={disabled}
			onClick={onClick}
			className={`wms-button ${variants[variant] ?? variants.primary} ${sizeStyle} ${className}`}
			{...props}
		>
			{Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
			{children}
		</button>
	);
}

export default Button;
