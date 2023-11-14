
/* @flow */

// $FlowFixMe
import { Abstract_stack } from "./abstract-stack.js";




export class StacksChain
{
	container: Array<Abstract_stack> = [ new Abstract_stack ];


	get current ()
	{
		return this .container .at (-1);
	}


	set current (quot: Abstract_stack)
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
