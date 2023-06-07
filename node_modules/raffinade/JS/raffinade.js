/* @flow */
var apredec /*: Function */,
	pack /*: Function */,
	predec /*: Function */,
	splice = [].splice;

// Raffinade

// Toolkit for improve CoffeeScript postfix and prefix ability
// in order to write and read elegant code

// 2022 Alexander (Shurko) Stadnichenko
// Under BSD-2-Clause
// Unstable !

// Constants
export var ONLY /*: number */ = 0;

export var FIRST /*: number */ = 0;

export var SECOND /*: number */ = 1;

export var LAST /*: number */ = -1;

export var PENULTIMATE /*: number */ = -2;

export var NULL /*: number */ = 0;

export var ONE /*: number */ = 1;

export var TWO /*: number */ = 2;

export var LEFT /*: number */ = 0;

export var RIGHT /*: number */ = 1;

export var u /*: void   */ = void 0;

export var EXIT_OK /*: number */ = 0;

// Shortcuts
export var cl /*: Function */ = console.log;

export var arr /*: Function */ = Array.from;

export var is_arr /*: Function */ = Array.isArray;

export var len /*: Function */ = function (arr) {
	return arr.length;
};

export var split /*: Function */ = function (sep, str) {
	return str.split(sep);
};

export var map /*: Function */ = function (f, arr) {
	return arr.map(f);
};

export var join /*: Function */ = function (s, a) {
	return a.join(s);
};

export var min /*: Function */ = function (arrg) {
	return Math.min(...arrg);
};

export var max /*: Function */ = function (arrg) {
	return Math.max(...arrg);
};

export var bind /*: Function */ = function (ctx, ...args) {
	var fn, ref;
	(ref = args), ([...args] = ref), ([fn] = splice.call(args, -1));
	return fn.bind(ctx, ...args);
};

export var nbind /*: Function */ = function (...args) {
	var fn, ref;
	(ref = args), ([...args] = ref), ([fn] = splice.call(args, -1));
	return fn.bind(null, ...args);
};

// Do nothing. Just returns undefined
export var noop /*: Function */ = function (v /*: void */) /*: void */ {
	return u;
};

export var v /*: Function */ = noop;

export var identity /*: Function */ = (i = function (
	arr /*: Array<any> */
) /*: Array<any> */ {
	return arr;
});

export var i /*: Function */ = identity;

export var lswap /*: Function */ = function (
	l /*: mixed */,
	r /*: mixed */,
	...yarg /*: Array<any> */
) /*: Array<any> */ {
	return [r, l, ...yarg];
};

export var rswap /*: Function */ = function (...yarg) {
	var l, r, ref;
	(ref = yarg), ([...yarg] = ref), ([l, r] = splice.call(yarg, -2));
	return [...yarg, r, l];
};

export var empty /*: Function */ = function (
	arr /*: Array<any> */
) /*: boolean */ {
	return !len(arr);
};

export var at /*: Function */ = function (
	idx /*: number */,
	arr /*: Array<any> */
) /*: mixed */ {
	return arr.at(idx);
};

/* Get property */
export var gp /*: Function */ = function (
	key /*: string|number */,
	obj /*: any */
) /*: mixed */ {
	return obj[key];
};

/* Set property */
export var sp /*: Function */ = function (
	key /*: string|number */,
	val /*: mixed */,
	obj /*: any */
) /*: mixed */ {
	return (obj[key] = val);
};

// Move first argument of function to end of its arguments
export var roll /*: Function */ = function (
	fn /*: Function */,
	...not_callable_args /*: Array<any> */
) /*: mixed */ {
	var callable_arg /*: Function */, ref;
	(ref = not_callable_args),
		([...not_callable_args] = ref),
		([callable_arg] = splice.call(not_callable_args, -1));
	return fn(callable_arg, ...not_callable_args);
};

// Deletion by index
export var indelone /*: Function */ = function (
	idx /*: number */,
	arrg /*: Array<any> */
) {
	if (is_arr(arrg)) {
		delete arrg[idx];
	}
	return u;
};

export var indel /*: Function */ = function (
	idx /*: number */,
	...arrgs /*: Array<Array<any>> */
) {
	return arrgs.forEach(indelone.bind(null, idx));
};

export var pk /*: Function */ = (pack = function (
	...args /*: Array<any> */
) /*: mixed */ {
	return args;
});

export var ensure /*: any */ = {};

ensure.array = ensure.list = function (any /*: any */) /*: Array<any> */ {
	if (is_arr(any)) {
		(any /*: Array<any> */);
		return any;
	} else {
		return pack(any);
	}
};

export var extend /*: Function */ = function (arrg, ...entts) {
	arrg = ensure.array(arrg);
	return arrg.concat(entts);
};

export var cc /*: Function */ = function (...arrgs) {
	return arrgs.reduce(function (acc, arr) {
		return pack(...acc, ...arr);
	});
};

// Just discard empty slots in JS array
export var refusempty /*: Function */ = function (arrg) {
	return arrg.filter(function (itm) {
		return itm;
	});
};

export var times /*: Function */ = function (times, opr, opd) {
	var j, ref;
	for (
		j = 1, ref = times;
		1 <= ref ? j <= ref : j >= ref;
		1 <= ref ? j++ : j--
	) {
		opd = opr(opd);
	}
	return opd;
};

// Functional-like construction
export var constr /*: Function */ = function (val, fcs) {
	fcs.map(function (fc) {
		return (val = fc(val));
	});
	return val;
};

// Functional-like apply-to-all
export var ato /*: Function */ = function (fcs, vals) {
	[fcs, vals] = [fcs, vals].map(ensure.array);
	return vals.map(function (val) {
		fcs.forEach(function (fc) {
			return (val = fc(val));
		});
		return val;
	});
};

// Alternative ato
export var alto /*: Function */ = function (fcs, vals) {
	[fcs, vals] = [fcs, vals].map(ensure.array);
	return vals.map(function (val) {
		var fseq;
		fseq = [val].concat(fcs); // Rewrite to fseq = cc val, fcs
		return fseq.reduce(function (acc, fc) {
			return fc(acc);
		});
	});
};

// Functional-like composition
export var cps2 /*: Function */ = function (fc1, fc2) {
	return function (any) {
		return fc1(fc2(any));
	};
};

// General functional-like composition
export var cps /*: Function */ = function (...fcs) {
	fcs = fcs.reverse(u);
	return function (any) {
		return alto(fcs, any);
	};
};

// Naive Descartes production
(predec /*: Function */);

predec = function (fc, arrs, defined) {
	var itentt, rest;
	if (empty(arrs)) {
		return fc(defined);
	} else {
		rest = arr(arrs);
		itentt = rest.shift(u);
		return itentt.forEach(function (itentr) {
			return predec(fc, rest, extend(defined, itentr));
		});
	}
};

export var prodec /*: Function */ = function (fc, ...arrs) {
	return predec(fc, arrs, []);
};

// Naive async Descartes production
// Only first argument in arrs can be an ogject-generator sience first argument
// iterated once and hence need not second using, which is impossible sience is
// not an iterator and we hence has no perfect way to recreate it
(apredec /*: Function */);

apredec = async function* (fc, arrs, defined) {
	var itentr, itentt, ref, rest;
	if (empty(arrs)) {
		yield fc(defined);
	} else {
		rest = arr(arrs);
		itentt = rest.shift(u);
		if (is_arr(itentt)) {
			itentt = gen(itentt);
		}
		for await (itentr of itentt) {
			ref = apredec(fc, rest, extend(defined, itentr));
			for await (i of ref) {
				yield i;
			}
		}
	}
	return void 0;
};

export var aprodec /*: Function */ = async function* (fc = noop, ...arrs) {
	var ref;
	ref = apredec(fc, arrs, []);
	for await (i of ref) {
		yield i;
	}
	return void 0;
};

export var first /*: Function */ = function (arrg) {
	return arrg.at(FIRST);
};

export var only /*: Function */ = first;

export var mapk /*: Function */ = function (f, ...args) {
	return args.map(f);
};

export var second /*: Function */ = function (arrg) {
	return arrg.at(SECOND);
};

export var last /*: Function */ = function (arrg) {
	return arrg.at(LAST);
};

export var pu /*: Function */ = function (arrg) {
	return arrg.at(PENULTIMATE);
};

// Wrap array to generator
export var gen /*: Function */ = async function* (arr) {
	for await (i of arr) {
		yield i;
	}
	return void 0;
};

export var generator /*: Function */ = gen;

// Wrap array to destructive generator
/* degenerator = deger = (arrg) ->
cnt = len arrg

while 0 < cnt--
	yield arrg .shift u
undefined */
// Async range, 3 dot
export var asyncrange3 /*: Function */ = function* (start, end) {
	var j, n, ref, ref1;
	if (start === end) {
		yield start;
		return;
	}
	for (
		n = j = ref = start, ref1 = end;
		ref <= ref1 ? j < ref1 : j > ref1;
		n = ref <= ref1 ? ++j : --j
	) {
		yield n;
	}
	return void 0;
};

// Easy async zip for only two arrays
export var azip2 /*: Function */ = async function* (l, r) {
	var ref;
	ref = asyncrange3(0, min(l.length, r.length));
	for await (i of ref) {
		yield pack(l[i], r[i]);
	}
	return void 0;
};

// General asinc zip for several arrays, but only up to shortest array
export var azip /*: Function */ = function* (
	...arrgs /*: Array<any> */
) /*: Generator<any, void, any> */ {
	var array, generators, gtr;
	generators = arrgs.map(function (ent) {
		if (ent.next) {
			return ent;
		}
		if (ent[Symbol.iterator]) {
			return ent[Symbol.iterator](u);
		}
		return gen(pack(ent));
	});
	while (true) {
		array = (function () {
			var results;
			results = [];
			for (gtr of generators) {
				results.push(gtr.next(u));
			}
			return results;
		})();
		if (
			array.find(function (entry) {
				return entry.done;
			})
		) {
			return;
		}
		yield array.map(function (entry) {
			return entry.value;
		});
	}
	return void 0;
};

// Yields natural numbers
export var naturange /*: Function */ = function* (c = ONE) {
	while (c >= 0) {
		yield c++;
	}
	return void 0;
};

// Async Python-like enumerate ()
export var enumerate /*: Function */ = function* (
	iterable,
	starts_with = NULL
) {
	var ref;
	ref = azip(iterable, naturange(starts_with));
	for (i of ref) {
		yield i;
	}
	return void 0;
};

// Named enumerate
export var enamerate /*: Function */ = function* (
	iterable,
	entry_name = 'val',
	index_name = 'idx',
	start_from = NULL
) {
	var names, pair, pairs;
	names = pack(entry_name, index_name);
	pairs = enumerate(iterable, start_from);
	for (pair of pairs) {
		yield Object.fromEntries(azip(names, pair));
	}
	return void 0;
};
