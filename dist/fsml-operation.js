
/*  */

export class FSMLoperation {

	true_name;
	flags;
	compilation_semantics;
	translate_to_target;

	constructor
	(
		true_name,
		flags,
		compilation_semantics,
		target_translation_semantics
	)
	{
		this .true_name = true_name;
		this .flags = flags;
		this .compilation_semantics = compilation_semantics;
		this .translate_to_target = target_translation_semantics;
	}


	check_flag = (flag) => this .flags .includes (flag);
}
