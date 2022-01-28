
import './App.css';
import * as React from 'react';

import { fsml } from './fsml.js';


class FSMLConsole extends React .Component {

    constructor (props)
      { super (props);
        this .state = {};
        this .state .share = {};
        this .state .share .text = ''; }

    render ()
      { return (
          <div id='leftpane'>
              <Fsmlogo />
              <Fsmlog share = { this .state .share } />
              <Inbox  share = { this .state .share } />
          </div> );}

} // AFSMLConsole


class Fsmlogo extends React .Component {
  constructor (props)
    { super (props);
      this .state = {};
      this .state .text =
         "\n\
          ==========================================================\n\
                                     FSML                           \n\
          ==========================================================\n\
          \n\
          FSML 0.3.0, (c) 2021, 2022 Alexander (Shurko) Stadnichenko\n\
          Type 'help' to FSML help you,\n\
          'license' to view BSD license, 'bb' to farewell\n"; }

    render ()
      { return (
            <div id = 'fsmlogo' className = "pre-line" children = { this.state.text }/> );}

} // Fsmlogo


class Fsmlog extends React .Component {

    constructor (props)
      { super (props);
        this .state = {};
        this .state .text = '';
        this .text = '';
        props .share .upd = this .upd .bind (this); }

    upd (a)
      { this .text += a;
        this .setState ({text: this .text});}

    render ()
      { return (
          <div id = 'fsmlog' className = "pre-line" children = { this .state .text } />); }

} // Fsmlog


class Inbox extends React .Component {

    constructor (props)
      { super (props);
        this .share = props .share;
        this .state = {};
        this .state .text = '';
        this .fsml_eval = fsml .environment .fsml_eval;
        this .get_stack = fsml .environment .fsml_type_stack;
        this .enter_handler = this .enter_handler .bind (this);
        this .change_handler = this .change_handler .bind (this);
        setTimeout (() => { document .getElementById ('inbox') .focus (); }, 1000); }

    enter_handler (e)
      { e .preventDefault ();

        let upd = this .share .upd;

        let logtext = this .state .text + '\n';
        this .setState ({text: ''});

        this .eval_result = this .fsml_eval (this .state .text);
        
        if (this .eval_result)
          { logtext += '\n' + this .eval_result + '\n'; }

        this .r = this .get_stack ();

        if (this .r)
          { logtext += this .r + '\n' + '\n'; }

        upd (logtext);
        setTimeout (() => { document .getElementById ('leftpane') .scrollBy (0, 1000); }, 200); }

    change_handler (e)
      { this .setState ({ text: e .target .value }); }

    render ()
      { return (
          <div><div id='prompt'>{'fsml >'}</div>
          
          <form id = 'inputform' onSubmit = { this .enter_handler } >
              <input onChange = { this .change_handler }
                  name="inbox"
                  id="inbox"
                  autoFocus
                  value = { this .state .text } />
          </form> </div>);}

} // Inbox




export { FSMLConsole };

