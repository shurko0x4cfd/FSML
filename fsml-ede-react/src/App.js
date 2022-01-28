
import './App.css';
import * as React from 'react';

import { fsml } from './fsml.js';




class FSMLConsole extends React .Component {

    constructor (props)
      { super (props);
        this .state = {};
        this .state .text = '';
        this .send_news = this .send_news .bind (this); }

    send_news (news)
      { const text = this .state .text + news;
        this .setState ({text: text}); }

    render ()
      { return (
          <div id='leftpane'>
              <Fsmlogo />
              <Fsmlog text = { this .state .text } />
              <Inbox  send_news = { this .send_news } />
          </div> );}

} // FSMLConsole


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
            <div id = 'fsmlogo' className = "pre-line" children = { this .state .text }/> );}

} // Fsmlogo


class Fsmlog extends React .Component {

    constructor (props)
      { super (props); }

    render ()
      { return (
          <div id = 'fsmlog' className = "pre-line" children = { this .props .text } />); }

} // Fsmlog


class Inbox extends React .Component {

    constructor (props)
      { super (props);
        this .state = {};
        this .state .text = '';
        this .fsml_eval = fsml .environment .fsml_eval;
        this .get_stack = fsml .environment .fsml_type_stack;
        this .enter_handler = this .enter_handler .bind (this);
        this .change_handler = this .change_handler .bind (this);

        // fsml .environment .fsmlog_type = this .props .send_news;

        // If autofocus fail
        setTimeout (() => { document .getElementById ('inbox') .focus (); }, 1000); }

    enter_handler (e)
      { e .preventDefault ();
        
        let send_news = this .props .send_news;

        let logtext = this .state .text + '\n';
        
        let eval_result = this .fsml_eval (this .state .text);

        if (eval_result)
          { logtext += '\n' + eval_result + '\n'; }
        
        let stack = this .get_stack ();

        if (stack)
          { logtext += stack + '\n' + '\n'; }

        this .setState ({text: ''});

        send_news (logtext);

        // console .log (logtext);

        // Show prompt
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
