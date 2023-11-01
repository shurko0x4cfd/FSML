
/* FSML EDE 0.3 */

/* FSML programming language elementary IDE */
/* (c) 2021, 2022 Alexander Stadnichénko */
/* License : BSD */
/* Ver : 0.3.7 */

/* eslint-disable */


import { get_fsml_instance } from './fsmlib.js';




const fsml = get_fsml_instance ();
const item_separator = " -> ";

const [lp, inputform, fsmlog] =
	["leftpane", "inputform", "fsmlog"]
		.map (id => document .getElementById (id));


const fsmlog_type = fsml_out =>
	fsmlog .innerHTML += fsml_out;


/*
	It's possible to send a custom typing function to the compiler for his type
	text directly, but this doesn't look like the best idea

	fsml .set .typer (fsmlog_type);
*/


function handle_submit (evt)
{
	evt .preventDefault ();

	const scroll_amount = 1000;

	const inbox = evt .target .children [0];
	const source = inbox .value;
	inbox .value = "";

	source && fsmlog_type ("\n\n" + source);

	const evaluated = fsml .eval (source);
	const text      = evaluated .text;

	text && fsmlog_type ("\n\n" + text);

	const stack = fsml .stack .type ();

	if (evaluated .done)
	{
		inputform.removeEventListener ("submit", handle_submit);
		handle_submit = () => undefined;
		return;
	}

	fsmlog_type ("\n\n" + '[' + fsml .stack .depth () + ']  ');

	if (stack .length)
		fsmlog_type (stack. join (item_separator));

	lp .scrollBy (0, scroll_amount);
}


window .addEventListener ("contextmenu", evt => evt .preventDefault (), false);
inputform .addEventListener ("submit", handle_submit, false);

