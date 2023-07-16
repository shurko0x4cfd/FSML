#! /usr/bin/bash


# node ./node_modules/flow-bin/cli.js config/.flowconfig --show-all-errors > \
npx flow all/config/.flowconfig --json --show-all-errors > \
	all/logs/flow/full.json
	# all/logs/flow/$(date +%F_%H-%M)-full.json
