
/*  */

// $FlowFixMe
import { Quotation } from "./quotation.js";




export class StacksChain
{
	container = [ new Quotation ];


	get current ()
	{
		return this .container .at (-1);
	}


	set current (quot)
	{
		this .container .push (quot);
	}


	pop ()
	{
		return this .container .pop ();
	}


	get length ()
	{
		return this .container .length;
	}
}
