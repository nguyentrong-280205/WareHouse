const tones = {
	success: 'success',
	green: 'success',
	danger: 'danger',
	red: 'danger',
	warning: 'warning',
	orange: 'warning',
	info: 'info',
	blue: 'info',
	purple: 'qc',
	neutral: 'neutral'
};

function Badge({ children, variant = 'info', className = '' }) {
	return (
		<span className={`wms-badge wms-tone-${tones[variant] || 'info'} ${className}`}>
			{children}
		</span>
	);
}

export default Badge;
