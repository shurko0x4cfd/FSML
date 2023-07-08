
/* FSML 0.5.8 */

/* FSML programming language compiler */
/* Copyright (c) 2021, 2023 Alexander (Shúrko) Stadnichénko */
/* License : BSD-2-Clause */

/* @flow */


import { cl, naturange } from 'raffinade';
// import { cl, naturange } from '../node_modules/raffinade/JS/raffinade.js';


/** Temp support to Firefox. Will be removed at time FF implement toReversed() */
!Array.prototype.toReversed &&
	Object.defineProperty(
		Array.prototype,
		'toReversed',
		{
			value: function (/* this: Array<any> */) /*: Array<any> */
			{
				return this .slice () .reverse ();
			},
			enumerable: false,
		}
	);


/* Defaults for formatting output text */

let cr /*: string */ = "\n";
let indent_str /*: string */ = " ";
let size_indent /*: number */ = 4;


/* if default 'fsmlog_type' is not overriden, accumulate fsml output for return
   to environmen at end of compilation. Otherwise use external 'fsmlog_type'
   for type immediately */

let output_buffer /*: string */ = '';


/** Default way to output is just accumulate output in buffer and then return
 * it to caller
 * @arg		{string} text	Append id to output
 * @return	{string}		Output buffer
 */
const default_fsmlog_type = (text /*: string */) /*: string */  =>
	output_buffer += text;

/* And set it as default until overriden */
let fsmlog_type /*: Function */ = default_fsmlog_type;


let BSD_2_Clause_license /*: string */ =
	` \
	Copyright (c) 2021, 2023 Alexander (Shúrko) Stadnichénko${cr}\
	${cr}\
	All rights reserved. Redistribution and use in  source and binary forms, with or${cr}\
	without modification, are  permitted provided that the  following conditions are${cr}\
	met:${cr}\
	${cr}\
	1. Redistributions of source  code must retain the above  copyright notice, this${cr}\
	list of conditions and the following disclaimer.${cr}\
	${cr}\
	2. Redistributions in  binary form  must reproduce  the above  copyright notice,${cr}\
	this list of conditions and the following disclaimer in the documentation and/or${cr}\
	other materials provided with the distribution.${cr}\
	${cr}\
	THIS  SOFTWARE IS  PROVIDED  BY THE  COPYRIGHT HOLDERS  AND  CONTRIBUTORS AS  IS${cr}\
	AND  ANY EXPRESS  OR  IMPLIED WARRANTIES,  INCLUDING, BUT  NOT  LIMITED TO,  THE${cr}\
	IMPLIED WARRANTIES OF  MERCHANTABILITY AND FITNESS FOR A  PARTICULAR PURPOSE ARE${cr}\
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT  OWNER OR CONTRIBUTORS BE LIABLE FOR${cr}\
	ANY DIRECT,  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,  OR CONSEQUENTIAL DAMAGES${cr}\
	(INCLUDING, BUT  NOT LIMITED  TO, PROCUREMENT OF  SUBSTITUTE GOODS  OR SERVICES;${cr}\
	LOSS OF USE,  DATA, OR PROFITS; OR BUSINESS INTERRUPTION)  HOWEVER CAUSED AND ON${cr}\
	ANY  THEORY  OF  LIABILITY,  WHETHER  IN CONTRACT,  STRICT  LIABILITY,  OR  TORT${cr}\
	(INCLUDING NEGLIGENCE OR  OTHERWISE) ARISING IN ANY  WAY OUT OF THE  USE OF THIS${cr}\
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;


const fsml_systate =
{
	done: false,
	need_full_substitution: false,
	quote_default_type: '"',
	no_type_farewell: false
};

const stacks_chain = [];


/* Precedence of target language operations (JS) */
const js_operation_groups_precedence =
	[
		/*  0 */ [">"],
		/*  1 */ ["+", "-"],
		/*  2 */ ["*", "/"],
		/*  3 */ ["**"]
	];


/* Now and below senseless short names like f, g, h for function factored out
   Immediately before it user */

const f /*: Function */ = (acc, arrg, idx) =>
	(arrg .forEach (itm => acc [itm] = idx), acc);

/* Convert to object { operation: precedence, ... } */
const js_operation_precedence /*: Object */ =
	js_operation_groups_precedence
		.reduce (f, {});

js_operation_precedence .leaf = 100;


/**
 * Generator of unique (within session) string id like subex_0, cond_1 etc
 * @arg		{string} prefix String prefix for uid like "subex" or "cond"
 * @return	{string}		Unique string identifier
 */
const new_str_uid =
	((uids /*: Object */ = {}) =>
		(prefix /*: string */) =>
			(prefix in uids ^ true
				&& (uids [prefix] = 0),
			 prefix + "_" + uids [prefix] ++))();


class Abstract_stack {
	this /*: Abstract_stack */;
	dc /*: Function */ = deep_copy;

	dc_postprocess = function (obj /*: Object */) /*: Object */
	{
		obj.str_uid = new_str_uid ("quotation");
		obj.actual_target_names = false;

		return obj;
	}

	str_uid /*: string */ = new_str_uid ("quotation");
	flags /*: Array<string> */ = [];

	// When performed deep copy of quotation we need to reset cached identifiers
	// of target language in copy because old names belong to original quotation
	actual_target_names = true;

	// Indexes is comparative, absolute value is never matter
	utmost_computing_order = 0;

	// For translation with no assign real order for stackitems
	pseudo_order = 0;

	tail_starts_from = 0; // Even if container presented ?
	container /*: Array<Object> */ = [];
	assignments /*: Array<Abstract_stack_item> */ = [];

	_need_id_substitution /*: Compex */;
	isloop = false;
	ordered_subexpressions /*: Array<any> */ = [];

	// [ "str", "str", ... "str" ] Precalculated function argument names
	// or top stack values at loop start if any
	predefined_argument_names /*: Array<string> */ = [];
	item_names /*: Array<string> */ = [];
	another_item_names /*: Array<string> */ = [];

	kind_of_next_compilation = "no-incomings";

	compiled_function_name_if_named = "";

	target_text = "";
	aliastatement = "";
	indent_size = 0;
	return_statement = "";
	return_items /*: Array<any> */ = [];
	evalresult /*: Array<any> */ = [];
	uids_already_in_equation_left /*: Array<any> */ = [];
	str_uids_to_rename /*: Array<any> */ = [];

	// spoiled?
	depth = () /*: number */ => { return this .container .length; }
}

let current_stack = new Abstract_stack ();


/**
 * Set external callback as typer instead of accumulate in output buffer
 * @arg		{Function} external_fsmlog_type	External callback provide typing
 * @returns {Function}						Same as arg
 */
const set_fsmlog_type = (external_fsmlog_type /*: Function */) /*: Function */ =>
	fsmlog_type = external_fsmlog_type;


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
				depth: () => current_stack .depth ()
			},
		eval: fsml_eval,
		no_type_farewell: () => fsml_systate .no_type_farewell = true,
		type_farewell: (type = true) => fsml_systate .no_type_farewell = !type
	});


/** Perform deep copy of one top stack item. Quite obsoleted */

function deep_copy () /*: any */
{
	const new_object = new this .constructor ();

	for (const i of Object.keys(this))
		new_object [i] = this [i];

	if (new_object .comparative_computing_order)
	{
		++current_stack .utmost_computing_order; // ! Why exactly current stack ?

		// M.b. '.get_next_computing_order ()' ?
		new_object .comparative_computing_order =
			current_stack .get_utmost_computing_order ();
	}

	for (const i in Object .keys (new_object))
	{
		const item = new_object [i];
		const duplicable =
			Array.isArray (item) || item && item .constructor === Object .constructor;

		if (!duplicable) continue;

		const dc = item .dc;
		new_object [i] = typeof dc === 'function' ? dc () : deep_copy .apply (item);
	}

	const dc_postprocess = this .dc_postprocess;
	return dc_postprocess ? dc_postprocess (new_object) : new_object;
}


var as_proto = Abstract_stack .prototype;

// as_proto .depth = function () { return this .container .length; }

as_proto .items_digest =
	function () { return this .container .slice (); }

as_proto .push = function (item) { this .container .push (item); }


as_proto .get_next_computing_order = function ()
	{ return ++this .utmost_computing_order; }


as_proto .to_next_computing_order = function ()
	{ ++this .utmost_computing_order; }


as_proto .get_next_pseudo_order = function ()
	{ return ++this .pseudo_order +this .utmost_computing_order; }


as_proto .reset_pseudo_order = function ()
	{ this .pseudo_order = 0; }


as_proto .get_utmost_computing_order = function ()
	{ return this .utmost_computing_order; }


as_proto .set_flag = function (flag)
	{ (flag in this .flags) || (this .flags .push (flag)) }


as_proto .check_flag = function (flag)
	{ return this .flags .includes (flag); }


as_proto .extend_stack_if_necessary = function (index)
{
	let c = this .container,
		l = c.length;

	if (index + 1 > l)
	{
		let lack = index + 1 - l;
		this .container = this .materialize_tail (lack) .concat (c);
		this .tail_starts_from += lack;
	}
}


as_proto .materialize_tail = function (lack)
{
	var tail = [];

	for (let var_index = this .tail_starts_from + lack - 1;
		var_index >= this .tail_starts_from; var_index--)
			tail .push (new_var_item (var_index));

	return tail;
}


as_proto .get_quotation_item =
	function ()
	{
		const asi    = new Abstract_stack_item (),
		      compex = asi .compex;
		compex .type = "Quotation";
		compex .shortype = "Q";
		compex .operand [0] = this;
		compex .operator = base_voc ["quotation"];

		return asi;
	}


/*
// TODO: test this variant instead of the get_quotation_item () above

as_proto .get_quotation_item =
	(asi = undefined, compex = undefined) =>
	(
		asi    = new Abstract_stack_item (),
		compex = asi .compex,
		compex .type        = "Quotation",
		compex .shortype    = "Q",
		compex .operand [0] = asi,
		compex .operator    = base_voc ["quotation"],

		asi
	);
*/


as_proto .pop  = function ()
{
	const index = 0;
	this .extend_stack_if_necessary (index);
	const c = this .container;

	return c .pop ();
}


as_proto .get =
	function (index)
	{
		this .extend_stack_if_necessary (index);
		var c = this .container;
		var l = c .length;
		return c [l -1 -index];
		// return this .container .at (-index - 1);
	}


as_proto .set  = function (index, value){
	this .extend_stack_if_necessary (index);
	var c = this .container;
	var l = c .length;
	c [l -1 -index] = value; }


as_proto .need_id_substitution =
	function () { return this ._need_id_substitution }


as_proto .type_stack = function ()
{
	const self = this;
	fsml_systate .need_full_substitution = true;

	this .order_subexpressions ();

	const reversed_stack = current_stack .container .toReversed (),
		fsml_out = [];

	reversed_stack .forEach (function (item)
	{
		self ._need_id_substitution = item .compex;
		fsml_out .push (compex_to_infix_str (item .compex));
	});

	return fsml_out;
}


as_proto .translate_to_js = function ()
{
	const self = this;
	const indent_string =  indent_str .repeat (current_stack .indent_size);
	fsml_systate .need_full_substitution = false; // ! Bad place
	this .uids_already_in_equation_left = [];
	this .str_uids_to_rename = [];

	// ! for same compexes item override id next time unlike case next item equal previous
	// ! write to targrt_str_uid have no effect to suppliers
	this .item_names .forEach ((item, index) =>
		{
			const element = self .container [index] .compex;

			element .target_str_uid = item;

			element .check_flag ("deliverer") &&
				element .set_target_str_uid (item);
		});

	this .order_subexpressions ();

	this .target_text = "";
	let specr = "\n"; // <- For avoid first cr. Not in use

	function process_expression (item, index)
	{
		var compex = item [0];
		var syn_list = item [1];

		self ._need_id_substitution = compex;
		var translated_expression = compex_to_infix_str (compex);
		var syn = "", syn_declarations = "", comma = "";

		if (syn_list .length > 1)
		{
			syn_declarations = specr + indent_string + "var ";
		  	specr = cr;

			syn_list .forEach (item =>
			{
				if (!item) // ! Can be undefined, is issue and call for fix
				{
					cl ("item undefined or \"\"");
					cl (item);

					fsmlog_type ('item undefined or ""');

					return;
				}

				if (item === translated_expression) return;

				syn += item + " = ";
				syn_declarations += comma + item;
				comma = ", ";
			});

			syn_declarations += ";";
		}

		if (syn_list .length === 1)
		{
			var syn_item = syn_list [0];

			if (syn_item && (syn_item !== translated_expression))
				syn = "var " + syn_item + " = ";

			if (syn_item && (syn_item === translated_expression))
				syn = ""; // "/* Tautology '" +syn_item +" = " +syn_item +"' excluded */"; } }
		}

		let target_str_uid = compex .get_target_str_uid ();

		if (compex .operator .check_flag ("no_equation") || compex .check_flag ("no_equation"))
		{
			self .target_text += specr + translated_expression;
			specr = cr;
		}
		else
		{
			if (syn)
			{
				self .target_text +=
					syn_declarations
						+ cr + indent_string + syn + translated_expression + ";";

				syn_list .forEach (item =>
					self .uids_already_in_equation_left .push (item));
			}

			// For excluding tautology ala 'let name = name;'
			if (!syn && translated_expression !== target_str_uid)
			{
				self .target_text +=
					specr + indent_string
						+ "var " + target_str_uid
							+ " = " + translated_expression + ";";

				self .uids_already_in_equation_left .push (target_str_uid);
				specr = cr;
			}
		}
	}

	this .ordered_subexpressions .forEach (group =>
		group .forEach (process_expression));

	var str_uids_to_rename = current_stack .str_uids_to_rename;
	current_stack .aliastatement = "";

	if (str_uids_to_rename .length)
	{
		var comma = "";
		str_uids_to_rename .forEach ((item, index) =>
		{
			current_stack .aliastatement +=
				comma +item +"_copy" +" = " +item;

			comma = "," + cr + indent_string + indent_str .repeat (size_indent * 2);
		});

		if (current_stack .aliastatement)
			current_stack .aliastatement =
				cr + indent_string + indent_str .repeat (size_indent) + "var "
					+ current_stack .aliastatement + ";" + cr;
	}

	if (current_stack .isloop)
		current_stack .target_text =
			current_stack .aliastatement + current_stack .target_text;
}


function translate_empty_quotation (indent_size, item_names, another_item_names)
{
	var target_text = "";
	var var_declarations = "";
	var assign_statement = "";
	let comma = "", equation = "";

	var indent_string =  indent_str .repeat (indent_size);

	item_names = item_names || [];

	item_names .forEach (function (item, index)
	{
		if (! item) return;

		var_declarations =
			var_declarations +comma    +item;

		assign_statement =
			assign_statement +equation +item;

		comma = ", "; equation = " = ";
	});

	another_item_names .forEach (item =>
		{
			if (item .length === 0) return;

			var_declarations =
				var_declarations +comma    +item .join (", ");

			assign_statement =
				assign_statement +equation +item .join (" = ");

			comma = ", "; equation = " = ";
		});

	if (var_declarations)
		var_declarations = "var " +var_declarations +";";

	if (assign_statement)
		assign_statement += " = undefined;";

	if (var_declarations || assign_statement)
	{
		target_text = cr + indent_string + var_declarations
			+ cr + indent_string + assign_statement;
	}

	return target_text;
}


as_proto .get_target_text = function () { return this .target_text; }


as_proto .get_return_items =
	function ()
	{
		return this .return_items .map (compex =>
			compex .get_target_str_uid ());
	}


as_proto .get_return_statement = function ()
{
	return "return [ "
		  + this .get_return_items () .join (", ")
		  + " ];";
}


as_proto .order_subexpressions = function ()
{
	const self = this;
	this .ordered_subexpressions = [];
	this .reset_pseudo_order ();
	this .return_items = [];

	const stack = current_stack .items_digest ();

	stack .forEach ((item, position) =>
		self ._order_subexpressions (item .compex, item, position));

	current_stack .assignments .forEach ((item, position) =>
		self ._order_subexpressions (item .compex, {}, position));

	this .return_items .reverse ();
}


as_proto ._order_subexpressions = function (compex, item, position)
{
	const operator = compex .operator;

	if ((operator === base_voc ["var"]) &&
			(compex !== item .compex))
				return;

	const _synonymous = synonymous (compex);

	const like_subex =
		compex .reference_count > 1 ||
			compex .check_flag ("subex") || operator .check_flag ("nopure");

	if (like_subex)
	{
		var str_uid;

		if (this .actual_target_names)
			str_uid = compex .get_target_str_uid ();
		else
			str_uid = new_str_uid ("subex");

		append_to_order (compex .comparative_computing_order,
			compex, _synonymous);

		compex .target_str_uid = str_uid;
	}

	const is_stack_item = compex === item .compex;

	if (is_stack_item && !like_subex)
	{
		if (compex .comparative_computing_order !== undefined)
			var order = compex .comparative_computing_order;
		else
			var order = current_stack .get_next_pseudo_order ();

		append_to_order (order, compex, _synonymous);
	}

	if (is_stack_item)
	{
		compex .get_target_str_uid ();
		this .return_items .push (compex);
	}

	if (operator .check_flag ("nowalk"))
		return;

	if (operator === base_voc ["leaf"])
		return;

	//if (operator === base_voc ["var"]) { return; }

	for (var i = compex .operands_offset;  i < compex .operand .length; i++)
	{
		const operand = compex .operand [i];
		operand && this ._order_subexpressions (operand, item, position);
	}
}


function append_to_order (order, compex, _synonymous)
{
	const ordered_subexpressions = current_stack .ordered_subexpressions;

	if (! ordered_subexpressions [order])
		ordered_subexpressions [order] = [];

	const subexpressions = ordered_subexpressions [order];

	for (const index in subexpressions)
		if (subexpressions [index][0] === compex) return;

	ordered_subexpressions [order] .push ([compex, _synonymous]);
}


function synonymous (compex)
{
	let synonymous = [];
	const stack_items = current_stack .items_digest ();

	if (current_stack .item_names .length === 0)
		return synonymous;

	stack_items .forEach (function (item, index)
		{
			if (stack_items [index] .compex === compex )
			{
				synonymous =
					synonymous .concat (current_stack
						.another_item_names [index]);

				const name = current_stack .item_names [index];

				if (!name) return;

				synonymous .push (name);
			}
		});

	return synonymous;
}


function fsml_eval (fsml_in)
{
	if (fsml_systate .done)
		return { text: 'Done', done: true };

	fsml_in = alt_split (fsml_in);

	for (let i in fsml_in)
		try
		{
			compile_term (fsml_in [i][0], fsml_in [i][1]);
		}
		catch (exc)
		{
			fsmlog_type ('Environment exception:');
			fsmlog_type (cr + cr + exc);
		}

	const evaluated =
	{
		text: output_buffer,
		done: fsml_systate .done
	};

	output_buffer = '';

	return evaluated;
}


function type_stack ()
	{ return current_stack .type_stack () }


function alt_split (s)  // <-- Draft
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


function compile_term (term, quotype)
{
	var val;

	if (!quotype && !term .trim ())
		fsmlog_type ("Warning: strange non-quoted empty term income...");

	if ((quotype === '"') || (quotype === "'"))
	{
		compilit ("String", "Str", term);
		var as0 = current_stack .get (0);
		as0 .compex .quotype = quotype;

		return;
	}

	term === "NaN" &&
		fsmlog_type ("Warning: strange 'NaN' term income...");

	val = parseInt (term);

	if (term === val .toString ())
		{ compilit ("Number", "Num", val); return; }

	val = parseFloat (term);

	if (term === val .toString ())
		{ compilit ("Float", "Fp", val); return; }

	if (term in base_voc)
		{ base_voc [term] .compilation_semantics (); return; }

	compilit ("String", "Str", term);
	var as0 = current_stack .get (0);
	as0 .compex .quotype = fsml_systate .quote_default_type;

	return;
}


function FsmlOperation (true_name,
	flags, compilation_semantics, target_translation_semantics)
{
	this .true_name = true_name;
	this .flags = flags;
	this .compilation_semantics = compilation_semantics;
	this .translate_to_target = target_translation_semantics;
}


FsmlOperation .prototype .check_flag =
	Abstract_stack .prototype .check_flag;


var base_voc = {
	// "":    new FsmlOperation ("", [], _semantics, _target_translation_semantics),

	"license":  new FsmlOperation ("license", [],  license_semantics),
	"bb":		new FsmlOperation ("bb", [], bb_semantics),
	"help":		new FsmlOperation ("help", [], help_semantics),

	"tojs":		new FsmlOperation ("tojs", [], tojs_semantics),
	".js":		new FsmlOperation (".js", [], dot_js_semantics),
	"eval":		new FsmlOperation ("eval", [], eval_semantics),
	".eval":	new FsmlOperation (".eval", [], dot_eval_semantics),
	".test":	new FsmlOperation (".test", [], dot_test_semantics),
	"red":		new FsmlOperation ("red", [], red_semantics),

	"leaf":		new FsmlOperation ("leaf", ["nowalk"]),

	"quotation":	new FsmlOperation ("quotation", ["nowalk"], undefined,
		quotation_target_translation_semantics),

	"var":		new FsmlOperation ("var", ["nowalk"]),

	"ordered":	new FsmlOperation ("ordered", [], orderd_semantics),

	"[":		new FsmlOperation ("[", [], open_quotation_semantics),
	"]":		new FsmlOperation ("]", [], close_quotation_semantics),
	"apply":	new FsmlOperation ("apply", [], apply_semantics),

	"+":		new FsmlOperation
		("+", [], undefined, plus_target_translation_semantics),

	"-":		new FsmlOperation
		("-", [], undefined, minus_target_translation_semantics),

	"*":		new FsmlOperation
		("*", [], undefined, mult_target_translation_semantics),

	"/":		new FsmlOperation
		("/", [], undefined, div_target_translation_semantics),

	"pow":		new FsmlOperation
		("pow", [], undefined, pow_target_translation_semantics),

	">":		new FsmlOperation
		(">", [], undefined, great_target_translation_semantics),

	"!": new FsmlOperation
		(
			"!", [],
			exclamark_semantics,
			exclamark_target_translation_semantics
		),

	"@":		new FsmlOperation ("@", [], fetch_semantics),

	"id":		new FsmlOperation ("id", [], id_semantics),

	"identifier":	new FsmlOperation("identifier", ["nowalk"],
		undefined, identifier_target_translation_semantics),

	// Oneliner
	// Treat an expression on tos as an anonymous procedure of the form:
	// (vars in expression if any) => one expression with vars if any
	// Oneliner can be assigned to a target identifier via !
	// 12 34 + ol summer ! .js
	// \ var summer = () => 12 + 34;
	// 1 + ol increment ! .js
	// \ var increment = (var_0) => var_0 + 1;
	"ol": new FsmlOperation
		(
			"ol",
			[],
			undefined,
			ol_target_translation_semantics
		),

	"ind":		new FsmlOperation ("ind", [], independent_semantics),
	"i":		new FsmlOperation ("i",   [], independent_semantics),

	"dc" :		new FsmlOperation ("dc",  [], deep_copy_semantics),
	"depth":	new FsmlOperation ("depth", [], depth_semantics),
	"drop":		new FsmlOperation ("drop", [], drop_semantics),
	"dp":		new FsmlOperation ("dp", [], drop_semantics),
	"dup":		new FsmlOperation ("dup", [], dup_semantics),
	"swap":		new FsmlOperation ("swap", [], swap_semantics),
	"over":		new FsmlOperation ("over", [], over_semantics),

	// Converting a quotation to a JS list/array whenever possible
	"q>l" :	new FsmlOperation
	(
		"quotolist",
		["subex"],
		to_list_semantics,
		list_target_translation_semantics
	),

	// New empty JS list/array
	"list":		new FsmlOperation
	(
		'list',
		[],
		empty_list_semantics,
		list_target_translation_semantics
	),

	"naturange": new FsmlOperation
	(
		"naturange",
		[],
		undefined,
		naturange_target_translation_semantics
	),

	"if" :		new FsmlOperation
		("if",  ["no_equation"], if_semantics, if_target_translation_semantics),

	"if_supplier":		new FsmlOperation
		("if_supplier", [], undefined, if_supplier_target_translation_semantics),

	"while" :	new FsmlOperation
		("while",  ["no_equation"],
			while_semantics, while_target_translation_semantics),

	"while_supplier":	new FsmlOperation
		("while_supplier", [], undefined,
			while_supplier_target_translation_semantics),

	/*"until": new FsmlOperation ("until", [], until_semantics, until_target_translation_semantics),*/

	// push_target_translation_semantics
	"push":		new FsmlOperation
		("push", ["nopure",],
			push_semantics, push_target_translation_semantics),

	"1fold": new FsmlOperation
	(
		"1fold",
		[],
		undefined,
		one_fold_target_translation_semantics
	),

	"time":		new FsmlOperation
		("time", ["nopure", "nowalk"],
			time_semantics, time_target_translation_semantics)

//    "nopure": new FsmlOperation ("nopure", ["nopure"], nopure_semantics, nopure_target_translation_semantics)
};


["+", "-", "*", "/", "pow", ">", "naturange", "1fold"] .forEach (term =>
	base_voc [term] .compilation_semantics =
		trivial_binary_operation (base_voc [term]));


["ol"] .forEach (term =>
	base_voc [term] .compilation_semantics =
		trivial_unary_operation (base_voc [term]));


function open_quotation_semantics ()
{
	stacks_chain .push (current_stack);
	current_stack = new Abstract_stack ();
}


function close_quotation_semantics ()
{
	stacks_chain .length ||
		fsmlog_type ("OMG. You can't. You are in root quotation");

	if (! stacks_chain .length)
		return;

	const q = current_stack .get_quotation_item ();
	current_stack = stacks_chain .pop ();
	current_stack .push (q);
}


function tojs_semantics ()
	{ current_stack .translate_to_js () }


function dot_js_semantics ()
{
	tojs_semantics ();
	fsmlog_type (current_stack .get_target_text ());
}


function eval_semantics ()
{
	current_stack .translate_to_js (); // Upd jsource

	const evalstr =
		"(function (){ "
		+ (current_stack .get_target_text ()
			+ current_stack .get_return_statement ())
				.replace (new RegExp (cr, 'g'), "")
				.replace (/\&nbsp;/g,"")
		+ " })();";

	// TODO: add try/catch
	return current_stack .evalresult = eval (evalstr);
}


function dot_eval_semantics ()
{
	const evalresult_raw = eval_semantics (),

	// If result is str with ',' ?
	evalresult_formatted =
		"evaluated stack: [ "
		+ evalresult_raw .toString () .replace (/,/g,", ") + " ]";

	fsmlog_type (evalresult_formatted);
}


function dot_test_semantics ()
{
	const test_name =
		current_stack .pop () .compex .operand [0] || '',
		test = tests (test_name) || '';

	fsml_eval (test);

	// TODO: DRY
	const evalstr =
		"(function (){ "
		+ (current_stack .get_target_text ()
			+ current_stack .get_return_statement ())
				.replace (new RegExp (cr, 'g'), "")
				.replace (/\&nbsp;/g,"")
		+ " })();";

	const evalresult =
		current_stack .evalresult = eval (evalstr);

	const evalresult_formatted =
		"evaluated stack: [ "
		+ evalresult .join (", ") + " ]";
		// + evalresult .toString () .replace (/,/g,", ") + " ]";

	fsmlog_type (evalresult_formatted);
}


function red_semantics ()
{
	var as0 = current_stack .get (0);

	fsml_systate .need_full_substitution = true; // Bad place for this 3 line
	current_stack .order_subexpressions ();
	current_stack ._need_id_substitution = as0 .compex;

	var eval_result = eval (compex_to_infix_str (as0 .compex));

	as0 .compex .dereference ();

	as0 .compex =
		create_binary_compex (eval_result, undefined, base_voc ["leaf"]);

	/* FIXME Much much better if create_binary_compex will do it */
	as0 .compex ["type"] = "Reduced";
	as0 .compex ["shortype"] = "Red";

	if (typeof eval_result === "string")
	{
		as0 .compex .quotype = '"';
		as0 .compex ["type"] = "String";
		as0 .compex ["shortype"] = "Str";
	}
	else
		as0 .compex .quotype = "";
}


function quotation_target_translation_semantics (operand)
{
	var translate_kind = operand [1];

	if (! translate_kind)
		return '"Quot"';

	var quotation = operand [0];

	stacks_chain .push (current_stack);
	current_stack = quotation;
	current_stack .actual_target_names = false;
	current_stack .translate_to_js ();

	var text = current_stack .target_text;
	current_stack = stacks_chain .pop ();

	return text;
}


// _Postfix_ compound expression - node of semantic graph

class Compex
{
	constructor (operands, operator)
	{
		this.operand  = operands;
		this.operator = operator;
	}

	dc = deep_copy;

	dc_postprocess = function (obj)
	{
		// if str_uid is charact of rels must be the same for Q
		obj .str_uid = new_str_uid ("compex");
		obj .target_str_uid = undefined;

		return obj;
	}

	frozen = false;
	flags = [];
	// immaname
	str_uid = new_str_uid ("compex");
	target_str_uid = undefined;
	operands_offset = 0;
	reference_count = 1;
	comparative_computing_order = current_stack .utmost_computing_order;
	// comparative_computing_order = // ?
	//		current_stack .get_next_computing_order ();
	type     = "Expression";
	shortype = "Exp";
}


Compex .prototype .set_flag   = as_proto .set_flag;
Compex .prototype .check_flag = as_proto .check_flag;


Compex .prototype .dereference = function ()
{
	if (this .reference_count === 0)
	{
		fsmlog_type
			("OMG. You attempt to dereference compex with zero reference count");
		return;
	}

	// this .reference_count--; // -= 1;

	(--this .reference_count === 0) &&
		! this .frozen &&
			this .dereference_operands ();
}


Compex .prototype .dereference_operands = function ()
{
	this .frozen ||
		this .operand .forEach (item =>
			item && item .dereference && item .dereference ());
}


Compex .prototype .freeze   = function () { this .frozen = true }


Compex .prototype .unfreeze = function ()
{
	this .frozen = false;

	this .reference_count < 0 &&
		fsmlog_type ("OMG. You unfreeze compex with negate value");

	this .reference_count === 0 &&
		this .dereference_operands ();
}


Compex .prototype .reference = function ()
{
	this .reference_count += 1;

	// if (!this .comparative_computing_order && this .reference_count > 0) // Check '&& this .reference_count >0' ?
	if (this .reference_count > 0)
	{
		this .comparative_computing_order =
			current_stack .get_next_computing_order ();

		current_stack .to_next_computing_order ();
	}
}

/* Not in use now */
Compex .prototype .reference_no_subex = function ()
	{ this .reference_count += 1 }


Compex .prototype .get_target_str_uid =
	function () { return this .target_str_uid ||= new_str_uid ("subex") }


function create_binary_compex (operand_0, operand_1, operator)
	{ return new Compex ([operand_0, operand_1], operator) }


function create_unary_compex (operand_0, operator)
	{ return new Compex ([operand_0], operator) }


class Abstract_stack_item
{
	dc = deep_copy;

	dc_postprocess =
		function (obj)
		{
			obj .str_uid = new_str_uid ("stackitem");
			return obj;
		}

	str_id = new_str_uid ("stackitem");
	reference_count = 1;
	compex = create_binary_compex ();
}


Abstract_stack_item .prototype .dereference = function ()
{
	if (this .reference_count === 0)
	{
		fsmlog_type ("OMG. You attempt to dereference stack item with zero reference count");
		return;
	}

	this .reference_count -= 1;

	this .reference_count ||
		this .compex .dereference ();
}

Abstract_stack_item .prototype .reference =
	function ()	{ this .reference_count += 1 }


function new_stack_item (type, shortype, value, operation)
{
	const asi = new Abstract_stack_item ();

	asi .compex .type = type;
	asi .compex .shortype = shortype;
	asi .compex .operand [0] = value;
	asi .compex .operator = base_voc [operation];

	return asi;
}


function compilit (type, shortype, value)
	{ current_stack .push (new_stack_item (type, shortype, value, "leaf")) }


function new_var_item (var_index)
	{ return new_stack_item ("Variable", "var", var_index, "var") }


function compex_to_infix_str (compex, opts = {})
{
	var operator = compex .operator;

	if (operator === base_voc ["var"])
	{
		if (current_stack .predefined_argument_names .length)
		{
			const name_index = compex .operand [0];
			const name = current_stack .predefined_argument_names [name_index];

			if (current_stack .isloop &&
				current_stack .uids_already_in_equation_left .includes (name))
			{
				current_stack .str_uids_to_rename .push (name);
				return name +"_copy" ;
			}

			return name;
		}
		else
			return "var_" +compex .operand [0];
	}

	if ((compex .reference_count > 1 || operator .check_flag ("nopure"))
		&& !(current_stack .need_id_substitution () === compex)
		&& !fsml_systate .need_full_substitution )
	{
		var name = compex .get_target_str_uid ();

		if (current_stack .isloop &&
			current_stack .uids_already_in_equation_left .includes (name))
		{
			current_stack .str_uids_to_rename .push (name);
			return name +"_copy";
		}

		return name;
	}

	if (operator === base_voc ["leaf"])
	{
		var leaf = compex .operand [0] .toString ()
		const quotype = compex .quotype;

		if (quotype)
			leaf = quotype + leaf + quotype;

		return leaf;
	}

	return operator .translate_to_target (compex .operand, compex, opts);
}


function _substitute_variables (compex, p, n)
{
	var operator = compex .operator;

	if (compex .reference_count > 1 || operator .check_flag ("nopure"))
	{
		compex .comparative_computing_order +=
			current_stack .get_utmost_computing_order ();

		if (new_utmost_order < compex .comparative_computing_order)
			new_utmost_order = compex .comparative_computing_order;
	}

	if (operator === base_voc ["var"])
	{
		var placeholder = p .operand [n] || new Compex ();
		var substitutional = current_stack .get (compex .operand [0]) .compex;
		p .operand [n] = substitutional;

		placeholder .check_flag ("subex") &&
			substitutional .set_flag ("subex");

		/* if (placeholder .comparative_computing_order &&
			substitutional .comparative_computing_order)
		  { s = "Warning: placeholder .comparative_computing_order &&
		  		substitutional .comparative_computing_order";
			fsmlog_type (s); } */

		if (placeholder .comparative_computing_order
			&& !substitutional .comparative_computing_order)
				substitutional .comparative_computing_order =
					placeholder .comparative_computing_order;
			/* s = "Warning: placeholder .comparative_computing_order &&
				!substitutional .comparative_computing_order";
			fsmlog_type (s); */

		if (!placeholder .comparative_computing_order
			&& substitutional .comparative_computing_order)
		{
			let s = "Warning: ! placeholder .comparative_computing_order && \
				substitutional .comparative_computing_order";
			fsmlog_type (s);
		}

		p .operand [n] .reference_no_subex (); /*_no_subex ();*/ // ! Palliative. FIXME

		if (new_utmost_order < p .operand [n] .comparative_computing_order)
			new_utmost_order = p .operand [n] .comparative_computing_order;

		// new_utmost_order =
		//		Math.max (new_utmost_order, p .operand [n] .comparative_computing_order);

		return;
	}

	if (operator .check_flag ("nowalk") ||
		operator === base_voc ["leaf"]
			|| operator === base_voc ["quotation"])
				return;

	for (var i = compex .operands_offset;  i < compex .operand .length; i++)
		_substitute_variables (compex .operand [i], compex, i);
}


function substitute_variables (item)
{
	const pseudo_compex = { "operand": [] };

	_substitute_variables (item .compex, pseudo_compex, 0);

	if (pseudo_compex .operand [0])
		item .compex = pseudo_compex .operand [0];
}


let new_utmost_order = 0;

function apply_semantics ()
{
	const as0		= current_stack .pop ();
	const quotation	= as0 .compex .operand [0];
	const touched	= quotation .tail_starts_from;
	const quotation_items = quotation .items_digest ();

	new_utmost_order = 0; // <-- nonlocal

	touched > 0 &&
		current_stack .extend_stack_if_necessary (touched - 1);

	const current_items	= current_stack .items_digest ();
	const current_num   = current_items .length;

	const head = current_items .slice (current_num - touched);
	const tail = current_items .slice (0, current_num - touched);

	const assignments = quotation .assignments .slice ();

	for (const i in quotation_items)
		substitute_variables (quotation_items [i]);

	for (const i in assignments)
		substitute_variables (assignments [i]);

	head .forEach (item => item .dereference ());

	const  new_container = tail .concat (quotation_items);
	current_stack .container = new_container;

	current_stack .assignments =
		current_stack .assignments .concat (assignments);

	current_stack .utmost_computing_order = new_utmost_order;
}


/** New empty JS-like list/array */
function empty_list_semantics ()
{
	open_quotation_semantics ();
	close_quotation_semantics ();
	to_list_semantics ();
}


/** Limited convertion quotation to JS list */
function list_target_translation_semantics (operand, parent, opts)
{
	if (fsml_systate .need_full_substitution)
		return parent .str_uid;

	if (opts .requested === 'target uid')
		return parent .get_target_str_uid ();

	const quotation = operand [0] .operand [0];

	stacks_chain .push (current_stack);
	current_stack = quotation;
	current_stack .translate_to_js ();

	const text =
		"[ "
		+ current_stack .get_return_items () .toReversed () .join (", ")
		+ " ]";

	current_stack = stacks_chain .pop ();

	return text;
}


/** Limited convertion quotation to JS list */
function to_list_semantics ()
{
	const as0       = current_stack .get (0);
	const quotation = as0 .compex .dc ();
	const asi       = new_stack_item ("list", "lst", quotation, "q>l");

	quotation ?. dc_postprocess (quotation);
	quotation .set_flag ("no_equation");
	quotation .operand [1] = {}; // wtf?
	quotation .set_flag ("subex"); // wtf?
	asi .compex .set_flag ("subex");
	asi .compex .str_uid = new_str_uid ("list");
	quotation .reference (); // FIXME?
	as0 .dereference ();

	quotation .comparative_computing_order =
		current_stack .get_next_computing_order ();

	asi .compex .comparative_computing_order =
		current_stack .get_next_computing_order ();

	current_stack .set (0, asi);
}


function naturange_target_translation_semantics (operand, compex, opts)
{
	if (fsml_systate .need_full_substitution)
		return compex .str_uid;

	if (opts .requested === 'target uid')
		return compex .get_target_str_uid ();

	const starts_from = compex_to_infix_str (operand [1]);
	const lim         = compex_to_infix_str (operand [0]);

	return `() => naturange(${starts_from}, undefined, ${lim})`;
}


function one_fold_target_translation_semantics (operand, compex, opts)
{
	if (fsml_systate .need_full_substitution)
		return compex .str_uid;

	if (opts .requested === 'target uid')
		return compex .get_target_str_uid ();

	const iterable = compex_to_infix_str (operand [0]);
	const folder   = compex_to_infix_str (operand [1]);
	// For get unquoted string, compex_to_infix_str (operand [1])
	// return quoted string
	// const folder   = operand [1] .operand [0];

	const padding = indent_str .repeat (size_indent);

	return `														\
	${cr}${padding}(() => {											\
		${cr}${padding .repeat (2)}let acc = 1;						\
		${cr}${padding .repeat (2)}for (let i of (${iterable})())	\
			${cr}${padding .repeat (3)}acc = ${folder}(i, acc);		\
		${cr}${padding .repeat (2)}return acc;						\
	${cr}${padding}})()`;
}


// How you plan to implement deep copy of if_object ? Now this impossible
// Btw, 'dc' operate on object refered by top element stack, but if_object is
// not referd by nothing beside deliverer. 'dc' on deliverer produce copy
// of deliverer (?), not if_object

function if_semantics ()
{
	var if_compex = new Compex ([], base_voc ["if"]);

	var quotation_true  = current_stack .get (1) .compex .operand [0];
	var quotation_false = current_stack .get (0) .compex .operand [0];

	// If one or both quotation produce nothing ([ ], [ drop ],
	// [ 1234 somevariablename ! ], etc) then quotations
	// allowed to be NOT commensurable

	if ( quotation_true  .container .length !== quotation_false .container .length
	  && quotation_true  .container .length !== 0
	  && quotation_false .container .length !== 0)
	{
		fsmlog_type ("OMG. True and false quotations is not commensurable");
		return;
	}

	var production_count =
		quotation_true .container .length ||
			quotation_false .container .length;

	var touched =
		Math .max (quotation_true .tail_starts_from,
			quotation_false .tail_starts_from);

	for (var i = 0; i < touched + 3; i++)
	{
		independent_semantics ();

		var item = current_stack .pop ();

		item .compex .set_flag ("subex");

		item .compex .comparative_computing_order = // ||=
			item .compex .comparative_computing_order ||
				current_stack .get_next_computing_order ();

		if_compex .operand [i] = item .compex;
	}

	if_compex .set_flag ("subex");

	if_compex .comparative_computing_order =
		current_stack .get_next_computing_order ();

	if_compex .operand [2] .target_str_uid = new_str_uid ("cond");
	if_compex .operands_offset = 2;

	if_compex .reference_count =
		if_compex .item_names_count =
			production_count;

	// Firstly added correspond to top of stack etc
	var item_names = if_compex .item_names = [];

	if_compex .another_item_names = [];

	for (var i = 0; i < if_compex .item_names_count; i++)
	{
		if_compex .item_names .push (new_str_uid ("subex"));
		if_compex .another_item_names .push ([]);
	}

	function get_target_str_uid ()
	{
		return this .operand [1] .item_names [this .operand [0]];
	}

	function set_target_str_uid (obtrusive_id)
	{
		this .operand [1] .item_names [this .operand [0]] = obtrusive_id;
	}

	function add_target_str_uid (obtrusive_id)
	{
		this .operand [1] .another_item_names [this .operand [0]]
			.push (obtrusive_id);
	}

	for (var i = 0; i < if_compex .reference_count; i++)
	{
		const item =
			new_stack_item
				("if_supplier", "if_supplier", undefined, "if_supplier");

		/* temp */ item .compex .dc = function () { return this; } /* temp */

		item .compex .operands_offset = 1;
		item .compex .operand [0] = production_count - i - 1;
		item .compex .operand [1] = if_compex;
		/* item .compex .set_flag ("subex"); */
		item .compex .set_flag ("deliverer");

		item .compex .get_target_str_uid = get_target_str_uid;
		item .compex .set_target_str_uid = set_target_str_uid;
		item .compex .add_target_str_uid = add_target_str_uid;

		current_stack .push (item);
	}
}


function quot_to_js (obj, quot, arg_names_for_quotation, new_indent)
{
	const transpiled = {};

	if (quot .container .length !== 0)
	{
		stacks_chain .push (current_stack);
		current_stack = quot;

		current_stack .item_names =
			obj .item_names .toReversed ();

		current_stack .another_item_names =
			obj .another_item_names .toReversed ();

		current_stack .predefined_argument_names = arg_names_for_quotation;
		current_stack .indent_size = new_indent;
		current_stack .translate_to_js ();
		transpiled .nested_text = current_stack .target_text;
		transpiled .rename_str_uids = current_stack .str_uids_to_rename;
		current_stack = stacks_chain .pop ();

		current_stack .uids_already_in_equation_left =
			current_stack .uids_already_in_equation_left
					.concat (arg_names_for_quotation);
	} else {
		transpiled .nested_text =
			translate_empty_quotation (new_indent,
				obj .item_names .toReversed (),
				obj .another_item_names .toReversed ());
	}

	return transpiled;
}


function if_target_translation_semantics (operand, if_object)
{
	const condition_str_uid = operand [2] .get_target_str_uid ();

	const arg_names_for_quotation = operand .slice (3) .map (item =>
		(
			item .operator === base_voc ["var"] &&
				current_stack .predefined_argument_names [item .operand [0]]
		)
		|| item .get_target_str_uid ());

	const new_indent = current_stack .indent_size + size_indent;

	const nested_text = idx =>
			quot_to_js (if_object, operand [idx] .operand [0], arg_names_for_quotation,
				new_indent) .nested_text;

	const [nested_text_if, nested_text_else] = [1, 0] .map (nested_text);

	const indent_string = indent_str .repeat (current_stack .indent_size);

	return cr
		+ indent_string + "if (" + condition_str_uid + ")\n{"
		+ nested_text_if
		+ cr + indent_string + "} else {"
		+ nested_text_else + "\n}" || "";
}


function if_supplier_target_translation_semantics (operand)
{
	if (fsml_systate .need_full_substitution)
		return "if_" +operand [0];

	return operand [1] .item_names [operand [0]];
}


function while_semantics ()
{
	const while_object     = new Compex ([], base_voc ["while"]);
	const quotation        = current_stack .get (0) .compex .operand [0];
	const production_count = quotation .container .length;
	const touched          = quotation .tail_starts_from;

	if ( production_count !== touched + 1)
	{
		fsmlog_type
			("OMG. Quotation size and amount of its argumens is not commensurable");
		return;
	}

	quotation .isloop = true;

	for (let i = 0; i < touched +1; i++)
	{
		independent_semantics ();

		const item = current_stack .pop ();

		item .compex .set_flag ("subex");

		item .compex .comparative_computing_order ||=
			current_stack .get_next_computing_order ();

		// current_stack .to_next_computing_order (); // <-- Useless

		while_object .operand [i] = item .compex;
	}

	while_object .set_flag ("subex");

	while_object .comparative_computing_order =
		current_stack .get_next_computing_order ();

	while_object .operands_offset = 1;
	while_object .reference_count = production_count -1;
	while_object .item_names_count = production_count;

	// Firstly added correspond to top of stack etc
	var item_names = while_object .item_names = [];

	while_object .another_item_names = [];

	while_object .item_names [0] = new_str_uid ("cond");

	for (var i = 0; i < while_object .item_names_count; i++)
		while_object .another_item_names .push ([]);

	function get_target_str_uid ()
		{ return this .operand [1] .item_names [this .operand [0]] }

	function set_target_str_uid (obtrusive_id)
		{ this .operand [1] .item_names [this .operand [0]] = obtrusive_id }

	function add_target_str_uid (obtrusive_id)
	{
		this .operand [1]
			.another_item_names [this .operand [0]] .push (obtrusive_id)
	}

	for (var i = 0; i < while_object .reference_count; i++)
	{
		current_stack .to_next_computing_order ();

		var item =
			new_stack_item ("while_supplier",
				"while_supplier", undefined, "while_supplier");

		/* temp */ item .compex .dc = function () { return this; } /* temp */

		item .compex .operands_offset = 1;
		item .compex .operand [0] = production_count -i -1;
		item .compex .operand [1] = while_object;
		/* item .compex .set_flag ("subex"); */
		item .compex .set_flag ("deliverer");

		item .compex .get_target_str_uid = get_target_str_uid;
		item .compex .set_target_str_uid = set_target_str_uid;
		item .compex .add_target_str_uid = add_target_str_uid;

		current_stack .push (item);
	}
}


function while_target_translation_semantics (operand, while_object)
{
	const condition_str_uid = while_object .item_names [0];

	const arg_names_for_quotation = operand .slice (1) .map (item =>
		item .operator === base_voc ["var"] ?
			current_stack .predefined_argument_names [item .operand [0]] ||
				item .get_target_str_uid () : item .get_target_str_uid ());

	const new_indent = current_stack .indent_size + size_indent;

	while_object .item_names =
		[while_object .item_names [0]] .concat (arg_names_for_quotation);

	const quot = operand [0] .operand [0];

	const nested_text =
		quot_to_js (while_object, quot, arg_names_for_quotation, new_indent) .nested_text;

	const indent_string = indent_str .repeat (current_stack .indent_size);

	return cr
		+ indent_string + "do { "
		+ nested_text
		+ cr + cr + indent_string + "} while (" + condition_str_uid + ");";
}


function while_supplier_target_translation_semantics (operand)
{
	if (fsml_systate .need_full_substitution)
		return "while_" +operand [0];

	return operand [1] .item_names [operand [0]];
}


function trivial_binary_operation (operation_in_base_voc)
{
	return function ()
	{
		var as0 = current_stack .pop (),
			as1 = current_stack .get (0);

		as0 .compex .reference ();

		/* May be better idea is if create_binary_compex will perform reference
		   of self arguments */

		current_stack .to_next_computing_order (); // ! Palliative. FIXME

		as1 .compex =
			create_binary_compex (as1 .compex,
				as0 .compex, operation_in_base_voc);

		as0 .dereference ();
	}
}

function trivial_unary_operation (operation_in_base_voc)
{
	return function ()
	{
		const as0 = current_stack .get (0);

		current_stack .to_next_computing_order ();

		as0 .compex =
			create_unary_compex (as0 .compex,
				operation_in_base_voc);
	}
}


function plus_target_translation_semantics (operand)
{
	return compex_to_infix_str (operand [0])
		+ " + " + compex_to_infix_str (operand [1]); }


function minus_target_translation_semantics (operand)
{
	var r_exp_parenthesis_if_any = {"left" : "", "right" : ""},
		o0 = operand [0],
		o1 = operand [1];

	if (o1 .operator !== base_voc ["leaf"])
		var r_exp_parenthesis_if_any = {"left" : "(", "right" : ")"};

	if (o1 .operator === base_voc ["leaf"] && o1 .operand [0] < 0)
		var r_exp_parenthesis_if_any = {"left" : "(", "right" : ")"};

	return compex_to_infix_str (o0)
		+ " - "
		+ r_exp_parenthesis_if_any .left
		+ compex_to_infix_str (o1)
		+ r_exp_parenthesis_if_any .right;
}


function wrap_by_parenthesis (str, suboperand, operand_name)
{
	if (js_operation_precedence [suboperand .operator. true_name] <
			js_operation_precedence [operand_name])
		return "(" +str +")";
	else
		return str;
}


function mult_target_translation_semantics (operand)
{
	// let [o0, o1] = operand;
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, "*")
		+" * " +wrap_by_parenthesis (compex_to_infix_str (o1), o1, "*");
}


function div_target_translation_semantics (operand)
{
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, "/")
		+" / " +wrap_by_parenthesis (compex_to_infix_str (o1), o1, "/");
}


function pow_target_translation_semantics (operand)
{
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, "**")
		+" ** " +wrap_by_parenthesis (compex_to_infix_str (o1), o1, "**");
}


function great_target_translation_semantics (operand)
{
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, ">")
		+" > " +wrap_by_parenthesis (compex_to_infix_str (o1), o1, ">");
}


function orderd_semantics () // <-- temporarily solution
{
	var as0 = current_stack .get (0);
	as0 .compex .comparative_computing_order =
		current_stack .get_next_computing_order ();
}


const idx_var_name = 1;
const idx_assigned_expression = 0;


function exclamark_semantics ()
{
	const as0 = current_stack .get (0);
	const as1 = current_stack .get (1);
	const envariable = as0 .compex .operand [0];
	as0 .dereference ();

	const exclamark_item =
		new_stack_item ("Exclamark", "Em", undefined, "!");

	const compex  = exclamark_item .compex;
	const operand = compex .operand;

	operand [idx_assigned_expression] = as1 .compex;

	operand [idx_var_name] =
		new_stack_item ("leaf", "leaf", envariable, "leaf") .compex;

	compex .set_flag ('subex');

	compex .get_target_str_uid = () =>
		compex_to_infix_str (operand [idx_var_name]);

	compex .comparative_computing_order =
		current_stack .get_next_computing_order ();

	current_stack .assignments .push (exclamark_item);

	current_stack .pop ();
	current_stack .pop ();
}


function exclamark_target_translation_semantics (operand)
{
	return compex_to_infix_str (operand [idx_assigned_expression]);
}


// Currently is just a move quoted string from leaf on tos
// as unquoted string in new leaf i.e. refuse quotes
function fetch_semantics ()
{
	var as0 = current_stack .get (0);
	var name = as0 .compex .operand [0];

	as0 .dereference ();
	current_stack .pop ();

	var item = new_stack_item ("leaf", "leaf", undefined, "leaf");
	item .compex .operand [0] = name;

	item .compex .comparative_computing_order =
		current_stack .get_next_computing_order ();

	current_stack .push (item);
}


function id_semantics (operand)
{
	var as0 = current_stack .get (0),
		old_compex = as0 .compex,
		value = old_compex .operand [0], //.toString ();
		new_compex = new Compex ([value], base_voc ["identifier"]);

		as0 .compex = new_compex;
}


function identifier_target_translation_semantics (operand)
	{ return operand [0] }


// Never returns identifier, only target text
function ol_target_translation_semantics (operand)
{
	operand = operand [0];
	const varlist	= variables_digest (operand) .filter (i => i) .join (", ");
	const text		= compex_to_infix_str (operand);
	return "(" + varlist + ") => " + text;
}


function variables_digest (compex, varlist = [])
{
	const operator = compex .operator;

	if (operator === base_voc ["var"])
	{
		const stack_index = compex .operand [0];
		varlist [stack_index] = "var_" + stack_index;
		return varlist;
	}

	if (operator .check_flag ("nowalk") ||
		operator === base_voc ["leaf"] ||
			operator === base_voc ["quotation"])
				return;

	for (let i = compex .operands_offset;  i < compex .operand .length; i++)
		variables_digest (compex .operand [i], varlist);

	return varlist;
}


function independent_semantics ()
{
	var as0 = current_stack .get (0);
	var new_item = new Abstract_stack_item;
	new_item .compex = as0 .compex;
	new_item .compex .reference ();
	as0 .dereference ();
	current_stack .set (0, new_item);
}


function deep_copy_semantics ()
{
	independent_semantics ();
	var as0 = current_stack .get (0),
		old_compex = as0 .compex;
	as0 .compex = as0 .compex .dc ();

	old_compex .dereference ();
}


function depth_semantics ()
	{ compilit ("Number", "Num", current_stack .depth ()) }


function drop_semantics ()
{
	var as0 = current_stack .get (0);
	as0 .dereference ();
	current_stack .pop ();
}


function dup_semantics ()
{
	var as0 = current_stack .get (0);
	as0 .reference ();
	current_stack .push (as0);
}


function swap_semantics ()
{
	var as0 = current_stack .get (0);
	current_stack .set (0, current_stack .get (1));
	current_stack .set (1, as0);
}


function over_semantics ()
{
	var as1 = current_stack .get (1);
	as1 .reference ();
	current_stack .push (as1);
}


function bb_semantics ()
{
	fsml_systate .done = true;

	!fsml_systate .no_type_farewell &&
		fsmlog_type ('Bye-bye. See you later');
}


function help_semantics ()
{
	fsmlog_type
	(`Terminology:\
		${cr}\
		${cr}asg - abstract semantics graph\
		${cr}term - like Forth word, but term strictly can't be subject of parsing\
		${cr}tos - top of stack - the top of the stack or the expression on the top of the stack\
		${cr}target identifier - identifier of the target language\
		${cr}supplier-object - ?\
		${cr}\
		${cr}Interesting just for first but not practically significant terms:\
		${cr}\
		${cr}red - i.e 'reduce' - calculate top of stack for become it to primitive if possible,\
		${cr}generally is not. For example expression with variables can't be reduced\
		${cr}\
		${cr}Termset:\
		${cr}\
		${cr}.js - transpile to JS and type the result\
		${cr}.eval - transpile to JS, evaluate if environment support this and\
		${cr}type the evaluation result as a evaluated stack\
		${cr}! (string any -- variable-id) - 'hold' - hold in variable (without explicit declaring)\
		${cr}@ (string -- unquoted-string) - 'fetch' - refuse quotes in string\
		${cr}id - less or more the same as @\
		${cr}naturange - <end> <start> naturange - Python-like range with step 1. This is JS Generator\
		${cr}1fold - <iterable> <function name> 1fold - functional reduce with start value = 1\
		${cr}if (quotation quotation condition -- supplier-object) - if statement\
		${cr}exactly as in the Factor: https://docs.factorcode.org/content/word-if,kernel.html\
		${cr}for example text: true [ 'will true' ] [ 'will false' ] if .eval dp\
		${cr}leave text: 'will true' on tos\
		${cr}while - less or more like Factor's 'loop' word:\
		${cr}https://docs.factorcode.org/content/word-loop,kernel.html\
		${cr}list ( -- list-id) - new empty array/list of target language, currently is only JS\
		${cr}q>l - <quotation> q>l - converting a quotation to a JS list/array whenever possible\
		${cr}push (any list-id -- list-id) - append tos to list\
	`);
}


function license_semantics ()
	{ fsmlog_type (BSD_2_Clause_license) }


// External environment functions


function time_target_translation_semantics ()
	{ return "(+new Date ())" }

function time_semantics ()
{
	var another_newdate_operation =
		new_stack_item ("Native", "Nat", undefined, "time");

	another_newdate_operation .compex .comparative_computing_order =
		current_stack .get_next_computing_order ();

	current_stack .push (another_newdate_operation);
	current_stack .set_flag ("no-pure-presented");
}


function push_semantics ()
{
	// At time need check and force declare of identifier if not
	// Or find and substitute
	const op_right_pushee	= current_stack .pop () .compex;
	const op_left_list		= current_stack .pop () .compex;
	const operands			= [op_left_list, op_right_pushee];

	const push_operation =
		new_stack_item ("Native", "Nat", undefined, "push");

	push_operation .compex .operand = operands;
	push_operation .compex .set_flag ('subex');

	push_operation .compex .comparative_computing_order =
		current_stack .get_next_computing_order ();

	current_stack .push (push_operation);
	current_stack .set_flag ("no-pure-presented");
}


function push_target_translation_semantics (operand, cpx, opts = {})
{
	const list_name	= compex_to_infix_str (operand [0], { requested: 'target uid' });
	const pushee	= compex_to_infix_str (operand [1]);

	if (fsml_systate .need_full_substitution)
		return list_name;
	else
		return `(${list_name} .push (${pushee}), ${list_name})`;
}


// Test lines

const tests = name =>
(
	name ||= 'factorial',
	({
		'factorial': 'dup [ 1 [ over * over 1 - ] while swap dp ] [ 0 ] if .eval',
		'factorial-12': '12 factorial .test',
		'functorial-12': '* ol mul ! 12 dup [ 1 naturange mul id 1fold ] [ 0 ] if .eval',
		'apply-summ': '12 34 [ [ + ] apply ] apply',
		'hold-fetch': 'factorial .test asd ! asd @ .js .eval' // ! isnt do .js
	})
	[name] || "'\\ OMG! Bad name for test'"
);


export { get_fsml_instance };
