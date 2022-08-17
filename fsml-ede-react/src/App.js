/* eslint-disable */

import './App.css';
import * as React from 'react';

import { get_fsml_instance } from './fsml.js';




const fsml = get_fsml_instance ();


class FSMLConsole extends React .Component {

	constructor (props) {
		super (props);

		this .state = {};
		this .state .text = '';
		this .send_news = this .send_news .bind (this); }

	send_news (news) {
		const text = this .state .text + news;
		this .setState ({ text: text }); }

	render () {
		return (
			<div id='leftpane'>
				<Fsmlogo />
				<Fsmlog text = { this .state .text } />
				<Inbox  send_news = { this .send_news } />
			</div>); }
}


class Fsmlogo extends React .Component {

  constructor (props) {
		super (props);

		this .state = {};

		this .state .text =
			"\n\
			==========================================================\n\
			                            FSML                          \n\
			==========================================================\n\
			\n\
			FSML 0.3.3, (c) 2021, 2022 Alexander (Shurko) Stadnichenko\n\
			Type 'help' to FSML help you,\n\
			'license' to view BSD license, 'bb' to farewell\n"; }

	render = () =>
		(<div id = 'fsmlogo' className = "ws-pre" children = { this .state .text }/>);
}


class Fsmlog extends React .Component {

	constructor (props)
		{ super (props); }

	render = () =>
		(<div id = 'fsmlog' className = "ws-pre" children = { this .props .text } />);
}


class Inbox extends React .Component {

	constructor (props)
	{
		super (props);

		this .state = {};
		this .state .text = '';
		this .enter_handler = this .enter_handler .bind (this);
		this .change_handler = this .change_handler .bind (this);

		// If autofocus fail
		setTimeout (() => document .getElementById ('inbox') .focus (), 2000);
	}

	enter_handler (e) {
		e .preventDefault ();

		const scroll_amount = 1000;
		const delay_before_scroll = 200;
		
		let send_news = this .props .send_news;
		let logtext = this .state .text + '\n';
		
		let eval_result = fsml .eval (this .state .text);

		if (eval_result)
			logtext += '\n' + eval_result + '\n';
		
		let stack = fsml .stack .type ();

		if (stack)
			logtext += stack + '\n' + '\n';

		this .setState ({ text: '' });

		send_news (logtext);

		/* Scroll for show prompt */
		setTimeout
			(() => document
				.getElementById ('leftpane')
				.scrollBy (0, scroll_amount),
			delay_before_scroll); }

	change_handler (e)
		{ this .setState ({ text: e .target .value }) }

	render = () =>
		(<div>
			<div id='prompt'>{'fsml >'}</div>
		  
			<form id = 'inputform'
				onSubmit = { this .enter_handler } >

				<input onChange = { this .change_handler }
					name = "inbox"
					id = "inbox"
					autoFocus
					value = { this .state .text } />
			</form>
		</div>);
}




export { FSMLConsole };
