
/* FSML EDE 0.3 */

/* FSML programming language elementary IDE */
/* (c) 2021, 2022 Alexander Stadnichenko */
/* License : BSD */
/* Ver : 0.3.4 */
/* Upd : 22.08.19 */


import { get_fsml_instance } from './fsml.js';




const fsml = get_fsml_instance ();
const item_separator = " -> ";

const [lp, inputform, fsmlog] =
	["leftpane", "inputform", "fsmlog"]
		.map (id => document .getElementById (id));


function fsmlog_type (fsml_out)
{
	fsml_out = fsml_out .replace (/ /g, "&nbsp;");
	fsmlog .innerHTML += "\n" +fsml_out;
}


/*
	It's possible to send a custom typing function to the compiler for hi type
	text directly, but this doesn't look like the best idea

	fsml .set .typer (fsmlog_type);
*/


function handle_submit (evt)
{
	evt .preventDefault ();

	const scroll_amount = 1000;

	const inbox = evt .target .children [0];
	const logtext = inbox .value;
	inbox .value = "";

	logtext &&
		fsmlog_type ('<br>&nbsp;<br>' + logtext);

	const fsml_eval_result = fsml .eval (logtext) || '';
		
	fsml_eval_result &&
		fsmlog_type ('<br>&nbsp;<br>' + fsml_eval_result);

	const stack = fsml .stack .type ();

	fsmlog_type ('<br>&nbsp;<br>' + '[' + fsml .stack .depth () + ']  ');

	if (stack .length)
		fsmlog_type (stack. join (item_separator));

	lp .scrollBy (0, scroll_amount);
}


window .addEventListener ("contextmenu", evt => evt .preventDefault (), false);
inputform .addEventListener ("submit", handle_submit, false);

