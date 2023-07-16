#! /usr/bin/bash


# node ./node_modules/flow-bin/cli.js config/.flowconfig --show-all-errors > \
npx flow src/config/.flowconfig --show-all-errors > \
	src/logs/flow/flow-full-out.log
	# src/logs/flow/flow-full-out-$(date +%F_%H-%M).log
