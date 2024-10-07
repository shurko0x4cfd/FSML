
export const hex_string =
	(
		len = 1,
		chars = 'abcdef123456789',
	) =>
		[...new Array(len)].map(() =>
			chars.charAt(Math.floor(Math.random() * chars.length)))
			.join('');


export const new_uuid = () =>
		[8, 4, 4, 4, 12,].map(len => hex_string(len)).join('-');
