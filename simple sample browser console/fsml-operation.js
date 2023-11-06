
/*  */

export class FSMLoperation {

	term;
	true_name;
	flags;
	compile;
	translate_to_target;

	constructor
	(
		term			= "",
		true_name		= "",
		flags	= [],
		compile		= undefined,
		target_translation_semantics = undefined
	)
	{
		this .term = term;
		this .true_name = true_name;
		this .flags = flags;
		this .compile = compile;
		this .translate_to_target = target_translation_semantics;
	}


	check_flag = (flag) => this .flags .includes (flag);
}
