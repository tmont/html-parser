var parseContext = require('./context');
var nameRegex = /[a-zA-Z_][\w:-]*/;

function readAttribute(context) {
	var name = context.readRegex(nameRegex);
	var value = null;
	if (context.current === '=' || context.peekIgnoreWhitespace() === '=') {
		context.readRegex(/\s*=\s*/);
		var quote = /['"]/.test(context.current) ? context.current : '';
		var attributeValueRegex = !quote
			? /(.*?)(?=[\s>])/
			: new RegExp(quote + '(.*?)' + quote);

		var match = attributeValueRegex.exec(context.substring) || [0, ''];
		value = match[1];
		context.read(match[0].length);
	}

	context.callbacks.attribute(name, value);
}

function readAttributes(context, isXml) {
	function isClosingToken() {
		if (isXml) {
			return context.current === '?' && context.peek() === '>';
		}

		return context.current === '>' || (context.current === '/' && context.peekIgnoreWhitespace() === '>');
	}
	var next = context.current;
	while (!context.isEof() && !isClosingToken()) {
		if (nameRegex.test(next)) {
			readAttribute(context);
			next = context.current;
		}
		else {
			next = context.read();
		}
	}
}

function readCloserForOpenedElement(context, name) {
	if (context.current === '/') {
		//self closing tag "/>"
		context.readUntilNonWhitespace();
		context.read();
		context.callbacks.closeOpenedElement(name, '/>');
	}
	else if (context.current === '?') {
		//xml closing "?>"
		context.read(2);
		context.callbacks.closeOpenedElement(name, '?>');
	}
	else {
		//normal closing ">"
		context.read();
		context.callbacks.closeOpenedElement(name, '>');
	}
}

function parseOpenElement(context) {
	var name = context.readRegex(nameRegex);
	context.callbacks.openElement(name);
	readAttributes(context, false);
	readCloserForOpenedElement(context, name);

	if (name !== 'script' && name !== 'xmp') {
		return;
	}

	//just read until the closing tags for elements that allow cdata
	var regex = new RegExp('^([\\s\\S]*?)(?:$|</' + name + '>)', 'i');
	var match = regex.exec(context.substring);
	context.read(match[0].length);
	context.callbacks.cdata(match[1]);
	context.callbacks.closeElement(name);
}

function parseEndElement(context) {
	var name = context.readRegex(nameRegex);
	context.callbacks.closeElement(name);
	context.readRegex(/.*?(?:>|$)/);
}

function parseCData(context) {
	//read "![CDATA["
	context.read(8);

	var match = /^([\s\S]*?)(?:$|]]>)/.exec(context.substring);
	var value = match[1];
	context.read(match[0].length);
	context.callbacks.cdata(value);
}

function parseComment(context) {
	//read "!--"
	context.read(3);

	var match = /^([\s\S]*?)(?:$|-->)/.exec(context.substring);
	var value = match[1];
	context.read(match[0].length);
	context.callbacks.comment(value);
}

function parseDocType(context) {
	//read "!doctype"
	context.read(8);

	var match = /^\s*([\s\S]*?)(?:$|>)/.exec(context.substring);
	var value = match[1];
	context.read(match[0].length);
	context.callbacks.docType(value);
}

function parseXmlProlog(context) {
	//read "?xml"
	context.read(4);
	context.callbacks.xmlProlog();
	readAttributes(context, true);
	readCloserForOpenedElement(context, '?xml');
}

function appendText(value, context) {
	context.text += value;
}

function callbackText(context) {
	if (context.text) {
		context.callbacks.text(context.text);
		context.text = '';
	}
}

function parseNext(context) {
	var current = context.current, buffer = current;
	if (current == '<') {
		buffer += context.readUntilNonWhitespace();
		if (context.current === '/') {
			buffer += context.readUntilNonWhitespace();
			if (nameRegex.test(context.current)) {
				callbackText(context);
				parseEndElement(context);
			} else {
				//malformed html
				context.read();
				appendText(buffer, context);
			}
		} else if (context.current === '!') {
			if (/^!\[CDATA\[/.test(context.substring)) {
				callbackText(context);
				parseCData(context);
			} else if (/^!--/.test(context.substring)) {
				callbackText(context);
				parseComment(context);
			} else if (/^!doctype/i.test(context.substring)) {
				callbackText(context);
				parseDocType(context);
			} else {
				//malformed html
				context.read();
				appendText(buffer, context);
			}
		} else if (context.current === '?') {
			if (/^\?xml/.test(context.substring)) {
				callbackText(context);
				parseXmlProlog(context);
			} else {
				//malformed xml prolog
				context.read();
				appendText(buffer, context);
			}
		} else if (nameRegex.test(context.current)) {
			callbackText(context);
			parseOpenElement(context);
		} else {
			//malformed html
			context.read();
			appendText(buffer, context);
		}
	} else {
		appendText(context.current, context);
		context.read();
	}
}

exports.parse = function(string, options) {
	string = string.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	var context = parseContext.create(string, options);
	do {
		parseNext(context);
	} while (!context.isEof());

	callbackText(context);
};

exports.parseFile = function(fileName, encoding, options, callback) {
	var fs = require('fs');
	fs.readFile(fileName, encoding || 'utf8', function(err, contents) {
		if (err) {
			callback && callback(err);
			return;
		}

		exports.parse(contents, options);
		callback && callback();
	});
};

exports.sanitize = function(string, options) {
	options = options || {};
	var toRemove = {
		attributes: options.attributes || [],
		elements: options.elements || [],
		comments: !!options.comments,
		docTypes: !!options.docTypes
	};

	var sanitized = '', tagStack = [];
	var ignoring = false;
	var callbacks = {
		docType: function(value) {
			if (toRemove.docTypes) {
				return;
			}
			sanitized += '<!doctype ' + value + '>';
		},

		openElement: function(name) {
			name = name.toLowerCase();
			tagStack.push({ name: name });
			if (toRemove.elements.indexOf(name) !== -1) {
				if (!ignoring) {
					ignoring = tagStack[tagStack.length - 1];
				}
				return;
			}
			sanitized += '<' + name;
		},

		closeOpenedElement: function(name, token) {
			name = name.toLowerCase();
			if (token.length === 2) {
				//self closing
				tagStack.pop();
			}
			if (ignoring || toRemove.elements.indexOf(name) !== -1) {
				return;
			}
			sanitized += token;
		},

		closeElement: function(name) {
			name = name.toLowerCase();
			if (tagStack.length && tagStack[tagStack.length - 1].name === name) {
				var scope = tagStack.pop();
				if (scope === ignoring) {
					ignoring = null;
				}
			}
			if (ignoring || toRemove.elements.indexOf(name) !== -1) {
				return;
			}
			sanitized += '</' + name + '>';
		},

		attribute: function(name, value) {
			if (ignoring) {
				return;
			}

			name = name.toLowerCase();
			if (toRemove.attributes.indexOf(name) !== -1) {
				return;
			}

			sanitized += ' ' + name + '="' + value.replace(/"/g, '&quot;') + '"';
		},

		text: function(value) {
			if (ignoring) {
				return;
			}
			sanitized += value;
		},

		comment: function(value) {
			if (ignoring || toRemove.comments) {
				return;
			}
			sanitized += '<!--' + value + '-->';
		},

		cdata: function(value) {
			if (ignoring) {
				return;
			}

			for (var i = tagStack.length - 1; i >= 0; i--) {
				if (tagStack[i].name === 'script' || tagStack[i].name === 'xmp') {
					sanitized += value;
					return;
				}
			}

			sanitized += '<![CDATA[' + value + ']]>';
		}
	};

	exports.parse(string, callbacks);
	return sanitized;
};