
/* @flow */

// $FlowFixMe
import { deep_copy,	new_str_uid } from "./base-voc.js";
// $FlowFixMe
import { StacksChain } from './stacks-chain.js';
// $FlowFixMe
import { FSMLoperation } from "./fsml-operation.js";




export class Compex
{
	operator: FSMLoperation;
	operand: Array<any>;
	comparative_computing_order: number;

	constructor (operands: Array<any>, operator: FSMLoperation, uco: number)
	{
		this .operand  = operands;
		this .operator = operator;
		this .comparative_computing_order = uco;
	}

	dc: Function = deep_copy;

	dc_postprocess = function (this: Compex, obj: Compex): Compex
	{
		// if str_uid is charact of rels must be the same for Q
		obj .str_uid = new_str_uid ("compex");
		obj .target_str_uid = "";

		return obj;
	}

	frozen = false;
	flags: Array<string> = [];
	// immaname
	str_uid: string = new_str_uid ("compex");
	target_str_uid: string = "";
	operands_offset = 0;
	reference_count = 1;
	type     = "Expression";
	shortype = "Exp";
	quotype = "";
	set_target_str_uid: ?Function;
	add_target_str_uid: ?Function;
	item_names_count: number;
	item_names: Array<string>;
	another_item_names: Array<Array<string>>;


	check_flag = (flag: string): boolean => this .flags .includes (flag);


	set_flag = (flag: string): void =>
		{ (flag in this .flags) || (this .flags .push (flag)) };


	dereference = (): void =>
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


	dereference_operands = (): void =>
	{
		this .frozen ||
			this .operand .forEach (item =>
				item && item .dereference && item .dereference ());
	}


	freeze = (): void => { this .frozen = true }


	unfreeze = (): void =>
	{
		this .frozen = false;

		this .reference_count < 0 &&
			fsmlog_type ("OMG. You unfreeze compex with negate value");

		this .reference_count === 0 &&
			this .dereference_operands ();
	}


	reference = (chain: StacksChain): void =>
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
	reference_no_subex = (): void =>
		{ this .reference_count += 1 }


	get_target_str_uid = function (this: Compex): string
	{
		return this .target_str_uid ||= new_str_uid ("subex");
	}
}


export class If_compex extends Compex
{
	item_names_count: number;
	item_names: Array<string>;
	another_item_names: Array<Array<string>>;
}
