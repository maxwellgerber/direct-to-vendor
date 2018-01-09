#!/usr/bin/env bash

set -o errexit
set -o errtrace
set -o nounset
set -o pipefail
set -o xtrace

python generate_historic_rates.py > docs/index.html
cp index.css docs
cp index.js docs