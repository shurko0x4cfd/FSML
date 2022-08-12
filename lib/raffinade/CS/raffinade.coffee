
# Raffinade

# Toolkit for improve CoffeeScript postfix and prefix ability
# in order to write and read elegant code

# 2022 Alexander (Shurko) Stadnichenko
# Under BSD-2-Clause
# Unstable !




# Constants

ONLY = 0
FIRST = 0
SECOND = 1
LAST = -1
PENULTIMATE = -2
NULL = 0
ONE = 1
TWO = 2
LEFT = 0
RIGHT = 1
u = undefined

NONE = '}9{9Pd^T'
NOENT = 'Yr4-*<c{'

EXIT_OK = 0


# Shortcuts

cl = console .log
arr = Array .from
is_arr = Array .isArray
len = (arr) -> arr .length
split = (sep, str) -> str .split sep
map = (f, arr) -> arr .map f
join = (s, a) -> a .join s


# Prefix part

lswap = swap = (l, r, ...yarg) -> [r, l, ...yarg]
rswap = (...yarg, l, r) -> [...yarg, r, l]

empty = (arrg) -> not len arrg

# pick = (idx, arr) -> arr[idx]
pick = (idx, arr) -> arr .at idx


# Deletion by index
indelone = (idx, arrg) ->
	if is_arr arrg
		delete arrg[idx]

indel = (idx, ...arrgs) ->
	arrgs .forEach indelone .bind null, idx


pack = pk = (...args) -> args
pkone = (entt) -> pack entt


ensure = {}

ensure .array = ensure .list = (any) ->
	if is_arr any
		any
	else
		pack any


concat = cc =  (arrg, ...entts) ->
	arrg = ensure .array arrg
	arrg .concat entts


# Just discard empty slots in JS array
refusempty = (arrg) -> arrg .filter (itm) -> itm


times = (times, opr, opd) ->
	opd = opr opd for [1..times]
	opd


# Functional-like construction
all_beats_one = constr = (val, fcs) ->
	fcs .map (fc) -> val = fc val
	val


# Functional-like apply-to-all
apply_to_all = ato = (fcs, vals) ->
	[fcs, vals] = [fcs, vals] .map ensure .array
	
	vals .map (val) ->
		fcs .forEach (fc) -> val = fc val
		val


# Alternative ato
alto = (fcs, vals) ->
	[fcs, vals] = [fcs, vals] .map ensure .array
	
	vals .map (val) ->
		fseq = [val] .concat fcs # Rewrite to fseq = cc val, fcs
		fseq .reduce (acc, fc) -> fc acc


# Functional-like composition
cps2 = (fc1, fc2) -> (any) -> fc1 fc2 any


# General functional-like composition
cps = (...fcs) -> 
	fcs = fcs .reverse u
	(any) -> alto fcs, any


# Naive Descartes production
predec = (fc, arrs, defined) ->
	if empty arrs
		fc defined

	else
		rest = arr arrs
		itentt = rest .shift u

		itentt .forEach (itentr) ->
			predec fc, rest, cc defined, itentr

prodec = (fc, ...arrs) ->
	predec fc, arrs, []


# Naive async Descartes production
# Only first argument in arrs can be an ogject-generator sience first argument
# iterated once and hence need not second using, which is impossible sience is
# not an iterator and we hence has no perfect way to recreate it
apredec = (fc, arrs, defined) ->

	if empty arrs
		yield fc defined

	else
		rest = arr arrs
		itentt = rest .shift u

		if is_arr itentt
			itentt = gen itentt

		for await itentr from itentt
			yield i for await i from apredec fc, rest, cc defined, itentr

	undefined

aprodec = (fc = noop, ...arrs) ->
	yield i for await i from apredec fc, arrs, []
	undefined



mapk = (f, ...args) -> args .map f


first = only = (arrg) -> arrg[FIRST] # Rewrite to arrg .at FIRST

second = (arr) -> arr[SECOND] # Rewrite to arrg .at SECOND
###
# return entity/entry if any, else custom or default no entry/no entity marker
second = (arrg, noent = NOENT) ->
	if len arrg > ONE
		arr .at SECOND
	else
		noent
###

last = (arr) -> arr[arr .length - 1] # Rewrite to arrg .at LAST
penultimate = pu = (arr) -> arr[arr .length - 2] # Rewrite to arrg .at PENULTIMATE

min = (one, another) -> if one < another then one else another
max = (one, another) -> min another, one


# Wrap array to generator
generator = gen = (arr) ->
	yield i for await i from arr
	undefined


# Async range, 3 dot
asyncrange3 = (start, end) ->
	if start == end
		yield start
		return
	yield n for n in [start...end]
	undefined


# Easy async zip for only two arrays
azip2 = (l, r) ->
	yield pack l[i], r[i] for await i from asyncrange3 0, min l .length, r .length
	undefined


# General asinc zip for several arrays, but only up to shortest array

azip = (...arrgs) ->

	generators = arrgs .map (ent) ->

		if ent .next
			return ent

		if ent[Symbol.iterator]
			return ent[Symbol.iterator] u

		return gen pkone ent

	while true
		array = (gtr .next u for gtr from generators)

		if array .find (entry) -> entry .done
			return
			
		yield array .map (entry) -> entry .value
	undefined
		

# Yields natural numbers
naturange = (c = ONE) ->
	while c >= 0
		yield c++
	undefined

	
# Async Python-like enumerate ()
enumerate = (iterable, start_with = NULL) ->
	yield i for i from azip iterable, naturange start_with
	undefined


# Named enumerate
enamerate = (iterable, entry_name = 'val', index_name = 'idx', start_with = NULL) ->

	names = pack entry_name, index_name
	pairs = enumerate iterable, start_with

	for pair from pairs
		yield Object .fromEntries azip names, pair

	undefined


# Do nothing. Just returns undefined
noop = () -> u



# Drafts
min2 = (...args) ->
	min ...first args
# Drafts
min3 = (...args) ->
	args = first args if !! args .length and is_arr first args
	min ...args


export \
	{
		ONLY,
		FIRST, SECOND,
		ONE, TWO,
		LEFT, RIGHT,
		LAST, PENULTIMATE,
		NONE, NOENT,
		EXIT_OK,
		u,
		cl,
		arr,
		len,
		join,
		concat, cc,
		refusempty,
		naturange,
		enumerate, enamerate,
		noop,
		swap,
		lswap,
		rswap,
		empty,
		pick,
		pack,
		pkone,
		ensure,
		times,
		all_beats_one, constr,
		apply_to_all, ato, alto,
		cps2, cps,
		prodec, apredec, aprodec,
		map,
		mapk,
		first,
		second,
		last,
		penultimate, pu,
		split,
		generator, gen,
		asyncrange3,
		azip2,
		azip,
		max,
		min,
		min2,
		min3,
		indelone, indel
	}
