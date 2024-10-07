
/* FSML EDE */

/* FSML programming language elementary IDE */
/* (c) 2021, 2024 Alexander Stadnichénko */
/* License : BSD 2 */

/* eslint-disable */


import { get_fsml_instance } from '../dist/fsmlib.js';


const fsml = get_fsml_instance ();
const item_separator = " -> ";
const scroll_amount = 1000;

const terminal = document .querySelector ('#terminal-df81b1e9da18.fsml-term');

const [fsmlog, inbox] =
	['.fsml_term__log', '.fsml_term__inbox',]
		.map (class_name => terminal .querySelector (class_name));

const type = fsml_out =>
	fsmlog .innerHTML += '<div class="fsml-term__log-item">' + fsml_out + '</div>';

/*
	It's possible to send a custom typing function to the compiler for his type
	text directly, but this doesn't look like the best idea

	fsml .set .typer (type);
*/

/**
 * Handles the action when the 'Enter' key is pressed in the input field.
 * - Scrolls the left pane by a fixed amount.
 * - Evaluates the input source code and displays the result in the fsmlog.
 * - Removes the input field and its event listener if evaluation is done.
 */
function on_enter ()
{
	const source = inbox.value;

	source && type (source);

	const evaluated = fsml .eval (source);
	const text      = evaluated .text;

	text && type (text);

	const stack = fsml .stack .type ();

	if (evaluated .done)
	{
		inbox .removeEventListener ("keydown", on_keydown);
		inbox .remove ();

		return;
	}

	const depth = '[' + fsml .stack .depth () + '] ';
	type (depth + ' ' + stack. join (item_separator));

	terminal .scrollBy (0, scroll_amount);
}

/** Adjusts the height of the inbox element to fit its content */
const fit_height = () =>
{
    inbox .style .height = 'auto'; // !!!
	inbox .style .height = inbox .scrollHeight + 'px';
}

/**
 * Handles the keydown event for the inbox element.
 * If the Enter key is pressed, prevents the default action,
 * calls the on_enter function, and clears the inbox value after a delay.
 * Adjusts the height of the inbox element after a delay.
 */
const on_keydown = evt =>
{
	if (evt .key === 'Enter')
	{
		evt .preventDefault ();
		on_enter ();
		setTimeout (() => inbox .value = '');
	}

	setTimeout (fit_height);
};


terminal .addEventListener ("contextmenu", evt => evt .preventDefault ());
inbox .addEventListener ("keydown", on_keydown);


// const lineCount = (inbox.value.match(/\n/g) || []).length + 1;
// inbox.rows = lineCount;

// inbox.selectionStart = 5;
// inbox.selectionEnd = 5;
