
/* @flow */

// $FlowFixMe
import { fsml_systate } from './global.js';

import
{
	deep_copy, new_str_uid, compex_to_infix_str,
	base_voc, new_var_item
}
// $FlowFixMe
from './factored.js';

// $FlowFixMe
import { Abstract_stack_item } from './as-item.js';




// Rem
let cr = "\n";
let indent_str = " ";
let size_indent = 4;


export class Abstract_stack {
	this: Abstract_stack;
	dc: Function = deep_copy;

	dc_postprocess = function (obj: Object): Object
	{
		obj.str_uid = new_str_uid ("quotation");
		obj.actual_target_names = false;

		return obj;
	}

	str_uid: string = new_str_uid ("quotation");
	flags: Array<string> = [];

	// When performed deep copy of quotation we need to reset cached identifiers
	// of target language in copy because old names belong to original quotation
	actual_target_names = true;

	// Indexes is comparative, absolute value is never matter
	utmost_computing_order = 0;

	// For translation with no assign real order for stackitems
	pseudo_order = 0;

	tail_starts_from = 0; // Even if container presented ?
	container: Array<Object> = [];
	assignments: Array<Abstract_stack_item> = [];

	_need_id_substitution: Compex;
	isloop = false;
	ordered_subexpressions: Array<any> = [];

	// [ "str", "str", ... "str" ] Precalculated function argument names
	// or top stack values at loop start if any
	predefined_argument_names: Array<string> = [];
	item_names: Array<string> = [];
	another_item_names: Array<string> = [];

	kind_of_next_compilation = "no-incomings";

	compiled_function_name_if_named = "";

	target_text = "";
	aliastatement = "";
	indent_size = 0;
	return_statement = "";
	return_items: Array<any> = [];
	evalresult: Array<any> = [];
	uids_already_in_equation_left: Array<any> = [];
	str_uids_to_rename: Array<any> = [];

	depth = (): number => { return this .container .length; }

	get_utmost_computing_order = (): number => this .utmost_computing_order;
	items_digest = (): Array<Object> => this .container .slice ();
	push = (item: Abstract_stack_item): number => this .container .push (item);
	get_next_computing_order = (): number => ++this .utmost_computing_order;
	to_next_computing_order = (): void => { ++this .utmost_computing_order };
	get_next_pseudo_order = (): number => ++this .pseudo_order +this .utmost_computing_order;
	reset_pseudo_order = (): void => { this .pseudo_order = 0 }

	set_flag = (flag: string): void =>
		{ (flag in this .flags) || (this .flags .push (flag)) };

	check_flag = (flag: string): boolean => this .flags .includes (flag);


	extend_stack_if_necessary = (index: number): void =>
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


	materialize_tail = (lack: number): Array<Abstract_stack_item> =>
	{
		var tail = [];

		for (let var_index = this .tail_starts_from + lack - 1;
			var_index >= this .tail_starts_from; var_index--)
				tail .push (new_var_item (var_index));

		return tail;
	}


	get_quotation_item = (): Abstract_stack_item =>
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


	pop = (): Abstract_stack_item =>
	{
		const index = 0;
		this .extend_stack_if_necessary (index);
		const c = this .container;

		return c .pop ();
	};


	get = (index: number): Abstract_stack_item =>
	{
		this .extend_stack_if_necessary (index);
		var c = this .container;
		var l = c .length;
		return c [l -1 -index];
		// return this .container .at (-index - 1);
	};


	set = (index: number, value: Abstract_stack_item): void =>
	{
		this .extend_stack_if_necessary (index);
		var c = this .container;
		var l = c .length;
		c [l -1 -index] = value;
	};


	need_id_substitution = (): Compex => this ._need_id_substitution;


	type_stack = (): Array<any> =>
	{
		const self = this;
		fsml_systate .need_full_substitution = true;

		this .order_subexpressions ();

		const reversed_stack = fsml_systate .current_stack .container .toReversed (),
			fsml_out = [];

		reversed_stack .forEach (function (item)
		{
			self ._need_id_substitution = item .compex;
			fsml_out .push (compex_to_infix_str (item .compex));
		});

		return fsml_out;
	};


	translate_to_js = (): void =>
	{
		const self = this;
		const indent_string =  indent_str .repeat (fsml_systate .current_stack .indent_size);
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

		function process_expression (item: Array<any>, index: number)
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

		var str_uids_to_rename = fsml_systate .current_stack .str_uids_to_rename;
		fsml_systate .current_stack .aliastatement = "";

		if (str_uids_to_rename .length)
		{
			var comma = "";
			str_uids_to_rename .forEach ((item, index) =>
			{
				fsml_systate .current_stack .aliastatement +=
					comma +item +"_copy" +" = " +item;

				comma = "," + cr + indent_string + indent_str .repeat (size_indent * 2);
			});

			if (fsml_systate .current_stack .aliastatement)
				fsml_systate .current_stack .aliastatement =
					cr + indent_string + indent_str .repeat (size_indent) + "var "
						+ fsml_systate .current_stack .aliastatement + ";" + cr;
		}

		if (fsml_systate .current_stack .isloop)
			fsml_systate .current_stack .target_text =
				fsml_systate .current_stack .aliastatement + fsml_systate .current_stack .target_text;
	};


	get_target_text = (): string => this .target_text;


	get_return_items = (): Array<string> =>
		this .return_items .map (compex => compex .get_target_str_uid ());


	get_return_statement = (): string =>
		"return [ "
		+ this .get_return_items () .join (", ")
		+ " ];";


	order_subexpressions = (): void =>
	{
		const self = this;
		this .ordered_subexpressions = [];
		this .reset_pseudo_order ();
		this .return_items = [];

		const stack = fsml_systate .current_stack .items_digest ();

		stack .forEach ((item, position) =>
			self ._order_subexpressions (item .compex, item, position));

		fsml_systate .current_stack .assignments .forEach ((item, position) =>
			self ._order_subexpressions (item .compex, new Abstract_stack_item, position));

		this .return_items .reverse ();
	}


	_order_subexpressions =
		(compex: Compex, item: Abstract_stack_item, position: number): void =>
	{
		const operator = compex .operator;

		if ((operator === base_voc ["var"]) &&
				(compex !== item .compex))
					return;

		const _synonymous = synonymous (compex);

		const like_subex =
			compex .reference_count > 1 || compex .check_flag ("subex") ||
			operator .check_flag ("subex") || operator .check_flag ("nopure");

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
			let order: number;

			if (compex .comparative_computing_order !== undefined)
				order = compex .comparative_computing_order;
			else
				order = fsml_systate .current_stack .get_next_pseudo_order ();

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
}


function append_to_order
(
	order: number,
	compex: Compex,
	_synonymous: Array<string>
)
{
	const ordered_subexpressions = fsml_systate .current_stack .ordered_subexpressions;

	if (! ordered_subexpressions [order])
		ordered_subexpressions [order] = [];

	const subexpressions = ordered_subexpressions [order];

	for (const index in subexpressions)
		if (subexpressions [index][0] === compex) return;

	ordered_subexpressions [order] .push ([compex, _synonymous]);
}


function synonymous (compex: Compex): Array<string>
{
	let synonymous = [];
	const stack_items = fsml_systate .current_stack .items_digest ();

	if (fsml_systate .current_stack .item_names .length === 0)
		return synonymous;

	stack_items .forEach (function (item, index)
		{
			if (stack_items [index] .compex === compex )
			{
				synonymous =
					synonymous .concat (fsml_systate .current_stack
						.another_item_names [index]);

				const name = fsml_systate .current_stack .item_names [index];

				if (!name) return;

				synonymous .push (name);
			}
		});

	return synonymous;
}
