import { useCallback, useEffect, useState } from 'react';

// Results belong to the exact filter/session key which requested them. An old
// response cannot replace a newer page, and abort never becomes a UI error.
export function useReadRequest(key, loader) {
	const [revision, setRevision] = useState(0),
		[result, setResult] = useState(null);
	const requestKey = JSON.stringify([key, revision]);
	useEffect(() => {
		let live = true;
		const controller = new AbortController();
		Promise.resolve()
			.then(() => loader(controller.signal))
			.then((data) => {
				if (live) setResult({ key: requestKey, data, error: null });
			})
			.catch((error) => {
				if (live && !controller.signal.aborted)
					setResult({ key: requestKey, data: null, error });
			});
		return () => {
			live = false;
			controller.abort();
		};
	}, [requestKey, loader]);
	const current = result?.key === requestKey ? result : null;
	const reload = useCallback(() => setRevision((value) => value + 1), []);
	return { data: current?.data, error: current?.error, loading: !current, reload };
}
export const readError = (request, fallback) =>
	request.error ? request.error.response?.data?.error?.message || fallback : '';
