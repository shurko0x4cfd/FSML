
/* FSML EDE 0.3 */

/* FSML programming language elementary IDE */
/* (c) 2021, 2022 Alexander Stadnichenko */
/* License : BSD */
/* Ver : 0.3.2 */
/* Upd : 22.08.12 */


import { get_fsml_instance } from './fsml.js';




const fsml = get_fsml_instance ();

/*
const lp = document .getElementById ("leftpane");
const inputform = document .getElementById ("inputform");
// const inbox = document .getElementById ("inbox");
const fsmlog = document .getElementById ("fsmlog");
*/

const [lp, inputform, fsmlog] =
	["leftpane", "inputform", "fsmlog"]
		.map (id => document .getElementById (id));


function fsmlog_type (fsml_out)
  { fsml_out = fsml_out .replace (/ /g, "&nbsp;");
	fsmlog .innerHTML += "\n<br>" +fsml_out; }

/*
Now don't send custom type function to compiler
fsml .environment .fsmlog_type = fsmlog_type;
*/

function handle_submit (e) {
	e .preventDefault ();

	const inbox = e .target .children [0];
	const fsml_eval = fsml .environment .fsml_eval,
		fsml_in = inbox .value;
  
	inbox .value = "";

	fsmlog_type (fsml_in);
	
	const fsml_eval_result = fsml_eval (fsml_in);
	
	if (fsml_eval_result)
	  fsmlog_type (fsml_eval_result);

	const r = fsml .environment .fsml_type_stack ();
	if (r) fsmlog_type (r);

	lp .scrollBy (0, 1000); }

window .addEventListener ("contextmenu", e => e .preventDefault(), false);
inputform .addEventListener ("submit", handle_submit, false);

