import { useLayoutEffect, useRef } from 'react';

export default function Modal({ labelledBy, onClose, children }) {
	const ref = useRef(null);
	useLayoutEffect(() => {
		const dialog = ref.current;
		const opener = document.activeElement;
		dialog.showModal();
		return () => {
			dialog.close();
			if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
		};
	}, []);
	return (
		<dialog
			ref={ref}
			aria-labelledby={labelledBy}
			className="wms-dialog"
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
		>
			{children}
		</dialog>
	);
}
