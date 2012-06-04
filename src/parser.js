var State = {
	text: 0,
	insideElement: 1
};

function createParseContext(raw, options) {
	var index = 0, state = State.text, line = 1, column = 1;
	var nextReadIncrementsLine = false;
	var context = {
		text: '',
		peek: function(count) {
			count = count || 1;
			return this.raw.substr(index + 1, count);
		},
		read: function(count) {
			count = count || 1;
			if (nextReadIncrementsLine) {
				line++;
				column = 0;
				nextReadIncrementsLine = false;
			}

			var next = this.peek(count);
			if (next) {
				column++;
			}
			if (next === '\n') {
				nextReadIncrementsLine = true;
			}

			index += count;
			return next;
		},
		readUntilNonWhitespace: function() {
			var value = '', next;
			while (!this.isEof()) {
				next = this.read();
				value += next;
				if (!/\s$/.test(value)) {
					break;
				}
			}

			return value;
		},
		isEof: function() {
			return index >= this.length;
		},
		readRegex: function(regex) {
			var value = regex.exec(this.raw.substring(this.index))[0];
			line += value.replace(/[^\n]/g, '').length;
			column = value.substring(value.lastIndexOf('\n')).length;
			index += value.length;
			return value;
		},
		peekIgnoreWhitespace: function(count) {
			count = count || 1;
			var value = '', next = '', offset = 0;
			do {
				next = this.raw.charAt(this.index + ++offset);
				if (!next) {
					break;
				}
				if (!/\s/.test(next)) {
					value += next;
				}
			} while (value.length < count);

			return value;
		},

		setState: function(newState) {
			state = newState;
		}
	};

	context.__defineGetter__('state', function() {
		return state;
	});
	context.__defineGetter__('current', function() {
		return this.isEof() ? '' :  this.raw.charAt(this.index);
	});
	context.__defineGetter__('raw', function() {
		return raw;
	});
	context.__defineGetter__('length', function() {
		return this.raw.length;
	});
	context.__defineGetter__('index', function() {
		return index;
	});
	context.__defineGetter__('line', function() {
		return line;
	});
	context.__defineGetter__('column', function() {
		return column;
	});

	context.callbacks = {};
	[ 'openElement', 'closeElement', 'attribute', 'comment', 'cdata', 'entity', 'text' ].forEach(function(value) {
		context.callbacks[value] = options[value] || function() {};
	});

	return context;
}

var regexes = {
	elementName: /[a-zA-Z_][\w-]*/
};

regexes.attributeName = regexes.elementName;

function parseOpenElement(context) {
	function readAttribute() {

	}

	var line = context.line, column = context.column;
	var name = context.readRegex(regexes.elementName);
	context.callbacks.openElement(name, {
		line: line,
		column: column
	});

	//read attributes
	var next = context.current;
	while (next !== '>') {
		if (regexes.attributeName.test(next)) {
			readAttribute();
		}
		else {
			next = context.read();
		}
	}
}

function parseEndElement(context) {
	var line = context.line, column = context.column;
	var name = context.readRegex(regexes.elementName);
	context.callbacks.closeElement(name, {
		line: line,
		column: column
	});

	context.readRegex(/.*?(?:>|$)/);
}

function parseNext(context) {
	var current = context.current, buffer = current;
	switch (current) {
		case '<':
			buffer += context.readUntilNonWhitespace();
			if (context.current === '/') {
				buffer += context.readUntilNonWhitespace();
				if (regexes.elementName.test(context.current)) {
					parseEndElement(context);
				}
				else {
					//malformed html, let it slide through
					context.text += buffer;
				}
			}
			else if (regexes.elementName.test(context.current)) {
				parseOpenElement(context);
			}
			else {
				//malformed html, let it slide through
				context.text += buffer;
			}

			break;
		default:
			context.text += current;
			context.read();
			break;
	}
}

exports.parse = function(string, options) {
	var context = createParseContext(string, options);
	do {
		parseNext(context);
	} while (!context.isEof());
};