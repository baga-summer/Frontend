#!/bin/bash

reset="\e[0m"
bold="\e[1m"
green="\e[92m"
yellow="\e[93m"
red="\e[91m"

echo -e "$bold$yellow==> STARTING ESLINT$reset"
npm run lint
if [ $? -eq 1 ]; then
    echo -e "$bold$red==> ESLINT FAILED$reset"
    echo -e "$boldIf possible, do you want to auto-fix the issues? (y/N)$reset"
    read userInput
    if [ "$userInput" = "y" ]; then
        echo -e "$bold$yellow==> Running eslint --fix$reset"
        npm run lint-fix
        echo -e "$bold$yellow==> re-running test...$reset"
        npm test
    else
        echo -e "$bold$red==> aborting autofix, returning error.$reset"
        exit 1
    fi
else
    echo -e "$bold$green==> LINT COMPLETED WITHOUT ERRORS$reset"
    exit 0
fi
