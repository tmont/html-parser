MOCHA=./node_modules/.bin/mocha
if [ ! -x "$MOCHA" ]; then
	echo "Run 'npm link' to install testing dependencies"
	exit 1
fi

REGEX=$1
CMD="$MOCHA -R"
if [ ! -z "$REGEX" ]; then
	CMD="$CMD spec -g \"$REGEX\""
else
	CMD="$CMD dot"
fi

CMD="$CMD ./tests"
$CMD
