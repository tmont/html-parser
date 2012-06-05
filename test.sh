MOCHA=./node_modules/.bin/mocha
if [ -z "$MOCHA" ]; then
	echo "Run 'npm dev-dependencies' to install testing dependencies"
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
