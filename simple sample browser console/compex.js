
/*  */

// $FlowFixMe
import { deep_copy,	new_str_uid } from "./base-voc.js";
// $FlowFixMe
import { StacksChain } from './stacks-chain.js';
// $FlowFixMe
import { FSMLoperation } from "./fsml-operation.js";




export class Compex
{
	operator;
	operand;
	comparative_computing_order;

	constructor (operands, operator, uco)
	{
		this .operand  = operands;
		this .operator = operator;
		this .comparative_computing_order = uco;
	}

	dc = deep_copy;

	dc_postprocess = function ( obj)
	{
		// if str_uid is charact of rels must be the same for Q
		obj .str_uid = new_str_uid ("compex");
		obj .target_str_uid = "";

		return obj;
	}

	frozen = false;
	flags = [];
	// immaname
	str_uid = new_str_uid ("compex");
	target_str_uid = "";
	operands_offset = 0;
	reference_count = 1;
	type     = "Expression";
	shortype = "Exp";
	quotype = "";
	set_target_str_uid;
	add_target_str_uid;
	item_names_count;
	item_names;
	another_item_names;


	check_flag = (flag) => this .flags .includes (flag);


	set_flag = (flag) =>
		{ (flag in this .flags) || (this .flags .push (flag)) };


	dereference = () =>
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


	dereference_operands = () =>
	{
		this .frozen ||
			this .operand .forEach (item =>
				item && item .dereference && item .dereference ());
	}


	freeze = () => { this .frozen = true }


	unfreeze = () =>
	{
		this .frozen = false;

		this .reference_count < 0 &&
			fsmlog_type ("OMG. You unfreeze compex with negate value");

		this .reference_count === 0 &&
			this .dereference_operands ();
	}


	reference = (chain) =>
	{
		this .reference_count += 1;

		// if (!this .comparative_computing_order && this .reference_count > 0) // Check '&& this .reference_count >0' ?
		if (this .reference_count > 0)
		{
			this .comparative_computing_order =
				chain .current .get_next_computing_order ();

			chain .current .to_next_computing_order ();
		}
	}

	/* Not in use now */
	reference_no_subex = () =>
		{ this .reference_count += 1 }


	get_target_str_uid = function ()
	{
		return this .target_str_uid ||= new_str_uid ("subex");
	}
}


export class If_compex extends Compex
{
	item_names_count;
	item_names;
	another_item_names;
}
