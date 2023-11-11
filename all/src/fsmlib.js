
/* FSML 0.5.18 */

/* FSML programming language compiler */
/* Copyright (c) 2021, 2023 Alexander (Shúrko) Stadnichénko */
/* License : BSD-2-Clause */

/* @flow */


// $FlowFixMe
import { cl, u } from 'raffinade';
// import { cl, u } from '../node_modules/raffinade/JS/raffinade.js';

// $FlowFixMe
import { fsml_systate, fsml_systate_set } from './global.js';

import
{
	compilit,					deep_copy,		new_str_uid,
	compex_to_infix_str,		base_voc,
	fsmlog_type,	set_fsmlog_type,
	output_buffer,				clear_output_buffer,
	eval_cmps as eval_semantics
}
// $FlowFixMe
from './factored.js';

// $FlowFixMe
import { Abstract_stack } from './abstract-stack.js';
// $FlowFixMe
import { Abstract_stack_item } from './as-item.js';
// $FlowFixMe
import { Compex } from './compex.js';


/* Defaults for formatting output text */

let cr = "\n";
let indent_str = " ";
let size_indent = 4;


fsml_systate_set
({
	done: false,
	need_full_substitution: false,
	quote_default_type: '"',
	no_type_farewell: false,
	current_stack: new Abstract_stack ()
});


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
				depth: () => fsml_systate .current_stack .depth (),
			},
		eval: fsml_eval,
		run: eval_semantics,
		no_type_farewell: () => fsml_systate .no_type_farewell = true,
		type_farewell: (type = true) => fsml_systate .no_type_farewell = !type
	});


function fsml_eval (fsml_raw_in: string)
{
	if (fsml_systate .done)
		return { text: 'Done', done: true };

	const fsml_in = alt_split (fsml_raw_in);

	fsml_in .forEach (item => {
		try
		{
			compile_term (item [0], item [1]);
		}
		catch (exc)
		{
			fsmlog_type (cr + cr + 'Environment exception:');
			fsmlog_type (cr + cr + exc);
		}});

	const evaluated =
	{
		text: output_buffer,
		done: fsml_systate .done
	};

	clear_output_buffer ();

	return evaluated;
}


function type_stack ()
	{ return fsml_systate .current_stack .type_stack () }


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
	let as0: Abstract_stack_item;

	if (!quotype && !term .trim ())
		fsmlog_type ("Warning: strange non-quoted empty term income...");

	if ((quotype === '"') || (quotype === "'"))
	{
		compilit ("String", "Str", term);
		as0 = fsml_systate .current_stack .get (0);
		as0 .compex .quotype = quotype;

		return;
	}

	val = parseInt (term);

	if (term === val .toString ())
		{ compilit ("Number", "Num", val); return; }

	val = parseFloat (term);

	if (term === val .toString ())
		{ compilit ("Float", "Fp", val); return; }

	if (term in base_voc)
		{ base_voc [term] .compile (); return; }

	compilit ("String", "Str", term);
	as0 = fsml_systate .current_stack .get (0);
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
