
/* @flow */

export class FSMLoperation {

	term: string;
	true_name: string;
	flags: Array<string>;
	compile: ?Function;
	translate_to_target: ?Function;

	constructor
	(
		term: string			= "",
		true_name: string		= "",
		flags: Array<string>	= [],
		compile: ?Function		= undefined,
		target_translation_semantics: ?Function = undefined
	)
	{
		this .term = term;
		this .true_name = true_name;
		this .flags = flags;
		this .compile = compile;
		this .translate_to_target = target_translation_semantics;
	}


	check_flag = (flag: string): boolean => this .flags .includes (flag);
}
