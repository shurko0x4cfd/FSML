
/* @flow */

// $FlowFixMe
import { cl, u } from '../node_modules/raffinade/JS/raffinade.js';
// $FlowFixMe
import { deep_copy, new_str_uid } from "./factored.js";
// $FlowFixMe
import { Compex } from "./compex.js";
// $FlowFixMe
import { FSMLoperation } from './fsml-operation.js';




export class Abstract_stack_item
{
	dc: Function = deep_copy;

	dc_postprocess =
		function (obj: Abstract_stack_item): Abstract_stack_item
		{
			obj .str_uid = new_str_uid ("stackitem");
			return obj;
		}

	str_uid: string = new_str_uid ("stackitem");
	reference_count: number  = 1;
	compex: Compex = new Compex ([], new FSMLoperation);


	reference = (): void => { this .reference_count += 1 };


	dereference = (): void =>
	{
		if (this .reference_count === 0)
		{
			fsmlog_type ("OMG. You attempt to dereference stack item with zero reference count");
			return;
		}

		this .reference_count -= 1;

		this .reference_count ||
			this .compex .dereference ();
	};
}
