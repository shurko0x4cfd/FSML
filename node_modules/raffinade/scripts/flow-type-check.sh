#! /usr/bin/bash


node_modules/coffeescript/bin/coffee --bare --no-header -co tmp/flow-type-check/ CS/ \
	&& node ./node_modules/flow-bin/cli.js config/.flowconfig --show-all-errors > \
		logs/flow/flow-full-out-$(date +%F_%H-%M).log
