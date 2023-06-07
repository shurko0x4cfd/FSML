### @flow ###

# Raffinade

# Toolkit for improve CoffeeScript postfix and prefix ability
# in order to write and read elegant code

# 2022 Alexander (Shurko) Stadnichenko
# Under BSD-2-Clause
# Unstable !


# Constants

export ONLY			###: number ### = 0
export FIRST		###: number ### = 0
export SECOND		###: number ### = 1
export LAST			###: number ### = -1
export PENULTIMATE	###: number ### = -2
export NULL			###: number ### = 0
export ONE			###: number ### = 1
export TWO			###: number ### = 2
export LEFT			###: number ### = 0
export RIGHT		###: number ### = 1
export u       		###: void   ### = undefined

export EXIT_OK ###: number ### = 0


# Shortcuts

export cl		###: Function ### = console .log
export arr		###: Function ### = Array .from
export is_arr	###: Function ### = Array .isArray
export len		###: Function ### = (arr) -> arr .length
export split	###: Function ### = (sep, str) -> str .split sep
export map		###: Function ### = (f, arr) -> arr .map f
export join		###: Function ### = (s, a) -> a .join s
export min		###: Function ### = (arrg) -> Math .min ...arrg
export max		###: Function ### = (arrg) -> Math .max ...arrg
export bind		###: Function ### = (ctx, ...args, fn) -> fn .bind ctx, ...args
export nbind	###: Function ### = (...args, fn) -> fn .bind null, ...args


# Do nothing. Just returns undefined
export noop ###: Function ### =
	(v ###: void ###) ###: void ### -> u

export v ###: Function ### = noop


export identity ###: Function ### = i ###: Function ### =
	(arr ###: Array<any> ###) ###: Array<any> ### -> arr

export i ###: Function ### = identity


export lswap ###: Function ### = (
	l ###: mixed ###,
	r ###: mixed ###,
	...yarg ###: Array<any> ###) ###: Array<any> ### ->
		[r, l, ...yarg]

export rswap ###: Function ### = (...yarg, l, r) -> [...yarg, r, l]


export empty ###: Function ### =
	(arr ###: Array<any> ###) ###: boolean ### -> not len arr


export at ###: Function ### =
	(idx ###: number ###, arr ###: Array<any> ###) ###: mixed ### ->
		arr .at idx


### Get property ###
export gp ###: Function ### =
	(key ###: string|number ###, obj ###: any ###) ###: mixed ### ->
		obj[key]

### Set property ###
export sp ###: Function ### = (
	key ###: string|number ###,
	val ###: mixed ###,
	obj ###: any ###) ###: mixed ### -> obj[key] = val


# Move first argument of function to end of its arguments
export roll ###: Function ### =
	(fn ###: Function ###,
	...not_callable_args ###: Array<any> ###,
	callable_arg ###: Function ###) ###: mixed ### ->
		fn callable_arg, ...not_callable_args


# Deletion by index
export indelone ###: Function ### =
	(idx ###: number ###, arrg ###: Array<any> ###) ->
		delete arrg[idx] if is_arr arrg; u

	
export indel ###: Function ### =
	(idx ###: number ### , ...arrgs ###: Array<Array<any>> ###) ->
		arrgs .forEach indelone .bind null, idx


export pk ###: Function ### = pack ###: Function ### =
	(...args ###: Array<any> ###) ###: mixed ### -> args


export ensure ###: any ### = {}

ensure .array = ensure .list = (any ###: any ###) ###: Array<any> ### ->
	if is_arr any
		(any ###: Array<any> ###)
		any
	else
		pack any


export extend ###: Function ### = (arrg, ...entts) ->
	arrg = ensure .array arrg
	arrg .concat entts


export cc ###: Function ### = (...arrgs) ->
	arrgs .reduce (acc, arr) -> pack ...acc, ...arr


# Just discard empty slots in JS array
export refusempty ###: Function ### = (arrg) -> arrg .filter (itm) -> itm


export times ###: Function ### = (times, opr, opd) ->
	opd = opr opd for [1..times]
	opd


# Functional-like construction
export constr ###: Function ### = (val, fcs) ->
	fcs .map (fc) -> val = fc val
	val


# Functional-like apply-to-all
export ato ###: Function ### = (fcs, vals) ->
	[fcs, vals] = [fcs, vals] .map ensure .array
	
	vals .map (val) ->
		fcs .forEach (fc) -> val = fc val
		val


# Alternative ato
export alto ###: Function ### = (fcs, vals) ->
	[fcs, vals] = [fcs, vals] .map ensure .array
	
	vals .map (val) ->
		fseq = [val] .concat fcs # Rewrite to fseq = cc val, fcs
		fseq .reduce (acc, fc) -> fc acc


# Functional-like composition
export cps2 ###: Function ### = (fc1, fc2) -> (any) -> fc1 fc2 any


# General functional-like composition
export cps ###: Function ### = (...fcs) -> 
	fcs = fcs .reverse u
	(any) -> alto fcs, any


# Naive Descartes production
(predec ###: Function ###)
predec ###: Function ### = (fc, arrs, defined) ->
	if empty arrs
		fc defined

	else
		rest = arr arrs
		itentt = rest .shift u

		itentt .forEach (itentr) ->
			predec fc, rest, extend defined, itentr

export prodec ###: Function ### = (fc, ...arrs) ->
	predec fc, arrs, []


# Naive async Descartes production
# Only first argument in arrs can be an ogject-generator sience first argument
# iterated once and hence need not second using, which is impossible sience is
# not an iterator and we hence has no perfect way to recreate it
(apredec ###: Function ###)
apredec ###: Function ### = (fc, arrs, defined) ->

	if empty arrs
		yield fc defined

	else
		rest = arr arrs
		itentt = rest .shift u

		if is_arr itentt
			itentt = gen itentt

		for await itentr from itentt
			yield i for await i from apredec fc, rest, extend defined, itentr

	undefined

export aprodec ###: Function ### = (fc = noop, ...arrs) ->
	yield i for await i from apredec fc, arrs, []
	undefined


export first	###: Function ### = (arrg) -> arrg .at FIRST
export only		###: Function ### = first
export mapk		###: Function ### = (f, ...args) -> args .map f
export second	###: Function ### = (arrg) -> arrg .at SECOND
export last		###: Function ### = (arrg) -> arrg .at LAST
export pu		###: Function ### = (arrg) -> arrg .at PENULTIMATE


# Wrap array to generator
export gen ###: Function ### = (arr) ->
	yield i for await i from arr
	undefined

export generator ###: Function ### = gen


# Wrap array to destructive generator
### degenerator = deger = (arrg) ->
	cnt = len arrg

	while 0 < cnt--
		yield arrg .shift u
	undefined ###


# Async range, 3 dot
export asyncrange3 ###: Function ### = (start, end) ->
	if start == end
		yield start
		return
	yield n for n in [start...end]
	undefined


# Easy async zip for only two arrays
export azip2 ###: Function ### = (l, r) ->
	yield pack l[i], r[i] for await i from asyncrange3 0, min l .length, r .length
	undefined


# General asinc zip for several arrays, but only up to shortest array

export azip ###: Function ### =
	(...arrgs ###: Array<any> ###) ###: Generator<any, void, any> ### ->

		generators = arrgs .map (ent) ->

			if ent .next
				return ent

			if ent[Symbol.iterator]
				return ent[Symbol.iterator] u

			return gen pack ent

		while true
			array = (gtr .next u for gtr from generators)

			if array .find (entry) -> entry .done
				return
				
			yield array .map (entry) -> entry .value
		undefined
		

# Yields natural numbers
export naturange ###: Function ### = (c = ONE) ->
	while c >= 0
		yield c++
	undefined

	
# Async Python-like enumerate ()
export enumerate ###: Function ### = (iterable, starts_with = NULL) ->
	yield i for i from azip iterable, naturange starts_with
	undefined


# Named enumerate
export enamerate ###: Function ### =
	(iterable, entry_name = 'val', index_name = 'idx', start_from = NULL) ->

		names = pack entry_name, index_name
		pairs = enumerate iterable, start_from

		for pair from pairs
			yield Object .fromEntries azip names, pair

		undefined
