import Button from './common/Button';

export default function ActionButton({
	variant = 'secondary',
	children,
	...props
}) {
	return (
		<Button variant={variant} size="sm" {...props}>
			{children}
		</Button>
	);
}
