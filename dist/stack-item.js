
/*  */

const u = undefined;

// $FlowFixMe
import { fsmlog_type } from './fsmlib.js';
// $FlowFixMe
import { deep_copy, new_str_uid } from "./base-voc.js";
// $FlowFixMe
import { Compex } from "./compex.js";
// $FlowFixMe
import { FSMLOperation } from './operation.js';




export class StackItem
{
	dc = deep_copy;

	dc_postprocess =
		function (obj)
		{
			obj .str_uid = new_str_uid ("stackitem");
			return obj;
		}

	str_uid = new_str_uid ("stackitem");
	reference_count  = 1;
	compex = new Compex ([], new FSMLOperation);


	reference = () => { this .reference_count += 1 };


	dereference = () =>
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
