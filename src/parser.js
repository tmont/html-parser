var parseContext = require('./context');
var nameRegex = /[a-zA-Z_][\w:-]*/;

function readAttribute(context) {
	var name = context.readRegex(nameRegex);
	var value = null;
	if (context.current === '=' || context.peekIgnoreWhitespace() === '=') {
		context.readRegex(/\s*=\s*/);
		var quote = /['"]/.test(context.current) ? context.current : '';
		var attributeValueRegex = !quote
			? /(.*?)[\s>]/
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

	if (context.current === '/') {
		//self closing tag "/>"
		context.readUntilNonWhitespace();
		context.read();
		context.callbacks.closeOpenedElement('/>');
	} else if (isXml) {
		//xml closing "?>"
		context.read(2);
		context.callbacks.closeOpenedElement('?>');
	} else {
		//normal closing ">"
		context.read();
		context.callbacks.closeOpenedElement('>');
	}
}

function parseOpenElement(context) {
	var name = context.readRegex(nameRegex);
	context.callbacks.openElement(name);
	readAttributes(context, false);

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
	//read "?xml "
	context.read(5);
	context.callbacks.xmlProlog();
	readAttributes(context, true);
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