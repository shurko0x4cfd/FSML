/*  */


// $FlowFixMe
import { cl, u } from 'raffinade';
// import { cl, u } from '../node_modules/raffinade/JS/raffinade.js';

// $FlowFixMe
import { fsml_systate } from './fsmlib.js'
// $FlowFixMe
import { StacksChain } from './stacks-chain.js';
// $FlowFixMe
import { Abstract_stack } from './abstract-stack.js';
// $FlowFixMe
import { Abstract_stack_item } from './as-item.js';
// $FlowFixMe
import { Compex, If_compex } from './compex.js';
// $FlowFixMe
import { FSMLoperation } from './fsml-operation.js';




// Redundant - remove
let cr = "\n";
let indent_str = " ";
let size_indent = 4;


// _cmps = compilation semantics, _tts = target translation semantics
const _base_voc =
[
	[ "license", "",			[], license_cmps ],
	[ "bb", "",					[], bb_cmps ],
	[ "help", "",				[], help_cmps ],
	[ "tojs", "",				[], tojs_cmps ],
	[ ".js", "",				[], dot_js_cmps ],
	[ "eval", "",				[], eval_cmps ],
	[ ".eval", "",				[], dot_eval_cmps ],
	[ ".test", "",				[], dot_test_cmps ],
	[ "red", "",				[], red_cmps ],
	[ "leaf", "",				[ "nowalk" ] ],
	[ "true", "",				[], true_cmps ],
	[ "false", "",				[], false_cmps ],
	[ "quotation", "",			[ "nowalk" ], u, quotation_tts ],
	[ "var", "",				[ "nowalk" ] ],
	[ "ordered", "",			[], orderd_cmps ],
	[ "[", "",					[], open_quotation_cmps ],
	[ "]", "",					[], close_quotation_cmps ],
	[ "apply", "",				[], apply_cmps ],
	[ "+", "",					[], u, plus_tts ],
	[ "-", "",					[], u, minus_tts ],
	[ "*", "",					[], u, mult_tts ],
	[ "/", "",					[], u, div_tts ],
	[ "pow", "",				[], u, pow_tts ],
	[ ">", "",					[], u, great_tts ],
	[ "!", "",					[], exclamark_cmps, exclamark_tts ],
	[ "@", "",					[], fetch_cmps ],
	[ "id", "",					[], id_cmps ],
	[ "identifier", "",			[ "nowalk" ], u, identifier_tts ],
	[ "ol", "",					[], u,	ol_tts ],
	[ "ind", "",				[], independent_cmps ],
	[ "i", "",					[], independent_cmps ],
	[ "dc", "",					[], deep_copy_cmps ],
	[ "depth", "",				[], depth_cmps ],
	[ "drop", "",				[], drop_cmps ],
	[ "dp", "",					[], drop_cmps ],
	[ "dup", "",				[], dup_cmps ],
	[ "swap", "",				[], swap_cmps ],
	[ "over", "",				[], over_cmps ],
	[ "list", "",				[], empty_list_cmps, list_tts ],
	[ "1range", "",				[ "subex" ], u, one_range_tts ],
	[ "if", "",					[ "no-equation" ], if_cmps, if_tts ],
	[ "if_supplier", "",		[], u, if_supplier_tts ],
	[ "while", "",				[ "no-equation" ], while_cmps, while_tts ],
	[ "while_supplier", "",		[], u, while_supplier_tts ],
	[ "push", "",				[], push_cmps, push_tts ], // push is nopure?
	[ "_1fold", "",				[ "subex" ], u, _one_fold_tts ],
	[ "1fold", "",				[ "subex" ], one_fold_cmps, one_fold_tts ],
	[ "q>l", "quotolist",		[ "subex" ], to_list_cmps, list_tts ],
	[ "time", "",				[ "nopure", "nowalk" ], time_cmps, time_tts ],
];



export const base_voc =
	_base_voc .reduce ((acc, itm) =>
		(acc [itm [0]] = new FSMLoperation (...itm), acc), {});


const trivial_xarn_operation =
	(arnity = 1, operation_in_base_voc) =>
		(quot, chain) =>
		{
			const operands_list = [];

			for (let ctr = 0; ctr < arnity - 1; ctr++)
			{
				const as_item = quot .pop ();
				const compex = as_item .compex;
				compex .reference (chain);
				as_item .dereference ();
				operands_list .push (compex);
			}

			const asi = quot .get (0);
			operands_list .push (asi .compex)
			quot .to_next_computing_order ();

			asi .compex = new Compex
			(
				operands_list .toReversed (),
				operation_in_base_voc,
				chain .current .utmost_computing_order
			);
		};


["+", "-", "*", "/", "pow", ">", "1range",] .forEach (term =>
	base_voc [term] .compile = trivial_xarn_operation (2, base_voc [term]));


["ol"] .forEach (term =>
	base_voc [term] .compile = trivial_xarn_operation (1, base_voc [term]));


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

const f = (acc, arrg, idx) =>
	(arrg .forEach (itm => acc [itm] = idx), acc);

/* Convert to object { operation: precedence, ... } */
export const js_operation_precedence /*: Object */ =
	js_operation_groups_precedence
		.reduce (f, {});

js_operation_precedence .leaf = 100;


function wrap_by_parenthesis
(
	str,
	suboperand,
	operand_name
)
{
	if (js_operation_precedence [suboperand .operator. term] <
			js_operation_precedence [operand_name])
		return "(" + str +")";
	else
		return str;
}


function open_quotation_cmps (quot, chain)
{
	return { nested_quot: chain .current = new Abstract_stack };
}


function close_quotation_cmps (quot, chain)
{
	chain .length ||
		fsmlog_type ("OMG. You can't. You are in root quotation");

	if (! chain .length)
		return;

	const nestedQuot = quot .get_quotation_item ();
	chain .pop ();
	const outerQuot = chain .current;
	outerQuot .push (nestedQuot);

	return { nestedQuot };
}


function tojs_cmps (quot)
	{ translate_to_js (quot) }


function dot_js_cmps (quot)
{
	tojs_cmps (quot);
	fsmlog_type (quot .get_target_text ());
}


export function eval_cmps (quot, chain)
{
	translate_to_js (quot); // Upd jsource

	const evalstr =
		"(function (){ "
		+ (quot .get_target_text ()
			+ quot .get_return_statement ())
				.replace (new RegExp (cr, 'g'), "")
				.replace (/\&nbsp;/g,"")
		+ " })();";

	// TODO: add try/catch
	return eval (evalstr);
}


function dot_eval_cmps (quot)
{
	const evalresult_raw = eval_cmps (quot);

	const evalresult_formatted =
		"evaluated stack: [ "
		+ evalresult_raw .join (", ") + " ]";

	fsmlog_type (evalresult_formatted);
}


function dot_test_cmps (quot)
{
	const test_name =
		quot .pop () .compex .operand [0] || '',
		test = tests (test_name) || '';

	fsml_eval (test);

	// TODO: DRY
	const evalstr =
		"(function (){ "
		+ (quot .get_target_text ()
			+ quot .get_return_statement ())
				.replace (new RegExp (cr, 'g'), "")
				.replace (/\&nbsp;/g,"")
		+ " })();";

	const evalresult = eval (evalstr);

	const evalresult_formatted =
		"evaluated stack: [ "
		+ evalresult .join (", ") + " ]";

	fsmlog_type (evalresult_formatted);
}


function red_cmps (quot, chain)
{
	var as0 = quot .get (0);

	fsml_systate .need_full_substitution = true; // Bad place for this 3 line
	quot .order_subexpressions (quot);
	quot ._need_id_substitution = as0 .compex;

	var eval_result = eval (compex_to_infix_str (as0 .compex, u, u, quot));

	as0 .compex .dereference ();

	as0 .compex = new Compex
	(
		[eval_result, u],
		base_voc ["leaf"],
		chain .current .utmost_computing_order
	);

	as0 .compex ["type"] = "Reduced";
	as0 .compex ["shortype"] = "Red";

	if (typeof eval_result === "string")
	{
		as0 .compex .quotype = '"';
		as0 .compex ["type"] = "String";
		as0 .compex ["shortype"] = "Str";
	}
	else as0 .compex .quotype = "";
}


function quotation_tts (operand, p, opts)
	{return opts .requested === 'cipher' ? 'Quot' : '"Quot"' }


function _substitute_variables
(
	compex,
	p,
	n,
	quot,
	chain
)
{
	var operator = compex .operator;

	if (compex .reference_count > 1 || operator .check_flag ("nopure"))
	{
		compex .comparative_computing_order +=
			quot .get_utmost_computing_order ();

		if (new_utmost_order < compex .comparative_computing_order)
			new_utmost_order = compex .comparative_computing_order;
	}

	if (operator === base_voc ["var"])
	{
		var placeholder = p .operand [n] ||
		new Compex
		(
			[], "", [],
			chain .current .utmost_computing_order
		);

		var substitutional = quot .get (compex .operand [0]) .compex;
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
		_substitute_variables (compex .operand [i], compex, i, quot, chain);
}


function substitute_variables
(
	item,
	quot,
	chain
)
{
	const pseudo_compex = new Compex ([], "", [], chain .current .utmost_computing_order); // ! Order

	_substitute_variables (item .compex, pseudo_compex, 0, quot, chain);

	if (pseudo_compex .operand [0])
		item .compex = pseudo_compex .operand [0];
}


let new_utmost_order = 0;

function apply_cmps (quot, chain)
{
	const as0		= quot .pop ();
	const quotation	= as0 .compex .operand [0];
	const touched	= quotation .tail_starts_from;
	const quotation_items = quotation .items_digest ();

	new_utmost_order = 0; // <-- nonlocal

	touched > 0 &&
		quot .extend_stack_if_necessary (touched - 1);

	const current_items	= quot .items_digest ();
	const current_num   = current_items .length;

	const head = current_items .slice (current_num - touched);
	const tail = current_items .slice (0, current_num - touched);

	const assignments = quotation .assignments .slice ();

	for (const i in quotation_items)
		substitute_variables (quotation_items [i], quot, chain);

	for (const i in assignments)
		substitute_variables (assignments [i], quot, chain);

	head .forEach (item => item .dereference ());

	const  new_container = tail .concat (quotation_items);
	quot .container = new_container;

	quot .assignments = quot .assignments .concat (assignments);

	quot .utmost_computing_order = new_utmost_order;
}


/** New empty JS-like list/array */
function empty_list_cmps (quot, chain)
{
	const nested_quot = open_quotation_cmps (quot, chain) .nested_quot;
	close_quotation_cmps (nested_quot, chain);
	to_list_cmps (quot);
}


/** Limited convertion quotation to JS list */
function list_tts
(
	operand,
	parent,
	opts,
)
{
	if (fsml_systate .need_full_substitution)
		return parent .str_uid;

	if (opts .requested === 'target uid')
		return parent .get_target_str_uid ();

	const quot = operand [0] .operand [0];
	translate_to_js (quot);

	const text =
		"[ "
		// $FlowFixMe
		+ quot .get_return_items (quot) .toReversed () .join (", ")
		+ " ]";

	return text;
}


/** Limited convertion quotation to JS list */
function to_list_cmps (quot, chain)
{
	const as0       = quot .get (0);
	const quotation = as0 .compex .dc ();
	const asi       = new_stack_item ("list", "lst", quotation, "q>l");

	quotation ?. dc_postprocess (quotation);
	quotation .set_flag ("no-equation");
	quotation .operand [1] = {}; // wtf?
	quotation .set_flag ("subex"); // wtf?
	asi .compex .set_flag ("subex");
	asi .compex .str_uid = new_str_uid ("list");
	quotation .reference (chain); // FIXME?
	as0 .dereference ();

	quotation .comparative_computing_order =
		quot .get_next_computing_order ();

	asi .compex .comparative_computing_order =
		quot .get_next_computing_order ();

	quot .set (0, asi);
}


function one_range_tts
(
	operand,
	compex,
	opts,
	quot
)
{
	if (fsml_systate .need_full_substitution)
		return compex .str_uid;

	if (opts .requested === 'target uid')
		return compex .get_target_str_uid ();

	const starts_from = compex_to_infix_str (operand [1], u, u, quot);
	const lim         = compex_to_infix_str (operand [0], u, u, quot);

	return `function* (c = ${starts_from}) { while (c <= ${lim}) yield c++ }`;
}


function _one_fold_tts
(
	operand,
	compex,
	opts,
	quot
)
{
	if (fsml_systate .need_full_substitution)
		return compex .str_uid;

	if (opts .requested === 'target uid')
		return compex .get_target_str_uid ();

	const iterable = compex_to_infix_str (operand [0], { requested: 'target uid' }, u, quot);
	const folder   = compex_to_infix_str (operand [1], u, u, quot);

	const padding = indent_str .repeat (size_indent);

	return `															\
		${cr}${padding}() => {											\
			${cr}${padding .repeat (2)}let acc = 1;						\
			${cr}${padding .repeat (2)}const iterable = ${iterable}();	\
			${cr}${padding .repeat (2)}for (let i of iterable)			\
				${cr}${padding .repeat (3)}acc = ${folder}(i, acc);		\
			${cr}${padding .repeat (2)}return acc;						\
		${cr}${padding}}`;
}


function one_fold_cmps (quot, chain)
{
	var as0 = quot .pop (),
	as1 = quot .get (0);
	as0 .compex .reference (chain);

	quot .to_next_computing_order (); // ! Palliative. FIXME

	const folder_proc_compex = new Compex
	(
		[as1 .compex, as0 .compex],
		base_voc ["_1fold"],
		chain .current .utmost_computing_order
	);

	quot .to_next_computing_order (); // ! Palliative. FIXME

	as1 .compex = new Compex
	(
		[folder_proc_compex],
		base_voc ["1fold"],
		chain .current .utmost_computing_order
	);

	as0 .dereference ();
}


function one_fold_tts
(
	operand,
	compex,
	opts,
	quot
)
{
	if (fsml_systate .need_full_substitution)
		return compex .str_uid;

	if (opts .requested === 'target uid')
		return compex .get_target_str_uid ();

	const no_text = compex_to_infix_str (operand [0], { requested: 'target uid' }, u, quot);

	return `${no_text}()`;
}


// How you plan to implement deep copy of if_object ? Now this impossible
// Btw, 'dc' operate on object refered by top element stack, but if_object is
// not referd by nothing beside deliverer. 'dc' on deliverer produce copy
// of deliverer (?), not if_object

function if_cmps (quot, chain)
{
	var if_compex = new If_compex ([], base_voc ["if"]);

	var quotation_true  = quot .get (1) .compex .operand [0];
	var quotation_false = quot .get (0) .compex .operand [0];

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

	for (let idx = 0; idx < touched + 3; idx++)
	{
		independent_cmps (quot, chain);

		var item = quot .pop ();

		item .compex .set_flag ("subex");

		item .compex .comparative_computing_order = // ||=
			item .compex .comparative_computing_order ||
				quot .get_next_computing_order ();

		if_compex .operand [idx] = item .compex;
	}

	if_compex .set_flag ("subex");

	if_compex .comparative_computing_order =
		quot .get_next_computing_order ();

	if_compex .operand [2] .target_str_uid = new_str_uid ("cond");
	if_compex .operands_offset = 2;

	if_compex .reference_count =
		if_compex .item_names_count =
			production_count;

	// Firstly added correspond to top of stack etc
	var item_names = if_compex .item_names = [];

	if_compex .another_item_names = [];

	for (let item_name_ctr = 0; item_name_ctr < if_compex .item_names_count; item_name_ctr++)
	{
		if_compex .item_names .push (new_str_uid ("subex"));
		if_compex .another_item_names .push ([]);
	}

	function get_target_str_uid ()
	{
		return this .operand [1] .item_names [this .operand [0]];
	}

	function set_target_str_uid ( obtrusive_id)
	{
		this .operand [1] .item_names [this .operand [0]] = obtrusive_id;
	}

	function add_target_str_uid ( obtrusive_id)
	{
		this .operand [1] .another_item_names [this .operand [0]]
			.push (obtrusive_id);
	}

	for (let other_idx = 0; other_idx < if_compex .reference_count; other_idx++)
	{
		const item =
			new_stack_item
				("if_supplier", "if_supplier", u, "if_supplier");

		/* temp */
		item .compex .dc =
			function () { return this };
		/* temp */

		item .compex .operands_offset = 1;
		item .compex .operand [0] = production_count - other_idx - 1;
		item .compex .operand [1] = if_compex;
		/* item .compex .set_flag ("subex"); */
		item .compex .set_flag ("deliverer");

		item .compex .get_target_str_uid = get_target_str_uid;
		item .compex .set_target_str_uid = set_target_str_uid;
		item .compex .add_target_str_uid = add_target_str_uid;

		quot .push (item);
	}
}


function quot_to_js
(
	obj,
	quot,
	arg_names_for_quotation,
	new_indent
)
{
	const transpiled = { nested_text: "", rename_str_uids: [] };

	if (quot .container .length !== 0)
	{
		quot .item_names = obj .item_names .toReversed ();
		quot .another_item_names = obj .another_item_names .toReversed ();

		quot .predefined_argument_names = arg_names_for_quotation;
		quot .indent_size = new_indent;
		translate_to_js (quot);
		transpiled .nested_text = quot .target_text;
		transpiled .rename_str_uids = quot .str_uids_to_rename;

		// quot .uids_already_in_equation_left =
		// 	quot .uids_already_in_equation_left	.concat (arg_names_for_quotation);
	} else {
		transpiled .nested_text =
			translate_empty_quotation
			(
				new_indent,
				obj .item_names .toReversed (),
				obj .another_item_names .toReversed ()
			);
	}

	return transpiled;
}


function if_tts (operand, if_object, o, outerQuot)
{
	const condition_str_uid = operand [2] .get_target_str_uid ();

	const arg_names_for_quotation = operand .slice (3) .map (item =>
		(
			// If var and if predefined name is presented, retun predefined name
			item .operator === base_voc ["var"] &&
				outerQuot .predefined_argument_names [item .operand [0]]
		)
		||
		(
			// If var and if predefined name is not presented, retun name var_ + index
			// vhere var_ + index nust be among argunents in wrapper (argunents) => ...
			item .operator === base_voc ["var"] &&
				"var_" + item .operand [0]
		)
		|| item .get_target_str_uid ());

	const new_indent = outerQuot .indent_size + size_indent;

	const nested_text = (idx) =>
		quot_to_js (if_object, operand [idx] .operand [0], arg_names_for_quotation,
			new_indent) .nested_text;

	const [nested_text_if, nested_text_else] = [1, 0] .map (nested_text);

	const indent_string = indent_str .repeat (outerQuot .indent_size);

	return cr
		+ indent_string + "if (" + condition_str_uid + ")\n{"
		+ nested_text_if
		+ cr + indent_string + "} else {"
		+ nested_text_else + "\n}" || "";
}


function if_supplier_tts (operand)
{
	if (fsml_systate .need_full_substitution)
		return "if_" +operand [0];

	return operand [1] .item_names [operand [0]];
}


function while_cmps (quot, chain)
{
	const while_object = new Compex
	(
		[],
		base_voc ["while"],
		chain .current .utmost_computing_order
	);

	const quotation        = quot .get (0) .compex .operand [0];
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
		independent_cmps (quot, chain);

		const item = quot .pop ();

		item .compex .set_flag ("subex");

		item .compex .comparative_computing_order ||=
			quot .get_next_computing_order ();

		// quot .to_next_computing_order (); // <-- Useless

		while_object .operand [i] = item .compex;
	}

	while_object .set_flag ("subex");

	while_object .comparative_computing_order =
		quot .get_next_computing_order ();

	while_object .operands_offset = 1;
	while_object .reference_count = production_count -1;
	while_object .item_names_count = production_count;

	// Firstly added correspond to top of stack etc
	var item_names = while_object .item_names = [];

	while_object .another_item_names = [];

	while_object .item_names [0] = new_str_uid ("cond");

	for
	(
		let item_names_idx = 0;
		item_names_idx < while_object .item_names_count;
		item_names_idx++
	)
		while_object .another_item_names .push ([]);

	function get_target_str_uid ()
		{ return this .operand [1] .item_names [this .operand [0]] }

	function set_target_str_uid ( obtrusive_id)
		{ this .operand [1] .item_names [this .operand [0]] = obtrusive_id }

	function add_target_str_uid ( obtrusive_id)
	{
		this .operand [1]
			.another_item_names [this .operand [0]] .push (obtrusive_id)
	}

	for (let ctr = 0; ctr < while_object .reference_count; ctr++)
	{
		quot .to_next_computing_order ();

		var item =
			new_stack_item ("while_supplier",
				"while_supplier", u, "while_supplier");

		/* temp */
		item .compex .dc = function () { return this; }
		/* temp */

		item .compex .operands_offset = 1;
		item .compex .operand [0] = production_count - ctr -1;
		item .compex .operand [1] = while_object;
		/* item .compex .set_flag ("subex"); */
		item .compex .set_flag ("deliverer");

		item .compex .get_target_str_uid = get_target_str_uid;
		item .compex .set_target_str_uid = set_target_str_uid;
		item .compex .add_target_str_uid = add_target_str_uid;

		quot .push (item);
	}
}


function while_tts (operand, while_object, o, outerQuot)
{
	const condition_str_uid = while_object .item_names [0];

	const arg_names_for_quotation = operand .slice (1) .map (item =>
		(
			item .operator === base_voc ["var"] &&
				outerQuot .predefined_argument_names [item .operand [0]]
		)
		||
		(
			item .operator === base_voc ["var"] &&
				"var_" + item .operand [0]
		)
		|| item .get_target_str_uid ());

	const new_indent = outerQuot .indent_size + size_indent;

	while_object .item_names =
		[while_object .item_names [0]] .concat (arg_names_for_quotation);

	const quot = operand [0] .operand [0];

	const nested_text =
		quot_to_js (while_object, quot, arg_names_for_quotation, new_indent) .nested_text;

	const indent_string = indent_str .repeat (outerQuot .indent_size);

	return cr
		+ indent_string + "do { "
		+ nested_text
		+ cr + cr + indent_string + "} while (" + condition_str_uid + ");";
}


function while_supplier_tts (operand)
{
	if (fsml_systate .need_full_substitution)
		return "while_" +operand [0];

	return operand [1] .item_names [operand [0]];
}


function true_cmps (quot)
	{ compilit ("Boolean", "Bool", true, quot) }


function false_cmps (quot)
	{ compilit ("Boolean", "Bool", false, quot) }


function plus_tts (operand, c, o, quot)
{
	return compex_to_infix_str (operand [0], u, u, quot)
		+ " + " + compex_to_infix_str (operand [1], u, u, quot);
}


function minus_tts (operand, c, o, quot)
{
	let r_exp_parenthesis_if_any = {"left" : "", "right" : ""},
		o0 = operand [0],
		o1 = operand [1];

	if (o1 .operator !== base_voc ["leaf"])
		r_exp_parenthesis_if_any = {"left" : "(", "right" : ")"};

	if (o1 .operator === base_voc ["leaf"] && o1 .operand [0] < 0)
		r_exp_parenthesis_if_any = {"left" : "(", "right" : ")"};

	const rightside = compex_to_infix_str (o1, u, u, quot);

	// Bad solve but...
	const need_not_parenthesis = ! rightside .match (/[\+\-\*\/\>\<]+/g);
	need_not_parenthesis &&
		(r_exp_parenthesis_if_any = {"left" : "", "right" : ""});

	// 12 - (-34) ?

	return compex_to_infix_str (o0, u, u, quot)
		+ " - "
		+ r_exp_parenthesis_if_any .left
		// + compex_to_infix_str (o1)
		+ rightside
		+ r_exp_parenthesis_if_any .right;
}


function mult_tts (operand, c, o, quot)
{
	// let [o0, o1] = operand;
	var o0 = operand [0],
		o1 = operand [1];

	return "" + wrap_by_parenthesis (compex_to_infix_str (o0, u, u, quot), o0, "*")
		+" * " + wrap_by_parenthesis (compex_to_infix_str (o1, u, u, quot), o1, "*");
}


function div_tts (operand, c, o, quot)
{
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0, u, u, quot), o0, "/")
		+" / " +wrap_by_parenthesis (compex_to_infix_str (o1, u, u, quot), o1, "/");
}


function pow_tts (operand, c, o, quot)
{
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0, u, u, quot), o0, "**")
		+" ** " +wrap_by_parenthesis (compex_to_infix_str (o1, u, u, quot), o1, "**");
}


function great_tts (operand, c, o, quot)
{
	var o0 = operand [0],
		o1 = operand [1];

	return "" +wrap_by_parenthesis (compex_to_infix_str (o0, u, u, quot), o0, ">")
		+" > " +wrap_by_parenthesis (compex_to_infix_str (o1, u, u, quot), o1, ">");
}


function orderd_cmps (quot) // <-- temporarily solution
{
	const as0 = quot .get (0);
	as0 .compex .comparative_computing_order = quot .get_next_computing_order ();
}


const idx_var_name = 1;
const idx_assigned_expression = 0;


function exclamark_cmps (quot)
{
	const as0 = quot .get (0);
	const as1 = quot .get (1);
	const envariable = as0 .compex .operand [0];
	as0 .dereference ();

	const exclamark_item =
		new_stack_item ("Exclamark", "Em", u, "!");

	const compex  = exclamark_item .compex;
	const operand = compex .operand;

	operand [idx_assigned_expression] = as1 .compex;

	operand [idx_var_name] =
		new_stack_item ("leaf", "leaf", envariable, "leaf") .compex;

	compex .set_flag ('subex');

	compex .get_target_str_uid = () =>
		compex_to_infix_str (operand [idx_var_name]);

	compex .comparative_computing_order =
		quot .get_next_computing_order ();

	quot .assignments .push (exclamark_item);

	quot .pop ();
	quot .pop ();
}


function exclamark_tts (operand, c, o, quot)
{
	return compex_to_infix_str (operand [idx_assigned_expression], u, u, quot);
}


// Currently is just a move quoted string from leaf on tos
// as unquoted string in new leaf i.e. refuse quotes
function fetch_cmps (quot)
{
	var as0 = quot .get (0);
	var name = as0 .compex .operand [0];

	as0 .dereference ();
	quot .pop ();

	var item = new_stack_item ("leaf", "leaf", u, "leaf");
	item .compex .operand [0] = name;

	item .compex .comparative_computing_order =
		quot .get_next_computing_order ();

	quot .push (item);
}


function id_cmps (quot, chain)
{
	var as0 = quot .get (0),
		old_compex = as0 .compex,
		value = old_compex .operand [0], //.toString ();

		new_compex = new Compex
		(
			[value],
			base_voc ["identifier"],
			chain .current .utmost_computing_order
		);

		as0 .compex = new_compex;
}


function identifier_tts (operand)
	{ return operand [0] }


// Never returns identifier, only target text
function ol_tts (operand, c, o, quot)
{
	operand = operand [0];
	const varlist	= variables_digest (operand) .filter (i => i) .join (", ");
	const text		= compex_to_infix_str (operand, { requested: "text" }, u, quot);
	return "(" + varlist + ") => " + text;
}


function independent_cmps (quot, chain)
{
	var as0 = quot .get (0);
	var new_item = new Abstract_stack_item;
	new_item .compex = as0 .compex;
	new_item .compex .reference (chain);
	as0 .dereference ();
	quot .set (0, new_item);
}


function deep_copy_cmps (quot)
{
	independent_cmps (quot);
	var as0 = quot .get (0),
		old_compex = as0 .compex;
	as0 .compex = as0 .compex .dc (quot);

	old_compex .dereference ();
}


function depth_cmps (quot)
	{ compilit ("Number", "Num", quot .depth (), quot) }


function drop_cmps (quot)
{
	var as0 = quot .get (0);
	as0 .dereference ();
	quot .pop ();
}


function dup_cmps (quot, chain)
{
	var as0 = quot .get (0);
	as0 .reference (chain);
	quot .push (as0);
}


function swap_cmps (quot)
{
	var as0 = quot .get (0);
	quot .set (0, quot .get (1));
	quot .set (1, as0);
}


function over_cmps (quot, chain)
{
	var as1 = quot .get (1);
	as1 .reference (chain);
	quot .push (as1);
}


function bb_cmps (quot)
{
	fsml_systate .done = true;

	!fsml_systate .no_type_farewell &&
		fsmlog_type ('Bye-bye. See you later');
}


function help_cmps (quot)
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
		${cr}1range - <end> <start> 1range - Python-like range with step +1. This is JS Generator\
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


function license_cmps (quot)
	{ fsmlog_type (BSD_2_Clause_license) }


// External environment functions


function time_tts ()
	{ return "(+new Date ())" }


function time_cmps (quot)
{
	var another_newdate_operation =
		new_stack_item ("Native", "Nat", u, "time");

	another_newdate_operation .compex .comparative_computing_order =
		quot .get_next_computing_order ();

	quot .push (another_newdate_operation);
	quot .set_flag ("no-pure-presented");
}


function push_cmps (quot)
{
	// At time need check and force declare of identifier if not
	// Or find and substitute
	const op_right_pushee	= quot .pop () .compex;
	const op_left_list		= quot .pop () .compex;
	const operands			= [op_left_list, op_right_pushee];

	const push_operation =
		new_stack_item ("Native", "Nat", u, "push");

	push_operation .compex .operand = operands;
	push_operation .compex .set_flag ('subex');

	push_operation .compex .comparative_computing_order =
		quot .get_next_computing_order ();

	quot .push (push_operation);
	quot .set_flag ("no-pure-presented");
}


function push_tts
(
	operand,
	cpx,
	opts = {},
	quot
)
{
	const list_name	=
		compex_to_infix_str (operand [0], { requested: 'target uid' }, u, quot);

	const pushee = compex_to_infix_str (operand [1], u, u, quot);

	if (fsml_systate .need_full_substitution)
		return list_name;

	if (opts .requested === 'target uid')
		return cpx .get_target_str_uid ();

	return `(${list_name} .push (${pushee}), ${list_name})`;
}


export function new_stack_item
(
	type,
	shortype,
	value,
	operation
)
{
	const asi = new Abstract_stack_item ();

	asi .compex .type = type;
	asi .compex .shortype = shortype;
	asi .compex .operand [0] = value;
	asi .compex .operator = base_voc [operation];

	return asi;
}


export function compilit
(
	type,
	shortype,
	value,
	quot,
	chain
)
	{ quot .push (new_stack_item (type, shortype, value, "leaf")) }


export function new_var_item (var_index)
	{ return new_stack_item ("Variable", "var", var_index, "var") }


/** Perform deep copy of one top stack item. Quite obsoleted */

export function deep_copy ( quot)
{
	const new_object = new this .constructor ();

	for (const i of Object.keys(this))
		new_object [i] = this [i];

	if (new_object .comparative_computing_order)
	{
		++quot .utmost_computing_order; // ! Why exactly current stack ?

		// M.b. '.get_next_computing_order ()' ?
		new_object .comparative_computing_order =
			quot .get_utmost_computing_order ();
	}

	Object .keys (new_object) .forEach (i =>
	{
		const item = new_object [i];
		const duplicable =
			Array.isArray (item) || item && item .constructor === Object .constructor;

		if (!duplicable) return;

		const dc = item .dc;
		new_object [i] = typeof dc === 'function' ? dc () : deep_copy .apply (item);
	});

	const dc_postprocess = this .dc_postprocess;
	return dc_postprocess ? dc_postprocess (new_object) : new_object;
}


/**
 * Generator of unique (within session) string id like subex_0, cond_1 etc
 * @arg		{string} prefix String prefix for uid like "subex" or "cond"
 * @return	{string}		Unique string identifier
 */
export const new_str_uid =
(
	(uids = {}) =>
		(prefix) =>
			(!(prefix in uids) && (uids [prefix] = 0),
				prefix + "_" + uids [prefix] ++)
)();


const translate_to_js = (quot) =>
{
	const indent_string =  indent_str .repeat (quot .indent_size);
	fsml_systate .need_full_substitution = false; // ! Bad place
	let uids_already_in_equation_left = [];
	quot .str_uids_to_rename = [];

	// ! for same compexes item override id next time unlike case next item equal previous
	// ! write to targrt_str_uid have no effect to suppliers
	quot .item_names .forEach ((item, index) =>
		{
			const element = quot .container [index] .compex;

			element .target_str_uid = item;

			element .check_flag ("deliverer") &&
				element .set_target_str_uid (item);
		});

	quot .order_subexpressions (quot);

	quot .target_text = "";
	let specr = "\n"; // <- For avoid first cr. Not in use

	function process_expression (item)
	{
		var compex   = item [0];
		var syn_list = item [1];

		quot ._need_id_substitution = compex;

		const translated_expression = compex_to_infix_str
			(
				compex,
				undefined,
				uids_already_in_equation_left,
				quot
			);

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

		if (compex .operator .check_flag ("no-equation") || compex .check_flag ("no-equation"))
		{
			quot .target_text += specr + translated_expression;
			specr = cr;
		}
		else
		{
			if (syn)
			{
				quot .target_text += syn_declarations
						+ cr + indent_string + syn + translated_expression + ";";

				uids_already_in_equation_left =
					uids_already_in_equation_left .concat (syn_list);
			}

			// For excluding tautology ala 'let name = name;'
			if (!syn && translated_expression !== target_str_uid)
			{
				quot .target_text +=
					specr + indent_string
						+ "var " + target_str_uid
							+ " = " + translated_expression + ";";

				uids_already_in_equation_left .push (target_str_uid);
				specr = cr;
			}
		}
	}

	quot .ordered_subexpressions .forEach (group =>
		group .forEach (process_expression));

	var str_uids_to_rename = quot .str_uids_to_rename;
	quot .aliastatement = "";

	if (str_uids_to_rename .length)
	{
		var comma = "";
		str_uids_to_rename .forEach ((item, index) =>
		{
			quot .aliastatement +=
				comma +item +"_copy" +" = " +item;

			comma = "," + cr + indent_string + indent_str .repeat (size_indent * 2);
		});

		if (quot .aliastatement)
			quot .aliastatement =
				cr + indent_string + indent_str .repeat (size_indent) + "var "
					+ quot .aliastatement + ";" + cr;
	}

	if (quot .isloop)
		quot .target_text =
			quot .aliastatement + quot .target_text;
};


export function compex_to_infix_str
(
	compex,
	opts = {},
	uids_already_in_equation_left = [],
	q
)
{
	const operator = compex .operator;

	if (operator === base_voc ["var"])
	{
		if (q .predefined_argument_names .length)
		{
			const name_index = compex .operand [0];
			const name = q .predefined_argument_names [name_index];

			if
			(
				q .isloop &&
				uids_already_in_equation_left .includes (name)
			)
			{
				q .str_uids_to_rename .push (name);
				return name +"_copy";
			}

			return name;
		}
		else
			return "var_" +compex .operand [0];
	}

	if
	(
		(compex .reference_count > 1 || operator .check_flag ("nopure")) &&
		!(q .need_id_substitution () === compex) &&
		!fsml_systate .need_full_substitution
	)
	{
		var name = compex .get_target_str_uid ();

		if
		(
			q .isloop &&
			uids_already_in_equation_left .includes (name)
		)
		{
			q .str_uids_to_rename .push (name);
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

	return operator .translate_to_target (compex .operand, compex, opts, q);
}


export function variables_digest (compex, varlist = [])
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
				return [""];

	for (let i = compex .operands_offset;  i < compex .operand .length; i++)
		variables_digest (compex .operand [i], varlist);

	return varlist;
}


function translate_empty_quotation (
	indent_size,
	item_names,
	another_item_names)
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
			var_declarations + comma    + item;

		assign_statement =
			assign_statement + equation + item;

		comma = ", "; equation = " = ";
	});

	another_item_names .forEach (item =>
		{
			if (item .length === 0) return;

			var_declarations =
				var_declarations + comma + item .join (", ");

			assign_statement =
				assign_statement + equation + item .join (" = ");

			comma = ", "; equation = " = ";
		});

	if (var_declarations)
		var_declarations = "var " + var_declarations + ";";

	if (assign_statement)
		assign_statement += " = undefined;";

	if (var_declarations || assign_statement)
	{
		target_text = cr + indent_string + var_declarations
			+ cr + indent_string + assign_statement;
	}

	return target_text;
}


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


export const BSD_2_Clause_license =
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
