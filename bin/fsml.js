#!/usr/bin/env node


import { get_fsml_instance } from 'fsmlang';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { cl } from 'raffinade';


let   stack_items_separator = " -> ";
let   ok_string = "\nfsml> ";

const readlineInterface = readline .createInterface ({ input, output });
const fsml = get_fsml_instance ();

cl (`
            ==========================================================
                                       FSML
            ==========================================================

            FSML 0.4.8, (c) 2021, 2023 Alexander (Shúrko) Stadnichenko
                        Type 'help' to FSML help you,
                 'license' to view BSD license, 'bb' to farewell
`);

let done = false;

while (!done)
{
        const logtext = await readlineInterface .question (ok_string);
        const fsml_eval_result = fsml .eval (logtext) || '';

        fsml_eval_result &&
                cl ("\n" + fsml_eval_result);

        const stack = fsml .stack .type ();

        cl ("\n" + '[' + fsml .stack .depth () + ']  ' + stack. join (stack_items_separator));
}

cl ("\nBye-bye. See you later");
