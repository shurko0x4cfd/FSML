# FSML
**Kawaii homoiconic postfix concatenative programming language**

FSML is Forth/Factor-like programming language and transpiller for. Now in infancy. Language expected to be mainly procedural with wide functional style support. Intended mainly to static compilation to othes high-level languages. First to JavaScript and PHP, then to others on my choose. Then I hope add interpretation abilities for dialog work.

Stack is abstraction of compile time. Compiler \[should\] produce code with munimal runtime overhead. With no any virtual machine. With no any byte code or threaded code. With no any stack or stack juggling at run time. Look, text `1 2 3 swap drop +` compiled to JS code `var subex_0 = 1 + 3;` You see no any stack or stack manipulation in produced code, no interpretation at run time, hence no overhead.

Language planed to be mainly lightweight, easy and portable frontend for target languages. It's what CoffeeScript for JavaScript.

Currently implemented quotations. Among control statements implemented 'if' and 'while' statement. Othes control statements not implemented yet.

REPL environment currently not provide interpretation abilities, only manual control of step-by-step compilation process. After every **enter** hint system type stack from left window margin to right from top of stack to bottom separated by separator like ' -> ' or ' | ' or ', ' or so. Arrow show direction to stack bottom. Stack items is expressions (in form of abstract tree inside system) which keep all history of operations on. Stack items is printed as infix expressions of target language.

Features:

* Stacks and quotations are the same thing. At time '\[' occur, current stacks id keep in stacks chain, new empty stack allocated and established as current. At time '\]' occur, id of current (nested) quotation/stack placed on top of embrace (previous) stack and previous stack established as current again. For example text `12 34 [ 56 78 ]` leave stack Quot -> 34 -> 12, where Quot is pointer to stack/quotation which contain elements 78 -> 56.

* Operations on empty stack allowed! It produce expressions with variables. Enclose it in brackets produce quotation. Text `1 2 [ [ + ] apply ] apply` also work as well as `1 2 [ + ] apply`.

* Objects duplicated with classic Forth words as dup, over, etc accessible by reference not by value! Need 'ind' to detach stack item and some time 'dc' to deep copy of object which stack item refer to. Apply quotation on current stack convert this quotation and current stack to bunch of expressions of current stack which is quotation per se. It is not obligate expressions with variables. Although if arguments of quotation contain variables itself or just not enough arguments for quotation in current stack then 'apply' produce expressions with variables. Need use 'dc' on copy of quotation for keep original quotation for use late. Otherwise any 'apply' occured transform it in itself distinctive manner.

1. From under the node just run `fsml` in the shell, if installed globally `sudo npm i -g fsmlang`. Or run `node dist/fsml.js`

2. Run in browser from under the local server, otherwise there will be a "CORS request not HTTP" error.

Command line starts with '> ' or 'fsml > ' or 'fsml> '. Almost no error handling yet. On error system often crush and require reload of page. Open browsers console to track it.


Example of transpiling to JS with '.js' :

```forth
12 34 + 56 78 -

\ [2]  56 - 78 -> 12 + 34

.js

\ var subex_2 = 12 + 34;
\ var subex_3 = 56 - 78;
```


Example of JS evaluation with '.eval' :

```forth
as df + 56 78 -

\ [2]  56 - 78 -> "as" + "df"

.eval

\ evaluated stack: [ -22, asdf ]
```


Example of limited conversion of expression on top of the stack to an anonymous oneliner procedure with 'ol' :

```forth
+ * ol

\ [1]  (var_2, var_3, var_4) => var_4 * (var_3 + var_2)
```


Example of defining an anonymous procedure and assigning it to the variable 'mul' with '!' :

```forth
* ol mul !    .js

\ var mul = (var_0, var_1) => var_1 * var_0;
```

Example of computing factorial of 12 in functional manner with 'if', '1range' and '1fold' :

```forth
* ol mul !
12 dup [ 1 1range mul @ 1fold ] [ 0 ] if .eval

\ evaluated stack: [479001600]
```

Example of computing factorial of 12 in procedural manner with 'if' and 'while' :

```forth
12 dup [ 1 [ over * over 1 - ] while swap dp ] [ 0 ] if .eval

\ evaluated stack: [479001600]
```
