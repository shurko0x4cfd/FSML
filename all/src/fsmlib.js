
/* FSML  */

/* FSML programming language compiler */
/* Copyright (c) 2021, 2024 Alexander (Shúrko) Stadnichénko */
/* License : BSD-2-Clause */

/* @flow */


const u = undefined;

import
{
	compilit,					new_str_uid,
	compex_to_infix_str,		base_voc,
	eval_cmps as eval_semantics
}
// $FlowFixMe
from './base-voc.js';

// $FlowFixMe
import { StacksChain } from './stacks-chain.js';
// $FlowFixMe
import { Quotation } from './quotation.js';
// $FlowFixMe
import { StackItem } from './stack-item.js';
// $FlowFixMe
import { Compex } from './compex.js';


export const collect = {};


/* Defaults for formatting output text */

let cr = "\n";
let indent_str = " ";
let size_indent = 4;


/* if default 'fsmlog_type' is not overriden, accumulate fsml output for return
   to environmen at end of compilation. Otherwise use external 'fsmlog_type'
   for type immediately */

export let output_buffer = '';


export const clear_output_buffer = () => output_buffer = '';


/** Default way to output is just accumulate output in buffer and then return
 * it to caller
 * @arg		{string} text	Append id to output
 * @return	{string}		Output buffer
 */
const default_fsmlog_type = (text)  =>
	output_buffer += text;


/* And set it as default until overriden */
export let fsmlog_type = default_fsmlog_type;


/**
* Set external callback as typer instead of accumulate in output buffer
* @arg		{Function} external_fsmlog_type	External callback provide typing
* @returns {Function}						Same as arg
*/
export const set_fsmlog_type = (external_fsmlog_type /*: Function */) /*: Function */ =>
	fsmlog_type = external_fsmlog_type;


export const stacks_chain = new StacksChain;


export const fsml_systate =
{
	done: false,
	quote_default_type: '"',
	no_type_farewell: false,
};


/**
 * Export object with collection of procedures as FSML external interface
 * @return	{Object}	Provide interface to FSML engine
 */
const get_fsml_instance = () /*: Object */ =>
	({
		set: { typer: set_fsmlog_type },
		type: fsmlog_type,
		stack:
			{
				type: type_stack,
				depth: () => stacks_chain .current .depth (),
			},
		eval: fsml_eval,
		run: () => eval_semantics (stacks_chain .current, stacks_chain),
		no_type_farewell: () => fsml_systate .no_type_farewell = true,
		type_farewell: (type = true) => fsml_systate .no_type_farewell = !type
	});


function fsml_eval (fsml_raw_in: string)
{
	if (fsml_systate .done)
		return { text: 'Done', done: true };

	const fsml_in = alt_split (fsml_raw_in);

	fsml_in .some (item => {
	try
	{
		const r = compile_term (item [0], item [1]) || {};

		if (fsml_systate .done = r .done)
			return true;
	}
	catch (exc)
	{
		fsmlog_type (cr + cr + 'Environment exception:');
		fsmlog_type (cr + cr + exc);
	}});

	fsml_systate .done && ! fsml_systate .no_type_farewell  &&
		fsmlog_type ('Bye-bye. See you later');

	const evaluated =
	{
		text: output_buffer,
		done: fsml_systate .done
	};

	clear_output_buffer ();

	return evaluated;
}


function type_stack ()
	{ return stacks_chain .current .type_stack () }


function alt_split (s: string): Array<Array<string>>  // <-- Draft
{
	var result = [];
	var first, last, quotype, _substring = "";

	do {
		s = s .trimLeft ();

		if (s .length === 0)
			return result;

		quotype = s [0];

		if (quotype === '"')
		{
			s = s .substring (1);
			last = s .search (/" |"$/);
		}

		else if (quotype === "'")
		{
			s = s .substring (1);
			last = s .search (/' |'$/);
		}

		else
		{
			quotype = "";
			last = s .search (/. |.$/) +1;
		}

		if (last === -1)
		{
			fsmlog_type ("OMG. No follow quotation mark. Discarded");
			return result;
		}

		_substring = s .substring (0, last);
		s = s .substring (last +1);
		result .push ([_substring, quotype]);

	} while (s .length);

	return result;
}


function compile_term (term: string, quotype: string): void
{
	let val: any;
	let as0: StackItem;

	if (!quotype && !term .trim ())
		fsmlog_type ("Warning: strange non-quoted empty term income...");

	if ((quotype === '"') || (quotype === "'"))
	{
		compilit ("String", "Str", term, stacks_chain .current, stacks_chain);
		as0 = stacks_chain .current .get (0);
		as0 .compex .quotype = quotype;

		return;
	}

	val = parseInt (term);

	if (term === val .toString ())
		{ compilit ("Number", "Num", val, stacks_chain .current, stacks_chain); return; }

	val = parseFloat (term);

	if (term === val .toString ())
		{ compilit ("Float", "Fp", val, stacks_chain .current, stacks_chain); return; }

	if (term in base_voc)
		return base_voc [term] .compile (stacks_chain .current, stacks_chain);

	compilit ("String", "Str", term, stacks_chain .current, stacks_chain);
	as0 = stacks_chain .current .get (0);
	as0 .compex .quotype = fsml_systate .quote_default_type;
}


// Test lines

const tests = (name: string): string =>
(
	name ||= 'hold-fetch',
	({
		'hold-fetch': '1234 asd ! asd @ .js .eval' // ! isnt do .js
	})
	[name] || "'\\ OMG! Bad name for test'"
);


export { get_fsml_instance };

// Bugs: dc, [ 12 ] q>l
