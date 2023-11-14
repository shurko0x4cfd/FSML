
/*  */

// $FlowFixMe
import { Abstract_stack } from "./abstract-stack.js";




export class StacksChain
{
	container = [ new Abstract_stack ];


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
