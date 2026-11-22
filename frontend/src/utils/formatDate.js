export function formatDate(dateString) {
	if (!dateString) return '';
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return dateString;
	return new Intl.DateTimeFormat('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(date);
}

const businessDateTime = new Intl.DateTimeFormat('vi-VN', {
	timeZone: 'Asia/Ho_Chi_Minh',
	dateStyle: 'short',
	timeStyle: 'short'
});

export function formatBusinessValue(value) {
	if (value === undefined || value === null) return '—';
	if (typeof value !== 'string') return value;
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
	if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) return value;
	const iso = value.replace(' ', 'T');
	const date = new Date(/[Zz]$|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z');
	return Number.isNaN(date.getTime()) ? value : businessDateTime.format(date);
}
