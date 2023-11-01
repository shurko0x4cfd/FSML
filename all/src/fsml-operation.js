
/* @flow */

export class FSMLoperation {

	true_name: string;
	flags: Array<string>;
	compilation_semantics: Function;
	translate_to_target: Function;

	constructor
	(
		true_name: string,
		flags: Array<string>,
		compilation_semantics: ?Function,
		target_translation_semantics: ?Function
	)
	{
		this .true_name = true_name;
		this .flags = flags;
		this .compilation_semantics = compilation_semantics;
		this .translate_to_target = target_translation_semantics;
	}


	check_flag = (flag: string): boolean => this .flags .includes (flag);
}
