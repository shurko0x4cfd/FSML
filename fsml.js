
/* FSML 0.2 */

/* FSML programming language compiler */
/* Copyright (c) 2021 Alexander (Shurko) Stadnichenko */
/* License : BSD */
/* Ver : 0.2.47 */
/* Upd : 21.07.30 */


// TODO SVN, Git, Refactor, unordereds, proper ordering, debug, refine, return
//      statement,
//      push/pop, access by index, escape/unescape, hash, native injection,
//      auto expressions reduce == constant precomputing, refine stack output,
//      comments, stack type switcher, stack type style switcher,
//      automatic testing, Q1 Q2 *, two text style,
//      Mode of everlasting ], <switcher/trigger> alternates?,

//      russian translate

//      sequences, referencing, load/import/include,
//      arbitrary environment functions, loops,
//      true recursion, exceptions,

//      [<num>] <constant> == <expression> -> ...

//      'eval
//      return: [ ... ], stack: [ ... ]'


// TODO Excogitate : Elegance, security, robust, modularity, self-explanatory,
//      simplicity, reusability, paradigm, recursive frozen?

// TODO Document : 'nowalk', 'envariable', 'nopure', 'need_id_substitution' and so

// fsmin, dram, i - independent or individual

cl = console .log; // Aforethought global!
var fsml = {}; // Try occupy global


;(function (){


var BSD_license = 
"<br>Copyright (c) 2021 Alexandr (Shurko) Stadnichenko <br>All rights reserved. <br> <br>Redistribution and use in source and binary forms, with or without <br>modification, are permitted provided that the following conditions are met: <br> <br>1. Redistributions of source code must retain the above copyright notice, this <br>   list of conditions and the following disclaimer. <br>2. Redistributions in binary form must reproduce the above copyright notice, <br>   this list of conditions and the following disclaimer in the documentation <br>   and/or other materials provided with the distribution. <br> <br>THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND <br>ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED <br>WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE <br>DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR <br>ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES <br>(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; <br>LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND <br>ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT <br>(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS <br>SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.";


var fsml_systate =
  { need_full_substitution: false,
    quote_default_type: '"', };

var stacks_chain = [];

var js_operation_priority =
  { ">": 0,
    "+": 1, "-": 1,
    "*": 2, "/": 2,
    "**": 3,
    "leaf": 100 };


var new_str_uid = 
    (function (){
        var uids = {};
        return function (prefix)
          { if (prefix in uids ^ true)
              { uids [prefix] = 0; }
            return prefix +"_" +uids [prefix]++; }})();


current_stack = new Abstract_stack (); // Aforethought global


fsml = {
    environment: {
        fsmlog_type: undefined,
        fsml_type_stack: type_stack,
        fsml_eval:   fsml_eval }};


var fsmlog_type = function (fsml_out)
  { fsmlog_type = fsml .environment .fsmlog_type; 
    fsmlog_type (fsml_out); }


function deep_copy ()
  { var new_object = new this .constructor ();

    for (var i in this)
      { new_object [i] = this [i]; }

    if (new_object .comparative_computing_order)
      { ++current_stack .utmost_computing_order; // ! Why exactly current stack ?
        new_object .comparative_computing_order = current_stack .get_utmost_computing_order (); } // M.b. '.get_next_computing_order ()' ?

    for (var i in new_object)
      { var item = new_object [i];
        if (item === undefined || item === null) { continue; }
        if (item && item .dc)
          { new_object [i] = item .dc (); }
        else
          { if (item && item .constructor === [].constructor || item .constructor === {} .constructor)
              { new_object [i] = deep_copy .apply (item); } } }

    if (this .dc_postprocess) { new_object = this .dc_postprocess (new_object); }

    return new_object; }


function Abstract_stack (container)
  { this .dc = deep_copy;

    this .dc_postprocess = function (obj)
      { obj .str_uid = new_str_uid ("quotation");
        obj .actual_target_names = false;
        return obj; }

    this .str_uid = new_str_uid ("quotation");

    this .flags = [];

    // When performed deep copy of quotation we need to reset cached identifiers
    // of target language in copy because old names belong to original quotation
    this .actual_target_names = true;

    this .utmost_computing_order = 0; // Indexes is comparative, absolute value has no matter
    this .pseudo_order = 0; // For translation with no assign real order for stackitems
    this .tail_starts_from = 0; // Even if container presented ?
    this .container = [];
    this .assignments = [];

    this ._need_id_substitution = undefined;
    this .isloop = false;
    this .ordered_subexpressions = [];

// [ "str", "str", ... "str" ] Precalculated function argument names
// or top stack values at loop start if any
    this .predefined_argument_names = [];
    this .item_names = [];
    this .another_item_names = [];

// As values (if any) for keys in this .predefined_argument_names
//    this .preordered_incoming_values_if_any = [];

// Either "flat" 
// or "anon" : function (<args if any>) { /* ... */; return <resul>; })
// or "native" : function <name> (<args if any>) { /* ... */; return <resul>; }
// or "until" : var loop_condition=true; while (loop_condition) { /* ... */; }
// or "no-incomings" : function () { /* ... */; return <resul>; })
    this .kind_of_next_compilation = "no-incomings";

    this .compiled_function_name_if_named = "";
    this .latest_native_eval_result = [];

    this .target_text = "";
    this .aliastatement = "";
    this .indent_size = 0;
    this .return_statement = "";
    this .return_items = [];
    this .evalresult = undefined;
    this .uids_already_in_equation_left = [];
    this .str_uids_to_rename = []; }


var as_proto = Abstract_stack .prototype;

as_proto .depth = function () { return this .container .length; }

as_proto .items_digest = function () { return this .container .slice (); }

as_proto .push = function (item) { this .container .push (item); }


as_proto .get_next_computing_order = function ()
    { return ++this .utmost_computing_order; }


as_proto .to_next_computing_order = function ()
    { ++this .utmost_computing_order; }


as_proto .get_next_pseudo_order = function ()
    { return ++this .pseudo_order +this .utmost_computing_order; }


as_proto .reset_pseudo_order = function ()
    { this .pseudo_order = 0; }


as_proto .get_utmost_computing_order = function ()
    { return this .utmost_computing_order; }


as_proto .set_flag = function (flag)
    { (flag in this .flags) || (this .flags .push (flag)) }


as_proto .check_flag = function (flag)
    { return this .flags .includes (flag); }


as_proto .extend_stack_if_necessary = function (index){
    var c = this .container,
        l = c.length;
    if (index +1 > l){
        var lack = index +1 - l;
        this .container = this .materialize_tail (lack) .concat (c);
        this .tail_starts_from += lack; } }


as_proto .materialize_tail = function (lack){
    var tail = [];
    for (var fv_index = this .tail_starts_from +lack -1; fv_index >= this .tail_starts_from; fv_index--)
        { tail .push (new_fv_item (fv_index)); }
    return tail; }


as_proto .get_quotation_item = function (){
    var asi = new Abstract_stack_item ();
    asi .compex .type = "Quotation";
    asi .compex .shortype = "Q";
    asi .compex .operand [0] = this;
    asi .compex .operator = base_voc ["quotation"];
    return asi; }


as_proto .pop  = function (){
    var index = 0;
    this .extend_stack_if_necessary (index);
    var c = this .container;
    return c .pop (); }


as_proto .get  = function (index){
    this .extend_stack_if_necessary (index);
    var c = this .container;
    var l = c .length;
    return c [l -1 -index]; }


as_proto .set  = function (index, value){
    this .extend_stack_if_necessary (index);
    var c = this .container;
    var l = c .length;
    c [l -1 -index] = value; }


as_proto .need_id_substitution = function () { return this ._need_id_substitution; }


as_proto .type_stack = function ()
  { var self = this;
    fsml_systate .need_full_substitution = true;
    this .order_subexpressions ();
    var reversed_stack = (current_stack .items_digest ()) .reverse (),
        fsml_out = "[" +reversed_stack .length .toString () +"]",
        item_separator = " ";
    fsmlog_type ("");
    reversed_stack .forEach (function (item)
      { self ._need_id_substitution = item .compex;
        fsml_out += item_separator +compex_to_infix_str (item .compex);
        item_separator = " -> ";});
    fsmlog_type (fsml_out); }


as_proto .translate_to_js = function ()
  { var self = this;
    var indent_string = "&nbsp;" .repeat (current_stack .indent_size);
    fsml_systate .need_full_substitution = false;
    this .uids_already_in_equation_left = [];
    this .str_uids_to_rename = [];

    // ! for same compexes item override id next time unlike case next item equal previous
    // ! write to targrt_str_uid have no effect to suppliers
    this .item_names .forEach (function (item, index)
      { var element = self .container [index] .compex;
        element .target_str_uid = item; });

    this .item_names .forEach (function (item, index)
      { var element = self .container [index] .compex;
        if (element .check_flag ("deliverer"))
          { element .set_target_str_uid (item); } });

    this .order_subexpressions ();

    this .target_text = "";

    function process_expression (item, index)
      { var compex = item [0];
        var syn_list = item [1];

        self ._need_id_substitution = compex;
        var translated_expression = compex_to_infix_str (compex);
        var syn = "", syn_declarations = "", comma = "";

        if (syn_list .length > 1)
          { syn_declarations = "<br>" +indent_string +"var ";
            syn_list .forEach (function (item)
              { if (!item)
                  { cl ("item undefined or \"\"");
                    cl (item);
                    return }; // ! Can be undefined, is issue and call for fix
                if (item === translated_expression) { return; }
                syn += item +" = ";
                syn_declarations += comma +item;
                comma = ", "; });
            syn_declarations += ";"; }

        if (syn_list .length === 1)
          { var syn_item = syn_list [0];
            if (syn_item && (syn_item !== translated_expression))
              { syn = "var " +syn_item +" = "; }
            if (syn_item && (syn_item === translated_expression))
              { syn = ""; } } // "/* Tautology '" +syn_item +" = " +syn_item +"' excluded */"; } }

        target_str_uid = compex .get_target_str_uid ();

        if (compex .operator .check_flag ("no_equation") || compex .check_flag ("no_equation"))
          { self .target_text += "<br>" +translated_expression; }
        else
          { if (syn)
              { self .target_text += syn_declarations +"<br>" +indent_string +syn +translated_expression +";"; 
                syn_list .forEach (function (item) { self .uids_already_in_equation_left .push (item); }); }

            if (!syn && translated_expression !== target_str_uid) // <-- Exclude tautology ala 'var name = name;'
              { self .target_text += "<br>" +indent_string +"var " +target_str_uid +" = " +translated_expression +";";
                self .uids_already_in_equation_left .push (target_str_uid); } } }

    this .ordered_subexpressions .forEach (function (group)
          { group .forEach (process_expression); });

    var str_uids_to_rename = current_stack .str_uids_to_rename;
    current_stack .aliastatement = "";

    if (str_uids_to_rename .length > 0)
      { var comma = "";
        str_uids_to_rename .forEach (function (item, index)
          { current_stack .aliastatement += comma +item +"_copy" +" = " +item;
            comma = ",<br>" +indent_string +"&nbsp;" .repeat (15); });
        if (current_stack .aliastatement)
          { current_stack .aliastatement = "<br>" +indent_string +"&nbsp;" .repeat (8) +"var " +current_stack .aliastatement +";<br>"; } }

    if (current_stack .isloop)
      { current_stack .target_text = current_stack .aliastatement +current_stack .target_text; } }


function translate_empty_quotation (indent_size, item_names, another_item_names)
  { var target_text = "";
    var var_declarations = "";
    var assign_statement = "";
    var comma = equation = "";

    var indent_string = "&nbsp;" .repeat (indent_size);
    
    item_names = item_names || [];

    item_names .forEach (function (item, index)
      { if (! item) { return; }
        var_declarations = var_declarations +comma    +item;
        assign_statement = assign_statement +equation +item;
        comma = ", "; equation = " = "; });

    another_item_names .forEach (function (item)
      { if (item .length === 0) { return; }
        var_declarations = var_declarations +comma    +item .join (", ");
        assign_statement = assign_statement +equation +item .join (" = ");
        comma = ", "; equation = " = "; });

    if (var_declarations)
      { var_declarations = "var " +var_declarations +";"; }

    if (assign_statement)
      { assign_statement += " = undefined;"; }

    if (var_declarations || assign_statement)
      { target_text = "<br>" +indent_string +var_declarations
                     +"<br>" +indent_string +assign_statement; }

    return target_text; }


as_proto .get_target_text = function () { return this .target_text; }


as_proto .get_return_items = function ()
  { return this .return_items .map (function (compex)
              { return compex .envariable || compex .get_target_str_uid (); }) }


as_proto .get_return_statement = function ()
  { return "return [ "
          +this .get_return_items () .join (", ")
          +" ];"; }


as_proto .order_subexpressions = function ()
  { var self = this;
    this .ordered_subexpressions = [];
    this .reset_pseudo_order ();
//    this .return_items_old = [];
    this .return_items = [];

    var stack = current_stack .items_digest ();

    stack .forEach (function (item, position)
      { self ._order_subexpressions (item .compex, item, position); } );

    current_stack .assignments .forEach (function (item, position)
      { self ._order_subexpressions (item .compex, {}, position); } );

    this .return_items .reverse (); }


as_proto ._order_subexpressions = function (compex, item, position)
  { var operator = compex .operator;
    if ((operator === base_voc ["fv"]) && (compex !== item .compex)) { return; }

    var _synonymous = synonymous (compex);

    var like_subex = compex .reference_count > 1 || compex .check_flag ("subex") || operator .check_flag ("nopure");

    if (like_subex)
      { var str_uid;

        if (this .actual_target_names)
          { str_uid = compex .envariable || compex .get_target_str_uid () || new_str_uid ("subex"); }
        else
          { str_uid = compex .envariable || new_str_uid ("subex"); }

        append_to_order (compex .comparative_computing_order, compex, _synonymous);
        compex .target_str_uid = str_uid; }

    var is_stack_item = compex === item .compex;

    var already_in_order = false;
    /* current_stack .ordered_subexpressions .forEach (function (item)
      { if (item [0] === compex) { already_in_order = true; } }); */

    if (is_stack_item && !like_subex && !already_in_order)
      { if (compex .comparative_computing_order !== undefined)
          { var order = compex .comparative_computing_order; }
        else
          { var order = current_stack .get_next_pseudo_order (); }

        append_to_order (order, compex, _synonymous); }

    if (is_stack_item)
      { compex .target_str_uid = compex .envariable || compex .get_target_str_uid () || new_str_uid ("subex");
        var target_str_uid = compex .envariable || compex .get_target_str_uid ();
        this .return_items .push (compex); }

    if (operator .check_flag ("nowalk")) {return;}

    if (operator === base_voc ["leaf"]) { return; }
    //if (operator === base_voc ["fv"]) { return; }

    for (var i = compex .operands_offset;  i < compex .operand .length; i++)
        { var operand = compex .operand [i];
            operand && this ._order_subexpressions (operand, item, position); } }


function append_to_order (order, compex, _synonymous)
  { var ordered_subexpressions = current_stack .ordered_subexpressions;

    if (! ordered_subexpressions [order])
      { ordered_subexpressions [order] = []; }

    var subexpressions = ordered_subexpressions [order];

    for (var index in subexpressions)
      { if (subexpressions [index][0] === compex)  { return; } }

    ordered_subexpressions [order] .push ([compex, _synonymous]); }


function synonymous (compex)
  { var envariable = compex .envariable && [ compex .envariable ];
    var _synonymous = envariable || [];
    var stack_items = current_stack .items_digest ();

    stack_items .forEach (function (item, index)
      { if (current_stack .item_names .length > 0 && stack_items [index] .compex === compex ){
            _synonymous = _synonymous .concat (current_stack .another_item_names [index]);
            var name = current_stack .item_names [index];
            if (! name) { return; }
            _synonymous .push (name); } });

    return _synonymous; }


function fsml_eval (fsml_in)
  { fsml_in = alt_split (fsml_in);
    for (var i in fsml_in)
      { compile_term (fsml_in [i][0], fsml_in [i][1]); }; }


function type_stack ()
  { current_stack .type_stack (); }


function alt_split (s)  // <-- Draft
  { var result = [];
    var first, last, quotype, _substring = "";
    do
      { s = s .trimLeft ();
        if (s .length === 0) { return result; }

        quotype = s [0];

        if (quotype === '"')
          { s = s .substring (1);
            last = s .search (/" |"$/); }

        else if (quotype === "'")
          { s = s .substring (1);
            last = s .search (/' |'$/); }

        else
          { quotype = "";
            last = s .search (/. |.$/) +1; }

        if (last === -1)
          { fsmlog_type ("OMG. No follow quotation mark. Discarded");
            return result; }

        _substring = s .substring (0, last);
        s = s .substring (last +1);        
        result .push ([_substring, quotype]); }

    while (s .length);

    return result; }


function compile_term (term, quotype)
  { var val;

    if (!quotype && !term .trim ())
        { fsmlog_type ("Warning: strange non-quoted empty term income..."); }

    if ((quotype === '"') || (quotype === "'"))
      { compilit ("String", "Str", term);
        var as0 = current_stack .get (0);
        as0 .compex .quotype = quotype;
        return; }

    if (term === "NaN") { fsmlog_type ("Warning: strange 'NaN' term income..."); }

    val = parseInt (term);
    if (term === val .toString ())
        { compilit ("Number", "Num", val); return; }

    val = parseFloat (term);
    if (term === val .toString ())
        { compilit ("Float", "Fp", val); return; }

    if (term in base_voc)
        { base_voc [term] .compilation_semantics (); return; }

    compilit ("String", "Str", term);
    var as0 = current_stack .get (0);
    as0 .compex .quotype = fsml_systate .quote_default_type;

    return; }


function FsmlOperation (true_name, flags, compilation_semantics, target_translation_semantics)
  { this .true_name = true_name;
    this .flags = flags;
    this .compilation_semantics = compilation_semantics;
    this .translate_to_target = target_translation_semantics; }


FsmlOperation .prototype .check_flag = Abstract_stack .prototype .check_flag;


var base_voc = {
//    "":    new FsmlOperation ("", [], _semantics, _target_translation_semantics),

    "license":  new FsmlOperation ("license", [],  license_semantics),
    "bb":   new FsmlOperation ("bb", [],  function () { fsmlog_type("<br>Bye-bye. See you later") }),

    "tojs": new FsmlOperation ("tojs", [], tojs_semantics),
    ".js": new FsmlOperation (".js", [], dot_js_semantics),
    "eval": new FsmlOperation ("eval", [], eval_semantics),
    ".eval": new FsmlOperation (".eval", [], dot_eval_semantics),
    "red": new FsmlOperation ("red", [], red_semantics),

    "leaf": new FsmlOperation ("leaf", ["nowalk"]),

    // Why no_equation ?
    // "quotation":   new FsmlOperation ("quotation", ["nowalk", "no_equation"], undefined, quotation_target_translation_semantics),

    "quotation":   new FsmlOperation ("quotation", ["nowalk"], undefined, quotation_target_translation_semantics),

    "fv":   new FsmlOperation ("fv", ["nowalk"]),

    "ordered":   new FsmlOperation ("ordered", [], orderd_semantics),

    "[":    new FsmlOperation ("[", [], open_quotation_semantics),
    "]":    new FsmlOperation ("]", [], close_quotation_semantics),
    "apply":    new FsmlOperation ("apply", [], apply_semantics),

    "+":    new FsmlOperation ("+", [], undefined, plus_target_translation_semantics),
    "-":    new FsmlOperation ("-", [], undefined, minus_target_translation_semantics),
    "*":    new FsmlOperation ("*", [], undefined, mult_target_translation_semantics),
    "/":    new FsmlOperation ("/", [], undefined, div_target_translation_semantics),
    "pow":  new FsmlOperation ("pow", [], undefined, pow_target_translation_semantics),

    ">":    new FsmlOperation (">", [], undefined, great_target_translation_semantics),

    "!":    new FsmlOperation ("!", [], exclamark_semantics),
    "@":    new FsmlOperation ("@", [], fetch_semantics),

    "id":   new FsmlOperation ("id", [], id_semantics),
    "identifier":  new FsmlOperation ("identifier", ["nowalk"], undefined, identifier_target_translation_semantics),

    "ind":    new FsmlOperation ("ind", [], independent_semantics),
    "i":      new FsmlOperation ("i",   [], independent_semantics),

    "dc" :    new FsmlOperation ("dc",  [], deep_copy_semantics),
    "depth":    new FsmlOperation ("depth", [], depth_semantics),
    "drop": new FsmlOperation ("drop", [], drop_semantics),
    "dp": new FsmlOperation ("dp", [], drop_semantics),
    "dup":  new FsmlOperation ("dup", [], dup_semantics),
    "swap": new FsmlOperation ("swap", [], swap_semantics),
    "over": new FsmlOperation ("over", [], over_semantics),

    "list" : new FsmlOperation ("list",  [], list_semantics, list_target_translation_semantics),

    "if" : new FsmlOperation ("if",  ["no_equation"], if_semantics, if_target_translation_semantics),
    "if_supplier": new FsmlOperation ("if_supplier", [], undefined, if_supplier_target_translation_semantics),

    "while" : new FsmlOperation ("while",  ["no_equation"], while_semantics, while_target_translation_semantics),
    "while_supplier": new FsmlOperation ("while_supplier", [], undefined, while_supplier_target_translation_semantics),

    /*"until": new FsmlOperation ("until", [], until_semantics, until_target_translation_semantics),*/

    "time": new FsmlOperation ("time", ["nopure", "nowalk"], time_semantics, time_target_translation_semantics)


//    "nopure": new FsmlOperation ("nopure", ["nopure"], nopure_semantics, nopure_target_translation_semantics)
};


["+", "-", "*", "/", "pow", ">"] .forEach (function (term)
  { base_voc [term] .compilation_semantics = trivial_binary_operation (base_voc [term]); });


function open_quotation_semantics ()
  { stacks_chain .push (current_stack);
    current_stack = new Abstract_stack (); }


function close_quotation_semantics ()
  { if (stacks_chain .length === 0)
        { fsmlog_type ("OMG. You can't. You are in root quotation"); return; }

    var q = current_stack .get_quotation_item ();
    current_stack = stacks_chain .pop ();
    current_stack .push (q); }


function tojs_semantics ()
  { current_stack .translate_to_js (); }


function dot_js_semantics ()
  { tojs_semantics ();
    fsmlog_type (current_stack .get_target_text ()); }


function eval_semantics ()
  { current_stack .translate_to_js (); // Upd jsource

    var evalstr =
        "(function (){ "
       +(current_stack .get_target_text () +current_stack .get_return_statement ()) .replace (/<br>/g,"") .replace (/\&nbsp;/g,"")
       +" })();";

    current_stack .evalresult = eval (evalstr); }


function dot_eval_semantics ()
  { eval_semantics ();

    var evalresult_raw = current_stack .evalresult,
        evalresult_formatted = "<br>[ " + evalresult_raw .toString () .replace (/,/g,", ") +" ]"; // If result is str with ','?

    fsmlog_type (evalresult_formatted); }


function red_semantics ()
  { var as0 = current_stack .get (0);

    fsml_systate .need_full_substitution = true; // Bad place for this 3 line
    current_stack .order_subexpressions ();
    current_stack ._need_id_substitution = as0 .compex;

    var eval_result = eval (compex_to_infix_str (as0 .compex));

    as0 .compex .dereference ();
    as0 .compex = create_binary_compex (eval_result, undefined, base_voc ["leaf"]);

    /* To fix. Much much better if create_binary_compex will do it */
    as0 .compex ["type"] = "Reduced";
    as0 .compex ["shortype"] = "Red";

    if (typeof eval_result === "string")
      { as0 .compex .quotype = '"';
        as0 .compex ["type"] = "String";
        as0 .compex ["shortype"] = "Str"; }
    else
      { as0 .compex .quotype = ""; } }


function quotation_target_translation_semantics (operand)
  { var translate_kind = operand [1];

    if (! translate_kind)
      { return '"Quot"'; }

    var quotation = operand [0];

    stacks_chain .push (current_stack);
    current_stack = quotation;
    current_stack .actual_target_names = false;
    current_stack .translate_to_js ();

    var text = current_stack .target_text;
    current_stack = stacks_chain .pop ();

    return text; }


// _Postfix_ compound expression - node of semantic tree

function Compex (operands, operator)
  { this .dc = deep_copy;

    this .dc_postprocess = function (obj)
      { obj .str_uid = new_str_uid ("compex");
        obj .target_str_uid = new_str_uid ("subex");
        return obj; }

    this .frozen = false;
    this .flags = [];
    this .str_uid = new_str_uid ("compex");
    this .target_str_uid = undefined;
    this .operand  = operands;
    this .operands_offset = 0;
    this .operator = operator;
    this .reference_count = 1;
    this .comparative_computing_order = current_stack .utmost_computing_order;
//    this .comparative_computing_order = current_stack .get_next_computing_order ();
    this .type     = "Expression";
    this .shortype = "Exp"; }


Compex .prototype .set_flag   = as_proto .set_flag;
Compex .prototype .check_flag = as_proto .check_flag;


Compex .prototype .dereference = function ()
  { if (this .reference_count === 0)
        { fsmlog_type ("OMG. You attempt to dereference compex with zero reference count"); return; }
    this .reference_count -= 1;
    if (this .reference_count === 0)
        { if (! this .frozen) { this .dereference_operands (); } } }


Compex .prototype .dereference_operands = function ()
  { if (! this .frozen)
      { this .operand .forEach (function (item)
            { item && item .dereference && item .dereference (); }); } }


Compex .prototype .freeze   = function () { this .frozen = true; }


Compex .prototype .unfreeze = function ()
  { this .frozen = false;
    if (this .reference_count < 0)
      { fsmlog_type ("OMG. You unfreeze compex with negate value"); }
    if (this .reference_count === 0) { this .dereference_operands () } }


Compex .prototype .reference = function ()
  { this .reference_count += 1;
//    if (!this .comparative_computing_order && this .reference_count > 0) // Check '&& this .reference_count >0' ?
    if (this .reference_count > 0) // Check '&& this .reference_count >0' ?
      { this .comparative_computing_order = current_stack .get_next_computing_order ();
        current_stack .to_next_computing_order (); } }

/* Not in use now */
Compex .prototype .reference_no_subex = function ()
  { this .reference_count += 1; }


Compex .prototype .get_target_str_uid = function () { return this .target_str_uid; }


function create_binary_compex (operand_0, operand_1, operator)
  { return new Compex ([operand_0, operand_1], operator); }


function Abstract_stack_item ()
  { this .dc = deep_copy;

    this .dc_postprocess = function (obj)
      { obj .str_uid = new_str_uid ("stackitem");
        return obj; }

    this .str_id = new_str_uid ("stackitem");
    this .reference_count = 1;
    this .compex = create_binary_compex (); }


Abstract_stack_item .prototype .dereference = function ()
  { if (this .reference_count === 0)
        { fsmlog_type ("OMG. You attempt to dereference stack item with zero reference count"); return; }

    this .reference_count -= 1;
    if (this .reference_count === 0) { this .compex .dereference (); }}

Abstract_stack_item .prototype .reference = function ()
    { this .reference_count += 1; }


function new_stack_item (type, shortype, value, operation)
  { var asi = new Abstract_stack_item ();
    asi .compex .type = type;
    asi .compex .shortype = shortype;
    asi .compex .operand [0] = value;
    asi .compex .operator = base_voc [operation];
    return asi;}


function compilit (type, shortype, value)
    { current_stack .push (new_stack_item (type, shortype, value, "leaf")); }


function new_fv_item (fv_index)
    { return new_stack_item ("Free variable", "Fv", fv_index, "fv"); }


function compex_to_infix_str (compex)
  { var operator = compex .operator;

    if (operator === base_voc ["fv"])
      { if (current_stack .predefined_argument_names .length > 0)
          { var name_index = compex .operand [0];
            var name = current_stack .predefined_argument_names [name_index];

            if (current_stack .isloop && current_stack .uids_already_in_equation_left .includes (name))
              { current_stack .str_uids_to_rename .push (name);
                return name +"_copy" ; }

            return name; }
        else
            { return "fv_" +compex .operand [0]; } }

    if ((compex .reference_count > 1 || operator .check_flag ("nopure")) && !(current_stack .need_id_substitution () === compex) &&
        !fsml_systate .need_full_substitution )
      { var name = compex .get_target_str_uid ();

        if (current_stack .isloop && current_stack .uids_already_in_equation_left .includes (name))
          { current_stack .str_uids_to_rename .push (name);
            return name +"_copy"; }

        return name; }

    if (operator === base_voc ["leaf"])
      { var leaf = compex .operand [0] .toString ()
        var quotype = compex .quotype;
        if (quotype)
          { leaf = quotype +leaf +quotype; }
        return leaf; }

    /* if (operator === base_voc ["fv"])
      { if (current_stack .predefined_argument_names .length > 0)
          { var name_index = compex .operand [0];
            var name = current_stack .predefined_argument_names [name_index];            

            if (current_stack .isloop && current_stack .uids_already_in_equation_left .includes (name))
              { current_stack .str_uids_to_rename .push (name);
                return name +"_copy" ; }

            return name; }
        else
            { return "fv_" +compex .operand [0]; } } */

    return operator .translate_to_target (compex .operand, compex); }


function _substitute_variables (compex, p, n)
  { var operator = compex .operator;

    if (compex .reference_count > 1 || operator .check_flag ("nopure"))
      { compex .comparative_computing_order += current_stack .get_utmost_computing_order ();
        if (new_utmost_order < compex .comparative_computing_order)
            { new_utmost_order = compex .comparative_computing_order; } }

    if (operator === base_voc ["fv"])
      { var placeholder = p .operand [n] || new Compex ();
        var substitutional = current_stack .get (compex .operand [0]) .compex;
        p .operand [n] = substitutional;
        if (placeholder .check_flag ("subex")) { substitutional .set_flag ("subex"); }

        /* if (placeholder .comparative_computing_order &&  substitutional .comparative_computing_order)
          { s = "Warning: placeholder .comparative_computing_order &&  substitutional .comparative_computing_order";
            fsmlog_type (s); } */

        if (placeholder .comparative_computing_order && !substitutional .comparative_computing_order)
          { substitutional .comparative_computing_order = placeholder .comparative_computing_order;
            /* s = "Warning: placeholder .comparative_computing_order &&  !substitutional .comparative_computing_order";
            fsmlog_type (s); */ }

        if (!placeholder .comparative_computing_order && substitutional .comparative_computing_order)
          { s = "Warning: ! placeholder .comparative_computing_order &&  substitutional .comparative_computing_order";
            fsmlog_type (s); }

        p .operand [n] .reference_no_subex (); /*_no_subex ();*/ // ! Palliative. Fix it

        if (new_utmost_order < p .operand [n] .comparative_computing_order)
          { new_utmost_order = p .operand [n] .comparative_computing_order; }

        return; }

    if (operator .check_flag ("nowalk") || operator === base_voc ["leaf"] || operator === base_voc ["quotation"]) {return;}

    for (var i = compex .operands_offset;  i < compex .operand .length; i++)
        { _substitute_variables (compex .operand [i], compex, i); } }


function substitute_variables (item)
  { var pseudo_compex = { "operand": [] };

    _substitute_variables (item .compex, pseudo_compex, 0);
    if (pseudo_compex .operand [0]) { item .compex = pseudo_compex .operand [0]; }}


var new_utmost_order = 0;

function apply_semantics ()
  { var as0 = current_stack .pop ();
    var quotation = as0 .compex .operand [0];
    var items = quotation .items_digest ();
    var touched = quotation .tail_starts_from; 

    new_utmost_order = 0; // <-- nonlocal

    if (touched > 0)
        { current_stack .extend_stack_if_necessary (touched -1); }

    var head  = current_stack .items_digest () .reverse () .slice (0, touched) .reverse ();
    var tail  = current_stack .items_digest () .reverse () .slice (touched) .reverse ();
    var assignments = quotation .assignments .slice ();

    for (var i in items)
        { substitute_variables (items [i]); }

    for (var i in assignments)
        { substitute_variables (assignments [i]); }

    head .forEach (function (item) { item .dereference (); });

    var  new_container = tail .concat (items);
    current_stack .container = new_container; 
    current_stack .assignments = current_stack .assignments .concat (assignments);
    current_stack .utmost_computing_order = new_utmost_order; }


function list_semantics ()
  { var as0 = current_stack .get (0),
        quotation = as0 .compex .dc (),
        asi = new_stack_item ("List", "Lst", quotation, "list");

    if (quotation .dc_postprocess) { quotation .dc_postprocess (quotation); }

//    quotation .comparative_computing_order = current_stack .get_next_computing_order ();
//    asi .compex .comparative_computing_order = current_stack .get_next_computing_order ();

    quotation .set_flag ("no_equation");

    quotation .operand [1] = {};
    quotation .set_flag ("subex");
    asi .compex .str_uid = new_str_uid ("Lst");

    quotation .reference (); // ! Fix it
    as0 .dereference ();

    quotation .comparative_computing_order = current_stack .get_next_computing_order ();
    asi .compex .comparative_computing_order = current_stack .get_next_computing_order ();

    /* quotation .freeze ();
    as0 .dereference ();
    quotation .reference ();
    quotation .unfreeze (); */

    current_stack .set (0, asi); }


function list_target_translation_semantics (operand, parent)
  { if (fsml_systate .need_full_substitution)
      { return '"[ ' +parent .str_uid +' ]"'; }

    var quotation = operand [0] .operand [0];

    stacks_chain .push (current_stack);
    current_stack = quotation;
//    current_stack .actual_target_names = false;
    current_stack .translate_to_js ();

    var text = "[ " +current_stack .get_return_items () .slice () .reverse () .join (", ") +" ]";
    current_stack = stacks_chain .pop ();

    return text; }


// How you plan to implement deep copy of if_object ? Now this impossible
// Btw, 'dc' operate on object refered by top element stack, but if_object is
// not referd by nothing beside deliverer. 'dc' on deliverer produce copy
// of deliverer (?), not if_object

function if_semantics ()
  { var if_compex = new Compex ([], base_voc ["if"]);

    var quotation_true  = current_stack .get (1) .compex .operand [0];
    var quotation_false = current_stack .get (0) .compex .operand [0];

    // If one or both quotation produce nothing ([ ], [ drop ],
    // [ 1234 somevariablename ! ], etc) then quotations allowed to be NOT commensurable
    if ( quotation_true  .container .length !== quotation_false .container .length
      && quotation_true  .container .length !== 0
      && quotation_false .container .length !== 0)
      { fsmlog_type ("OMG. True and false quotations is not commensurable");
        return; }

    var production_count =  quotation_true .container .length || quotation_false .container .length;

    var touched = Math .max (quotation_true  .tail_starts_from,
                             quotation_false .tail_starts_from);

    for (var i = 0; i < touched +3; i++)
      { independent_semantics ();

        var item = current_stack .pop ();
            item .compex .set_flag ("subex");

            item .compex .comparative_computing_order =
                item .compex .comparative_computing_order || current_stack .get_next_computing_order ();

        if_compex .operand [i] = item .compex; }

    if_compex .set_flag ("subex");
    if_compex .comparative_computing_order = current_stack .get_next_computing_order ();
    if_compex .operand [2] .target_str_uid = new_str_uid ("cond");
    if_compex .operands_offset = 2;
    if_compex .reference_count
        = if_compex .item_names_count
        = production_count;

    var item_names = if_compex .item_names = []; // Firstly added correspond to top of stack etc
    if_compex .another_item_names = [];

    for (var i = 0; i < if_compex .item_names_count; i++)
      { if_compex .item_names .push (new_str_uid ("subex"));
        if_compex .another_item_names .push ([]); }

    function get_target_str_uid ()
      { return this .operand [1] .item_names [this .operand [0]]; }

    function set_target_str_uid (obtrusive_id)
      { this .operand [1] .item_names [this .operand [0]] = obtrusive_id; }

    function add_target_str_uid (obtrusive_id)
      { this .operand [1] .another_item_names [this .operand [0]] .push (obtrusive_id); }

    for (var i = 0; i < if_compex .reference_count; i++)
      { var item = new_stack_item ("if_supplier", "if_supplier", undefined, "if_supplier");

        /* temp */ item .compex .dc = function () { return this; } /* temp */

        item .compex .operands_offset = 1;
        item .compex .operand [0] = production_count -i -1;
        item .compex .operand [1] = if_compex;
        /* item .compex .set_flag ("subex"); */
        item .compex .set_flag ("deliverer");

        item .compex .get_target_str_uid = get_target_str_uid;
        item .compex .set_target_str_uid = set_target_str_uid;
        item .compex .add_target_str_uid = add_target_str_uid;

        current_stack .push (item); } }


function if_target_translation_semantics (operand, if_object)
  { var condition_str_uid = operand [2] .get_target_str_uid ();
    var names_offset = 0;
    operand .slice (0, 3) .forEach (function (item) { if (item .operator === base_voc ["fv"]) { names_offset++ } });

    /* var predefined_argument_names = current_stack .predefined_argument_names .slice (names_offset); */ /* Obsoleted ? */

    var arg_names_for_quotation = operand .slice (3) .map
        (function (item)
          { if (item .operator === base_voc ["fv"]) // ! fix it
              { var t = current_stack .predefined_argument_names [item .operand [0]]; }

            return t || item .get_target_str_uid (); });

    var target_text = "";
    var new_indent = current_stack .indent_size +8;

    var quot,
        _nested_text = "",
        nested_text = "",
        nested_text_else = "",
        _rename_str_uids,
        rename_str_uids,
        rename_str_uids_else;

    function quot_to_js ()
      { if (quot .container .length !== 0)
          { stacks_chain .push (current_stack);
            current_stack = quot;
            current_stack .item_names = if_object .item_names .slice () .reverse ();
            current_stack .another_item_names = if_object .another_item_names .slice () .reverse ();
            current_stack .predefined_argument_names = arg_names_for_quotation;
            current_stack .indent_size = new_indent;
            current_stack .translate_to_js ();
            _nested_text = current_stack .target_text;
            _rename_str_uids = current_stack .str_uids_to_rename;
            current_stack = stacks_chain .pop ();
            current_stack .uids_already_in_equation_left = current_stack .uids_already_in_equation_left .concat (arg_names_for_quotation); }
         else
          { _nested_text = translate_empty_quotation
               (new_indent,
                if_object .item_names .slice () .reverse (),
                if_object .another_item_names .slice () .reverse ()); } }

    quot = operand [1] .operand [0];
    quot_to_js ();
    var aliastatement = current_stack .aliastatement;
    nested_text = _nested_text;
    rename_str_uids = _rename_str_uids;

    quot = operand [0] .operand [0];
    quot_to_js ();
    var aliastatement_else = current_stack .aliastatement;
    nested_text_else = _nested_text;
    rename_str_uids_else = _rename_str_uids;

    var indent_string = "&nbsp;" .repeat (current_stack .indent_size);

    var target_text = "<br>" +indent_string +"if (" +condition_str_uid +") {"
                     +nested_text
                     +"<br>" +indent_string +"}else{"
                     +nested_text_else +" }" || "";

    return target_text; }


function if_supplier_target_translation_semantics (operand)
  { if (fsml_systate .need_full_substitution)
      { return "if_" +operand [0]; }

    return operand [1] .item_names [operand [0]]; }


function while_semantics ()
  { var while_object = new Compex ([], base_voc ["while"]);

    var quotation  = current_stack .get (0) .compex .operand [0];
    var production_count = quotation .container .length;
    var touched = quotation .tail_starts_from;

    if ( production_count !== touched +1)
      { fsmlog_type ("OMG. Quotation size and amount of its argumens is not commensurable");
        return; }

    quotation .isloop = true;

    for (var i = 0; i < touched +1; i++)
      { independent_semantics ();

        var item = current_stack .pop ();
            item .compex .set_flag ("subex");

        item .compex .comparative_computing_order =
            item .compex .comparative_computing_order || current_stack .get_next_computing_order ();

//        current_stack .to_next_computing_order (); // <-- Useless

        while_object .operand [i] = item .compex; }

    while_object .set_flag ("subex");
    while_object .comparative_computing_order = current_stack .get_next_computing_order ();
    while_object .operands_offset = 1;
    while_object .reference_count = production_count -1;
    while_object .item_names_count = production_count;

    var item_names = while_object .item_names = []; // Firstly added correspond to top of stack etc
    while_object .another_item_names = [];

    while_object .item_names [0] = new_str_uid ("cond");
    for (var i = 0; i < while_object .item_names_count; i++)
      { /*while_object .item_names .push (new_str_uid ("subex"));*/
        while_object .another_item_names .push ([]); }

    function get_target_str_uid ()
      { return this .operand [1] .item_names [this .operand [0]]; }

    function set_target_str_uid (obtrusive_id)
      { this .operand [1] .item_names [this .operand [0]] = obtrusive_id; }

    function add_target_str_uid (obtrusive_id)
      { this .operand [1] .another_item_names [this .operand [0]] .push (obtrusive_id); }

    for (var i = 0; i < while_object .reference_count; i++)
      { current_stack .to_next_computing_order ();
        var item = new_stack_item ("while_supplier", "while_supplier", undefined, "while_supplier");

        /* temp */ item .compex .dc = function () { return this; } /* temp */

        item .compex .operands_offset = 1;
        item .compex .operand [0] = production_count -i -1;
        item .compex .operand [1] = while_object;
        /* item .compex .set_flag ("subex"); */
        item .compex .set_flag ("deliverer");

        item .compex .get_target_str_uid = get_target_str_uid;
        item .compex .set_target_str_uid = set_target_str_uid;
        item .compex .add_target_str_uid = add_target_str_uid;

        current_stack .push (item); } }


function while_target_translation_semantics (operand, while_object)
  { var condition_str_uid = while_object .item_names [0];

    var arg_names_for_quotation = operand .slice (1) .map
        (function (item)
          { if (item .operator === base_voc ["fv"]) // ! fix it
              { var t = current_stack .predefined_argument_names [item .operand [0]]; }

            return t || item .get_target_str_uid (); });

    var target_text = "";
    var new_indent = current_stack .indent_size +8;

    var quot,
        _nested_text = "",
        nested_text = "",
        _rename_str_uids,
        rename_str_uids;

    while_object .item_names = [while_object .item_names [0]] .concat (arg_names_for_quotation);

    function quot_to_js ()
      { if (quot .container .length !== 0)
          { stacks_chain .push (current_stack);
            current_stack = quot;
            current_stack .item_names = while_object .item_names .slice () .reverse ();
            current_stack .another_item_names = while_object .another_item_names .slice () .reverse ();
            current_stack .predefined_argument_names = arg_names_for_quotation;
            current_stack .indent_size = new_indent;
            current_stack .translate_to_js ();
            _nested_text = current_stack .target_text;
            _rename_str_uids = current_stack .str_uids_to_rename;
            current_stack = stacks_chain .pop ();
            current_stack .uids_already_in_equation_left = current_stack .uids_already_in_equation_left .concat (arg_names_for_quotation); }
         else
          { _nested_text = translate_empty_quotation
               (new_indent,
                while_object .item_names .slice () .reverse (),
                while_object .another_item_names .slice () .reverse ()); } }

    quot = operand [0] .operand [0];
    quot_to_js ();
    nested_text = _nested_text;
    rename_str_uids = _rename_str_uids;

    var indent_string = "&nbsp;" .repeat (current_stack .indent_size);

    var target_text = "<br>" +indent_string +"do { "
                     +nested_text
                     +"<br>" +indent_string +"} while (" +condition_str_uid +");";

    return target_text; }


function while_supplier_target_translation_semantics (operand)
  { if (fsml_systate .need_full_substitution)
      { return "while_" +operand [0]; }

    return operand [1] .item_names [operand [0]]; }


function trivial_binary_operation (operation_in_base_voc)
  { return function ()
      { var as0 = current_stack .pop (),
            as1 = current_stack .get (0);

        as0 .compex .reference ();

        /* May be better idea is if create_binary_compex will perform reference of self arguments */

        current_stack .to_next_computing_order (); // ! Palliative. Fix it
        as1 .compex = create_binary_compex (as1 .compex, as0 .compex, operation_in_base_voc);

        as0 .dereference (); } }


function plus_target_translation_semantics (operand)
  { return compex_to_infix_str (operand [0]) +" +" +compex_to_infix_str (operand [1]); }


function minus_target_translation_semantics (operand)
  { var r_exp_parenthesis_if_any = {"left" : "", "right" : ""},
        o0 = operand [0],
        o1 = operand [1];

    if (o1 .operator !== base_voc ["leaf"])
        { var r_exp_parenthesis_if_any = {"left" : "(", "right" : ")"}; }

    if (o1 .operator === base_voc ["leaf"] && o1 .operand [0] < 0)
        { var r_exp_parenthesis_if_any = {"left" : "(", "right" : ")"}; }

    return compex_to_infix_str (o0)
        +" -"
        +r_exp_parenthesis_if_any .left
        +compex_to_infix_str (o1)
        +r_exp_parenthesis_if_any .right  ; }


function wrap_by_parenthesis (str, suboperand, operand_name)
  { if (js_operation_priority [suboperand .operator. true_name] < js_operation_priority [operand_name])
        { return "(" +str +")"; }
    else
        { return str; }}


function mult_target_translation_semantics (operand)
  { var o0 = operand [0],
        o1 = operand [1];

    return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, "*")
        +" *" +wrap_by_parenthesis (compex_to_infix_str (o1), o1, "*"); }


function div_target_translation_semantics (operand)
  { var o0 = operand [0],
        o1 = operand [1];

    return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, "/")
        +" /" +wrap_by_parenthesis (compex_to_infix_str (o1), o1, "/"); }


function pow_target_translation_semantics (operand)
  { var o0 = operand [0],
        o1 = operand [1];

    return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, "**")
        +" **" +wrap_by_parenthesis (compex_to_infix_str (o1), o1, "**"); }

function great_target_translation_semantics (operand)
  { var o0 = operand [0],
        o1 = operand [1];

    return "" +wrap_by_parenthesis (compex_to_infix_str (o0), o0, ">")
        +" > " +wrap_by_parenthesis (compex_to_infix_str (o1), o1, ">"); }


function orderd_semantics () // <-- temporarily sulution
  { var as0 = current_stack .get (0);
    as0 .compex .comparative_computing_order = current_stack .get_next_computing_order (); }


function exclamark_semantics ()
  { var as0 = current_stack .get (0);
    var as1 = current_stack .get (1);
    as1 .compex .envariable = as0 .compex .operand [0];
    as0 .dereference ();
    as1 .compex .set_flag ("subex"); // <-- Don't work !
    as1 .compex .comparative_computing_order = current_stack .get_next_computing_order ();
//    current_stack .to_next_computing_order ();
    var asi = new Abstract_stack_item ();
    asi .compex = as1 .compex;
    current_stack .assignments .push (asi);
    current_stack .pop ();
    current_stack .pop (); }


function fetch_semantics ()
  { var as0 = current_stack .get (0);
    var name = as0 .compex .operand [0];

    as0 .dereference ();
    current_stack .pop ();

    var item = new_stack_item ("leaf", "leaf", undefined, "leaf");
    item .compex .operand [0] = name;
    current_stack .push (item); }


function id_semantics (operand)
  { var as0 = current_stack .get (0),
        old_compex = as0 .compex,
        value = old_compex .operand [0], //.toString ();
        new_compex = new Compex ([value], base_voc ["identifier"]);

        as0 .compex = new_compex; }


function identifier_target_translation_semantics (operand)
  { return operand [0]; }


function independent_semantics ()
  { var as0 = current_stack .get (0);
    var new_item = new Abstract_stack_item;
    new_item .compex = as0 .compex;
    new_item .compex .reference ();
    as0 .dereference ();
    current_stack .set (0, new_item); }


function deep_copy_semantics ()
  { independent_semantics ();
    var as0 = current_stack .get (0),
        old_compex = as0 .compex;
    as0 .compex = as0 .compex .dc ();

    old_compex .dereference (); }


function depth_semantics ()
    { compilit ("Number", "Num", current_stack .depth ()); }


function drop_semantics ()
  { var as0 = current_stack .get (0);
    as0 .dereference ();
    current_stack .pop (); }


function dup_semantics ()
  { var as0 = current_stack .get (0);
    as0 .reference ();
    current_stack .push (as0); }


function swap_semantics ()
  { var as0 = current_stack .get (0);
    current_stack .set (0, current_stack .get (1));
    current_stack .set (1, as0); }


function over_semantics ()
  { var as1 = current_stack .get (1);
    as1 .reference ();
    current_stack .push (as1); }


function license_semantics ()
    { fsmlog_type (BSD_license); }


// External environment functions


function time_target_translation_semantics () { return "(+new Date ())"; }

function time_semantics ()
  { var another_newdate_operation = new_stack_item ("Native", "Nat", undefined, "time");
    another_newdate_operation .compex .comparative_computing_order = current_stack .get_next_computing_order ();
    current_stack .push (another_newdate_operation);
    current_stack .set_flag ("no-pure-presented"); }


})();


