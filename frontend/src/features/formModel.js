export function empty(fields) {
	return Object.fromEntries(
		fields.map((f) => [
			f.name,
			f.default ??
				(f.type === 'checkbox'
					? false
					: f.type === 'array'
						? [empty(f.fields)]
						: f.type.startsWith('multi') || f.type === 'evidence'
							? []
							: '')
		])
	);
}
export function payload(fields, values) {
	return Object.fromEntries(
		fields
			.filter(
				(f) =>
					!f.transient &&
					(!f.optional || (values[f.name] !== '' && values[f.name] !== undefined))
			)
			.map((f) => [
				f.name,
				f.type === 'array'
					? values[f.name].map((row) => payload(f.fields, row))
					: f.type === 'integer'
						? Number(values[f.name])
						: f.type === 'datetime'
							? new Date(values[f.name]).toISOString()
							: values[f.name]
			])
	);
}
