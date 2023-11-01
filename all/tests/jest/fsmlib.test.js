
import { jest } from '@jest/globals';
import { get_fsml_instance } from '../../../dist/fsmlib.js';




test ('intro', () =>
	{
		const fsml = get_fsml_instance ();
		const source = '[ ';

		const evaluated	= fsml .eval (source);
	}
);


test ('Apply summ', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
		'] [ ' +	// Drop result of previous test to proper work
		'12 34 [ [ + ] apply ] apply';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (46);
	}
);


test ('Complex Apply', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'123 dup ind [ dup ind ] apply';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];
		const sec		= stack [1];
		const thr		= stack [2];

		expect (tos) .toBe (123);
		expect (sec) .toBe (123);
		expect (thr) .toBe (123);
	}
);


test ('Chained ifs', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'34 true [ 56 + ] [ 78 ] if true [ 91 - ] [ 23 ]  if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (-1);
	}
);


test ('Chained ifs 2', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'12 34 true [ swap swap ] [ 1 2 ] if  true [ swap swap ] [ 1 2 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];
		const sec		= stack [1];

		expect (tos) .toBe (34);
		expect (sec) .toBe (12);
	}
);


test ('Complex if', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'12 34 true [ dp dup ind 56 - swap 78 + ] [ 91 23 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];
		const sec		= stack [1];

		expect (tos) .toBe (90);
		expect (sec) .toBe (-44);
	}
);


test ('Nested if', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'12 true [ true [ 34 + ] [ 1 ] if ] [ 1 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (46);
	}
);


test ('Complex nested if', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'34 true [ 1 + true [ 56 + ] [ 1 ] if ] [ 1 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (91);
	}
);


test ('Nested chained if', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'34 true [ true [ 56 + ] [ 1 ]  if true [ 78 - ] [ 1 ] if ] [ 1 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (12);
	}
);


test ('If on ind-ed args', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'1234 dup ind 5678 true [ + dup ] [ 1 2 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];
		const sec		= stack [1];
		const thr		= stack [2];

		expect (tos) .toBe (6912);
		expect (sec) .toBe (6912);
		expect (thr) .toBe (1234);
	}
);


test ('Push twice', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'list  12 push 34 push';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toStrictEqual ([12, 34]);
	}
);


test ('Factorial of 12 in procedurnal style', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
			'12 dup [ 1 [ over * over 1 - ] while swap dp ] [ 0 ] if';

		const evaluated	= fsml .eval (source);
		const stack		= fsml .run ();
		const tos		= stack [0];

		expect (tos) .toBe (479001600);
	}
);


test ('Factorial of 12 in functional style', () =>
	{
		const fsml = get_fsml_instance ();
		const source =
			'] [ ' +	// Drop result of previous test to proper work
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
