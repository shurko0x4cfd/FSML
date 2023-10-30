
import { jest } from '@jest/globals';
import { get_fsml_instance } from '../../../dist/fsml.js';




// Apply summ
test ('Apply summ', () =>
	{
		const fsml = get_fsml_instance ();
		const source = '12 34 [ [ + ] apply ] apply';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (46);
	}
);



// Functorial 12 (proc)
test ('Factorial of 12 in procedurnal style', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'dp ' +	// Drop result of previous test to proper work
			'12 dup [ 1 [ over * over 1 - ] while swap dp ] [ 0 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (479001600);
	}
);


// Functorial 12 (func)
test ('Factorial of 12 in functional style', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'dp ' +			// Drop result of previous test to proper work 'ol'
			'* ol mul ! ' +	// var mul = (var_0, var_1) => var_1 * var_0;
			'12 dup [ 1 1range mul id 1fold ] [ 0 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (479001600);
	}
);


// Template
// test ('Template', () =>
// 	{
// 		const fsml = get_fsml_instance ();
// 		const source = 'text';

// 		const evaluated	= fsml .eval (source);
// 		const stack		= fsml .run ();
// 		const tos		= stack [0];

// 		expect (tos) .toBe ('?');
// 	}
// );
