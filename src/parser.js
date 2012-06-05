function createParseContext(raw, options) {
	var index = 0, line = 1, column = 1;
	var nextReadIncrementsLine = false;
	var context = {
		text: {
			value: '',
			line: 0,
			column: 0
		},
		peek: function(count) {
			count = count || 1;
			return this.raw.substr(index + 1, count);
		},
		read: function(count) {
			if (count === 0) {
				return '';
			}
			count = count || 1;
			if (nextReadIncrementsLine) {
				line++;
				column = 0;
				nextReadIncrementsLine = false;
			}

			var next = this.peek(count);
			if (next) {
				column++;

				if (next === '\n') {
					nextReadIncrementsLine = true;
				}
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
			var value = (regex.exec(this.raw.substring(this.index)) || [''])[0];
			var lineBreaks = value.replace(/[^\n]/g, '').length;
			line += lineBreaks;
			if (lineBreaks) {
				column = value.substring(Math.max(value.lastIndexOf('\n'), 0)).length;
			} else {
				column += value.length;
			}

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
		}
	};

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
	context.__defineGetter__('substring', function() {
		return this.raw.substring(this.index);
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

function createCallbackContext(context) {
	return {
		line: context.line,
		column: context.column
	};
}

function parseOpenElement(context) {
	function readAttribute() {
		var cbContext = createCallbackContext(context);
		var name = context.readRegex(regexes.attributeName);
		var value = null;
		if (context.current === '=' || context.peekIgnoreWhitespace() === '=') {
			context.readRegex(/\s*=\s*/);
			var quote = /['"]/.test(context.current) ? context.current : '';
			var attributeRegex = !quote
				? /(.*?)[\s>]/
				: new RegExp(quote + '(.*?)' + quote) ;

			var match = attributeRegex.exec(context.substring) || [0, ''];
			value = match[1];
			context.read(match[0].length);
		}

		context.callbacks.attribute(name, value, cbContext);
	}

	var line = context.line, column = context.column;
	var name = context.readRegex(regexes.elementName);
	context.callbacks.openElement(name, {
		line: line,
		column: column
	});

	//read attributes
	var next = context.current;
	while (!context.isEof() && next !== '>') {
		if (regexes.attributeName.test(next)) {
			readAttribute();
			next = context.current;
		}
		else {
			next = context.read();
		}
	}

	//the last ">"
	context.read();
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

function appendText(value, context) {
	if (!context.text.value) {
		context.text.line = context.line;
		context.text.column = context.column;
	}
	context.text.value += value;
}

function callbackText(context) {
	if (context.text.value) {
		context.callbacks.text(context.text.value, createCallbackContext(context.text));
		context.text.value = '';
		context.text.line = 0;
		context.text.column = 0;
	}
}

function parseNext(context) {
	var current = context.current, buffer = current;
	switch (current) {
		case '<':
			buffer += context.readUntilNonWhitespace();
			if (context.current === '/') {
				buffer += context.readUntilNonWhitespace();
				if (regexes.elementName.test(context.current)) {
					callbackText(context);
					parseEndElement(context);
				}
				else {
					//malformed html, let it slide through
					appendText(buffer);
				}
			}
			else if (regexes.elementName.test(context.current)) {
				callbackText(context);
				parseOpenElement(context);
			}
			else {
				//malformed html, let it slide through
				appendText(buffer);
			}

			break;
		default:
			appendText(context.current, context);
			context.read();
			break;
	}
}

exports.parse = function(string, options) {
	var context = createParseContext(string, options);
	do {
		parseNext(context);
	} while (!context.isEof());

	callbackText(context);
};