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
    echo -e "$bold If possible eslint will now try and auto-fix theese issues$reset"
    npm run lint-fix
    if [ $? -eq 1 ]; then
        echo -e "$bold $red==> ESLINT FAILED, try fixing this manually$reset"
        exit 1
    else
        echo -e "$bold$green==> Eslint fixed the issues, you may proceed.$reset"
        exit 0
    fi
else
    echo -e "$bold$green==> ESLINT COMPLETED WITHOUT ERRORS$reset"
    exit 0
fi
