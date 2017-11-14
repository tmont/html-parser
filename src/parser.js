var parseContext = require('./context');
var fs = require('fs');

function readAttribute(context) {
	var name = context.readRegex(context.regex.attribute);
	var value = null, quote = '';
	if (context.current === '=' || context.peekIgnoreWhitespace() === '=') {
		context.readRegex(/\s*=\s*/);
		var attributeValueRegex;
		switch (context.current) {
		case "'":
			attributeValueRegex = /('(\\'|<%.*?%>|[^'])*?')/;
			quote = "'";
			break;
		case '"':
			attributeValueRegex = /("(\\"|<%.*?%>|[^"])*?")/;
			quote = '"';
			break;
		case '<':
			attributeValueRegex = (context.peek() === '%') ? 
				/(<%.*?%>)/ :
				/(.*?)(?=[\s><])/;
			break;
		default:
			attributeValueRegex = /(.*?)(?=[\s><])/;
			break;
		} 

		var match = attributeValueRegex.exec(context.substring) || [0, ''];
		value = match[1];
		context.read(match[0].length);

		if (value[0] === '"' || value[0] === "'") {
			value = value.substring(1);
		}

		if (value[value.length-1] === '"' || value[value.length-1] === "'") {
			value = value.substring(0, value.length-1);
		}
	}

	context.callbacks.attribute(name, value, quote);
}

function readAttributes(context, isXml) {
	function isClosingToken() {
		if (isXml) {
			return context.current === '?' && context.peek() === '>';
		}

		return context.current === '>' || (context.current === '/' && context.peekIgnoreWhitespace() === '>');
	}

	var next = context.current, handled;
	while (!context.isEof() && !isClosingToken()) {
		handled = false;
		if (context.current === '<') {
			for (var callbackName in context.regex.dataElements) {
				if (!context.regex.dataElements.hasOwnProperty(callbackName)) {
					continue;
				}

				var dataElement = context.regex.dataElements[callbackName],
					start = dataElement.start,
					isValid = false;

				switch (typeof start) {
					case 'string':
						isValid = context.substring.slice(0, start.length) === start;
						break;
					case 'object':
						isValid = start.test(context.substring);
						break;
					case 'function':
						isValid = start(context.substring) > -1;
						break;
				}

				if (isValid) {
					callbackText(context);
					context.callbacks[callbackName](parseDataElement(context, dataElement));
					next = context.current;
					handled = true;
					break;
				} 
				next = context.current;
			}
		}
		
		if (!handled) {
			if (context.regex.attribute.test(next)) {
				readAttribute(context);
				next = context.current;
			}
			else {
				next = context.read();
			}
		}
	}
}

function readCloserForOpenedElement(context, name) {
	var emptyElements = {
		'area': true, 'base': true, 'basefont': true, 'br': true, 'col': true, 'frame': true,
		'hr': true, 'img': true, 'input': true, 'isindex': true, 'link': true, 'meta': true,
		'param': true, 'embed': true
	};

	var isUnary = name in emptyElements;

	if (context.current === '/') {
		//self closing tag "/>"
		context.readUntilNonWhitespace();
		context.read();
		context.callbacks.closeOpenedElement(name, '/>', isUnary);
	}
	else if (context.current === '?') {
		//xml closing "?>"
		context.read(2);
		context.callbacks.closeOpenedElement(name, '?>', isUnary);
	}
	else {
		//normal closing ">"
		context.read();
		context.callbacks.closeOpenedElement(name, '>', isUnary);
	}
}

function parseOpenElement(context) {
	var name = context.readRegex(context.regex.name);
	context.callbacks.openElement(name);
	readAttributes(context, false);
	readCloserForOpenedElement(context, name);

	if (!/^(script|xmp|style)$/i.test(name)) {
		return;
	}

	//just read until the closing tags for elements that allow cdata
	var regex = new RegExp('^([\\s\\S]*?)(?:$|</(' + name + ')\\s*>)', 'i');
	var match = regex.exec(context.substring);
	context.read(match[0].length);
	if (match[1]) {
		context.callbacks.cdata(match[1]);
	}
	if (match[2]) {
		context.callbacks.closeElement(match[2]);
	}
}

function parseEndElement(context) {
	var name = context.readRegex(context.regex.name);
	context.callbacks.closeElement(name);
	context.readRegex(/.*?(?:>|$)/);
}

function parseDataElement(context, dataElement) {
	var start = dataElement.start,
		data = dataElement.data,
		end = dataElement.end;

	switch (typeof start) {
		case 'string':
			start = start.length;
			break;
		case 'object':
			start = start.exec(context.substring);
			start = start[start.length - 1].length;
			break;
		case 'function':
			start = start(context.substring);
			break;
	}

	context.read(start);

	switch (typeof data) {
		case 'object':
			data = data.exec(context.substring);
			data = data[data.length - 1];
			break;
		case 'function':
			data = data(context.substring);
			break;
		case 'undefined':
			var index = -1;

			switch (typeof end) {
				case 'string':
					index = context.substring.indexOf(end);
					break;
				case 'object':
					var match = context.substring.match(end);
					if (match) {
						match = match[match.length - 1];
						index = context.substring.indexOf(match);
					}
					break;
			}

			data = index > -1 ? context.substring.slice(0, index) : context.substring;
			break;
	}

	context.read(data.length);

	switch (typeof end) {
		case 'string':
			end = end.length;
			break;
		case 'object':
			end = end.exec(context.substring);
			end = end[end.length - 1].length;
			break;
		case 'function':
			end = end(context.substring);
			break;
	}

	context.read(end);

	return data;
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
	if (context.current === '<') {
		var next = context.substring.charAt(1);
		if (next === '/' && context.regex.name.test(context.substring.charAt(2))) {
			context.read(2);
			callbackText(context);
			parseEndElement(context);
			return;
		} else if (next === '?' && /^<\?xml/.test(context.substring)) {
			context.read(1);
			callbackText(context);
			parseXmlProlog(context);
			return;
		} else if (context.regex.name.test(next)) {
			context.read(1);
			callbackText(context);
			parseOpenElement(context);
			return;
		}
	}

	for (var callbackName in context.regex.dataElements) {
		if (!context.regex.dataElements.hasOwnProperty(callbackName)) {
			continue;
		}

		var dataElement = context.regex.dataElements[callbackName],
			start = dataElement.start,
			isValid = false;

		switch (typeof start) {
			case 'string':
				isValid = context.substring.slice(0, start.length) === start;
				break;
			case 'object':
				isValid = start.test(context.substring);
				break;
			case 'function':
				isValid = start(context.substring) > -1;
				break;
		}

		if (isValid) {
			callbackText(context);
			context.callbacks[callbackName](parseDataElement(context, dataElement));
			return;
		}
	}

	appendText(context.current, context);
	context.read();
}

/**
 * Parses the given string o' HTML, executing each callback when it
 * encounters a token.
 *
 * @param {String} htmlString A string o' HTML
 * @param {Object} [callbacks] Callbacks for each token
 * @param {Function} [callbacks.attribute] Takes the name of the attribute and its value
 * @param {Function} [callbacks.openElement] Takes the tag name of the element
 * @param {Function} [callbacks.closeOpenedElement] Takes the tag name of the element, the token used to
 * close it (">", "/>", "?>") and a boolean telling if it is unary or not (i.e., if it doesn't requires
 * another tag closing it later)
 * @param {Function} [callbacks.closeElement] Takes the name of the element
 * @param {Function} [callbacks.comment] Takes the content of the comment
 * @param {Function} [callbacks.docType] Takes the content of the document type declaration
 * @param {Function} [callbacks.cdata] Takes the content of the CDATA
 * @param {Function} [callbacks.xmlProlog] Takes no arguments
 * @param {Function} [callbacks.text] Takes the value of the text node
 * @param {Object} [regex]
 * @param {RegExp} [regex.name] Regex for element name. Default is [a-zA-Z_][\w:\-\.]*
 * @param {RegExp} [regex.attribute] Regex for attribute name. Default is [a-zA-Z_][\w:\-\.]*
 * @param {Object.<string,DataElementConfig>} [regex.dataElements] Config of data elements like docType, comment and your own custom data elements
 */
exports.parse = function(htmlString, callbacks, regex) {
	htmlString = htmlString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	var context = parseContext.create(htmlString, callbacks, regex);
	do {
		parseNext(context);
	} while (!context.isEof());

	callbackText(context);
};

/**
 * @typedef {Object} DataElementConfig
 * @property {String|RegExp|Function} start - start of data element, for example '<%' or /^<\?=/ or function(string){return string.slice(0, 2) === '<%' ? 2 : -1;}
 * @property {RegExp|Function} data - content of data element, for example /^[^\s]+/ or function(string){return string.match(/^[^\s]+/)[0];}
 * @property {String|RegExp|Function} end - end of data element, for example '%>' or /^\?>/ or function(string){return 2;}
 */

/**
 * Parses the HTML contained in the given file asynchronously.
 *
 * Note that this is merely a convenience function, it will still read the entire
 * contents of the file into memory.
 *
 * @param {String} fileName Name of the file to parse
 * @param {String} [encoding] Optional encoding to read the file in, defaults to utf8
 * @param {Object} [callbacks] Callbacks to pass to parse()
 * @param {Function} [callback]
 */
exports.parseFile = function(fileName, encoding, callbacks, callback) {
	fs.readFile(fileName, encoding || 'utf8', function(err, contents) {
		if (err) {
			callback && callback(err);
			return;
		}

		exports.parse(contents, callbacks);
		callback && callback();
	});
};

/**
 * Sanitizes an HTML string.
 *
 * If removalCallbacks is not given, it will simply reformat the HTML
 * (i.e. converting all tags to lowercase, etc.). Note that this function
 * assumes that the HTML is decently formatted and kind of valid. It
 * may exhibit undefined or unexpected behavior if your HTML is trash.
 *
 * @param {String} htmlString A string o' HTML
 * @param {Object} [removalCallbacks] Callbacks for each token type
 * @param {Function|Array} [removalCallbacks.attributes] Callback or array of specific attributes to strip
 * @param {Function|Array} [removalCallbacks.elements] Callback or array of specific elements to strip
 * @param {Function|Boolean} [removalCallbacks.comments] Callback or boolean indicating to strip comments
 * @param {Function|Boolean} [removalCallbacks.docTypes] Callback or boolean indicating to strip doc type declarations
 * @return {String} The sanitized HTML
 */
exports.sanitize = function(htmlString, removalCallbacks) {
	removalCallbacks = removalCallbacks || {};

	function createArrayCallback(index) {
		var callbackOrArray = removalCallbacks[index] || [];
		if (typeof(callbackOrArray) === 'function') {
			return function() {
				return callbackOrArray.apply(null, arguments);
			}
		} else {
			return function(value) {
				return callbackOrArray.indexOf(value) !== -1;
			}
		}
	}

	function createBoolCallback(index) {
		var callbackOrBool = removalCallbacks[index] || false;
		if (typeof(callbackOrBool) === 'function') {
			return function() {
				return callbackOrBool.apply(null, arguments);
			}
		} else {
			return function() {
				return callbackOrBool;
			}
		}
	}

	function last(arr) {
		return arr[arr.length - 1];
	}

	var toRemove = {
		attributes: createArrayCallback('attributes'),
		elements: createArrayCallback('elements'),
		comments: createBoolCallback('comments'),
		docTypes: createBoolCallback('docTypes')
	};

	var sanitized = '', tagStack = [];
	var ignoreStack = [];
	var selfClosingTags = {
		meta: 1,
		br: 1,
		link: 1,
		area: 1,
		base: 1,
		col: 1,
		command: 1,
		embed: 1,
		hr: 1,
		img: 1,
		input: 1,
		param: 1,
		source: 1
	};
	var callbacks = {
		docType: function(value) {
			if (toRemove.docTypes(value)) {
				return;
			}
			sanitized += '<!doctype ' + value + '>';
		},

		openElement: function(name) {
			name = name.toLowerCase();
			//if there is an unclosed self-closing tag in the stack, then
			//pop it off (assumed to be malformed html).
			if (tagStack.length) {
				var scope = last(tagStack);
				if (selfClosingTags[scope]) {
					tagStack.pop();
					if (scope === last(ignoreStack)) {
						ignoreStack.pop();
					}
				}
			}

			if (ignoreStack.length) {
				return;
			}

			tagStack.push(name);
			if (toRemove.elements(name)) {
				ignoreStack.push(name);
				return;
			}
			sanitized += '<' + name;
		},

		closeOpenedElement: function(name, token) {
			name = name.toLowerCase();
			if (token.length === 2) {
				//self closing
				var scope = tagStack.pop();
				if (scope === last(ignoreStack)) {
					ignoreStack.pop();
				}
			}
			if (ignoreStack.length || toRemove.elements(name)) {
				return;
			}
			sanitized += token;
		},

		closeElement: function(name) {
			name = name.toLowerCase();
			if (tagStack.length && last(tagStack) === name) {
				if (tagStack.pop() === last(ignoreStack)) {
					ignoreStack.pop();
				}
			}
			if (ignoreStack.length || toRemove.elements(name)) {
				return;
			}
			sanitized += '</' + name + '>';
		},

		attribute: function(name, value, quote) {
			if (ignoreStack.length) {
				return;
			}

			name = name.toLowerCase();
			if (toRemove.attributes(name, value)) {
				return;
			}

			sanitized += ' ' + name;
			if (value) {
				// reuse the existing quote style if possible
				sanitized += '=' + quote + ((quote === '"') ? value.replace(/"/g, '&quot;') : value.replace(/'/g, '&apos;')) + quote;
			}
		},

		text: function(value) {
			if (ignoreStack.length) {
				return;
			}
			sanitized += value;
		},

		comment: function(value) {
			if (ignoreStack.length || toRemove.comments(value)) {
				return;
			}
			sanitized += '<!--' + value + '-->';
		},

		cdata: function(value) {
			if (ignoreStack.length) {
				return;
			}

			for (var i = tagStack.length - 1; i >= 0; i--) {
				if (tagStack[i] === 'script' || tagStack[i] === 'xmp' || tagStack[i] === 'style') {
					sanitized += value;
					return;
				}
			}

			sanitized += '<![CDATA[' + value + ']]>';
		}
	};

	exports.parse(htmlString, callbacks);
	return sanitized;
};
