import { useState } from 'react';

export function usePage(key) {
	const [state, setState] = useState({ key, page: 1 });
	if (state.key !== key) setState({ key, page: 1 });
	const setPage = (update) =>
		setState((current) => ({
			key,
			page: typeof update === 'function' ? update(current.page) : update
		}));
	return { page: state.key === key ? state.page : 1, setPage };
}
