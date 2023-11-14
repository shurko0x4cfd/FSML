
/*  */

// $FlowFixMe
import { fsml_systate } from './fsmlib.js';

import
{
	deep_copy, new_str_uid, compex_to_infix_str,
	base_voc, new_var_item
}
// $FlowFixMe
from './base-voc.js';

// $FlowFixMe
import { Abstract_stack_item } from './as-item.js';




// Rem
let cr = "\n";
let indent_str = " ";
let size_indent = 4;


export class Abstract_stack {
	this;
	dc = deep_copy;

	dc_postprocess = function (obj)
	{
		obj .str_uid = new_str_uid ("quotation");
		obj .actual_target_names = false;

		return obj;
	}

	str_uid = new_str_uid ("quotation");
	flags = [];

	// When performed deep copy of quotation we need to reset cached identifiers
	// of target language in copy because old names belong to original quotation
	actual_target_names = true;

	// Indexes is comparative, absolute value is never matter
	utmost_computing_order = 0;

	// For translation with no assign real order for stackitems
	pseudo_order = 0;

	tail_starts_from = 0; // Even if container presented ?
	container = [];
	assignments = [];

	_need_id_substitution;
	isloop = false;
	ordered_subexpressions = [];

	// [ "str", "str", ... "str" ] Precalculated function argument names
	// or top stack values at loop start if any
	predefined_argument_names = [];
	item_names = [];
	another_item_names = [];

		target_text = "";
	aliastatement = "";
	indent_size = 0;
	return_statement = "";
	return_items = [];
	uids_already_in_equation_left = [];
	str_uids_to_rename = [];

	depth = () => { return this .container .length; }

	get_utmost_computing_order = () => this .utmost_computing_order;
	items_digest = () => this .container .slice ();
	push = (item) => this .container .push (item);
	get_next_computing_order = () => ++this .utmost_computing_order;
	to_next_computing_order = () => { ++this .utmost_computing_order };
	get_next_pseudo_order = () => ++this .pseudo_order +this .utmost_computing_order;
	reset_pseudo_order = () => { this .pseudo_order = 0 }

	set_flag = (flag) =>
		{ (flag in this .flags) || (this .flags .push (flag)) };

	check_flag = (flag) => this .flags .includes (flag);


	extend_stack_if_necessary = (index) =>
	{
		let c = this .container,
			l = c.length;

		if (index + 1 > l)
		{
			let lack = index + 1 - l;
			this .container = this .materialize_tail (lack) .concat (c);
			this .tail_starts_from += lack;
		}
	};


	materialize_tail = (lack) =>
	{
		var tail = [];

		for (let var_index = this .tail_starts_from + lack - 1;
			var_index >= this .tail_starts_from; var_index--)
				tail .push (new_var_item (var_index));

		return tail;
	}


	get_quotation_item = () =>
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

	get_quotation_item =
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


	pop = () =>
	{
		const index = 0;
		this .extend_stack_if_necessary (index);
		const c = this .container;

		return c .pop ();
	};


	get = (index) =>
	{
		this .extend_stack_if_necessary (index);
		var c = this .container;
		var l = c .length;
		return c [l -1 -index];
		// return this .container .at (-index - 1);
	};


	set = (index, value) =>
	{
		this .extend_stack_if_necessary (index);
		var c = this .container;
		var l = c .length;
		c [l -1 -index] = value;
	};


	need_id_substitution = () => this ._need_id_substitution;


	type_stack = (quot = this) =>
	{
		fsml_systate .need_full_substitution = true;

		quot .order_subexpressions (quot);

		const reversed_stack = quot .container .toReversed (),
			fsml_out = [];

		reversed_stack .forEach (function (item)
		{
			quot ._need_id_substitution = item .compex;
			fsml_out .push
			(
				compex_to_infix_str
				(
					item .compex,
					{ requested: 'cipher' },
					undefined,
					quot
				)
			);
		});

		return fsml_out;
	};


	get_target_text = () => this .target_text;


	get_return_items = (quot = this) =>
		quot .return_items .map (compex => compex .get_target_str_uid ());


	get_return_statement = () =>
		"return [ "
		+ this .get_return_items () .join (", ")
		+ " ];";


	order_subexpressions = (quot) =>
	{
		quot .ordered_subexpressions = [];
		quot .reset_pseudo_order ();
		quot .return_items = [];

		const stack = quot .items_digest ();

		stack .forEach ((item, position) =>
			quot ._order_subexpressions (item .compex, item, position, quot));

		quot .assignments .forEach ((item, position) =>
			quot ._order_subexpressions (item .compex, new Abstract_stack_item, position, quot));

		quot .return_items .reverse ();
	}


	_order_subexpressions =
	(
		compex,
		item,
		position,
		quot
	) =>
	{
		const operator = compex .operator;

		if ((operator === base_voc ["var"]) &&
				(compex !== item .compex))
					return;

		const _synonymous = synonymous (compex, quot);

		const like_subex =
			compex .reference_count > 1 || compex .check_flag ("subex") ||
			operator .check_flag ("subex") || operator .check_flag ("nopure");

		if (like_subex)
		{
			var str_uid;

			if (quot .actual_target_names)
				str_uid = compex .get_target_str_uid ();
			else
				str_uid = new_str_uid ("subex");

			append_to_order (compex .comparative_computing_order,
				compex, _synonymous, quot);

			compex .target_str_uid = str_uid;
		}

		const is_stack_item = compex === item .compex;

		if (is_stack_item && !like_subex)
		{
			let order;

			if (compex .comparative_computing_order !== undefined)
				order = compex .comparative_computing_order;
			else
				order = quot .get_next_pseudo_order ();

			append_to_order (order, compex, _synonymous, quot);
		}

		if (is_stack_item)
		{
			compex .get_target_str_uid ();
			quot .return_items .push (compex);
		}

		if (operator .check_flag ("nowalk"))
			return;

		if (operator === base_voc ["leaf"])
			return;

		//if (operator === base_voc ["var"]) { return; }

		for (var i = compex .operands_offset;  i < compex .operand .length; i++)
		{
			const operand = compex .operand [i];
			operand && quot ._order_subexpressions (operand, item, position, quot);
		}
	}
}


function append_to_order
(
	order,
	compex,
	_synonymous,
	quot
)
{
	const ordered_subexpressions = quot .ordered_subexpressions;

	if (! ordered_subexpressions [order])
		ordered_subexpressions [order] = [];

	const subexpressions = ordered_subexpressions [order];

	for (const index in subexpressions)
		if (subexpressions [index][0] === compex) return;

	ordered_subexpressions [order] .push ([compex, _synonymous]);
}


function synonymous (compex, quot)
{
	let synonymous = [];
	const stack_items = quot .items_digest ();

	if (quot .item_names .length === 0)
		return synonymous;

	stack_items .forEach (function (item, index)
		{
			if (stack_items [index] .compex === compex )
			{
				synonymous =
					synonymous .concat (quot .another_item_names [index]);

				const name = quot .item_names [index];

				if (!name) return;

				synonymous .push (name);
			}
		});

	return synonymous;
}
