#!/usr/bin/env node


import { get_fsml_instance } from './fsmlib.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';


const cl = console.log;
const EXIT_OK = 1;

let stack_items_separator = " -> ";
let ok_string = "\nfsml> ";

const readlineInterface = readline .createInterface({ input, output });
const fsml = get_fsml_instance();

cl(`
            ===========================================================
                                        FSML
            ===========================================================

            FSML  (c) 2021, 2024 Alexander (Shúrko) Stadnichénko
                        Type 'help' to FSML help you,
                 'license' to view BSD license, 'bb' to farewell
`);

let done = false;

while (!done)
{
	const stack = fsml .stack .type();
	cl ("\n" + '[' + fsml.stack.depth() + ']  ' + stack .join (stack_items_separator));

	const source    = await readlineInterface .question (ok_string);
	const evaluated = fsml .eval (source);
	const text      = evaluated .text;

	text && cl("\n" + text);

	done = evaluated .done;
}

process .exit (EXIT_OK);
