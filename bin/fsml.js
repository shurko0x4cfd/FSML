#!/usr/bin/env node


import { get_fsml_instance } from 'fsmlang';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { cl, EXIT_OK } from 'raffinade';


let stack_items_separator = " -> ";
let ok_string = "\nfsml> ";

const readlineInterface = readline.createInterface({ input, output });
const fsml = get_fsml_instance();

cl(`
            ===========================================================
                                        FSML
            ===========================================================

            FSML 0.5.15 (c) 2021, 2023 Alexander (Shúrko) Stadnichénko
                        Type 'help' to FSML help you,
                 'license' to view BSD license, 'bb' to farewell
`);

let done = false;

while (!done)
{
	const stack = fsml.stack.type();
	cl("\n" + '[' + fsml.stack.depth() + ']  ' + stack.join(stack_items_separator));

	const source    = await readlineInterface .question (ok_string);
	const evaluated = fsml .eval (source);
	const text      = evaluated .text;

	text && cl("\n" + text);

	done = evaluated .done;
}

process .exit (EXIT_OK);
