# html-parser

[![Build Status](https://travis-ci.org/tmont/html-parser.png)](https://travis-ci.org/tmont/html-parser)
[![NPM version](https://badge.fury.io/js/html-parser.png)](http://badge.fury.io/js/html-parser)

Now with less explosions!

The purpose of this library is not to be the best XML parsing library ever
conceived. Because it's not. It's meant to be an HTML/XML parser that doesn't
require valid HTML/XML. It's also meant to act as a sanitizer, which is the
main reason for it's existence.

For example, you can just shove a blob of text into it, and it will happily
parse as if it were valid XML.

Licensed under [MIT](./LICENSE).

## Installation
`npm install html-parser`

## Callback based parsing
```javascript
var htmlParser = require('html-parser');

var html = '<!doctype html><html><body onload="alert(\'hello\');">Hello<br />world</body></html>';
htmlParser.parse(html, {
	openElement: function(name) { console.log('open: %s', name); },
	closeOpenedElement: function(name, token, unary) { console.log('token: %s, unary: %s', token, unary); },
	closeElement: function(name) { console.log('close: %s', name); },
	comment: function(value) { console.log('comment: %s', value); },
	cdata: function(value) { console.log('cdata: %s', value); },
	attribute: function(name, value) { console.log('attribute: %s=%s', name, value); },
	docType: function(value) { console.log('doctype: %s', value); },
	text: function(value) { console.log('text: %s', value); }
});

/*
doctype: html
open: html
close token: >
open: body
attribute: onload=alert('hello');
close token: >
text: Hello
open: br
close token: />, unary: true
text: world
close: body
close: html
*/
```

## Sanitization
```javascript
var htmlParser = require('html-parser');

var html = '<script>alert(\'danger!\')</script><p onclick="alert(\'danger!\')">blah blah<!-- useless comment --></p>';
var sanitized = htmlParser.sanitize(html, {
	elements: [ 'script' ],
	attributes: [ 'onclick' ],
	comments: true
});

console.log(sanitized);
//<p>blah blah</p>
```

### Using callbacks
```javascript
var htmlParser = require('html-parser');

var html = '<script>alert(\'danger!\')</script><p onclick="alert(\'danger!\')">blah blah<!-- useless comment --></p>';
var sanitized = htmlParser.sanitize(html, {
	elements: function(name) {
		return name === 'script';
	},
	attributes: function(name, value) {
		return /^on/i.test(name) || /^javascript:/i.test(value);
	},
	comments: true
});

console.log(sanitized);
//<p>blah blah</p>
```

## API
```javascript
/**
 * Parses the given string o' HTML, executing each callback when it
 * encounters a token.
 *
 * @param {String} htmlString A string o' HTML
 * @param {Object} [callbacks] Callbacks for each token
 * @param {Function} [callbacks.attribute] Takes the name of the attribute and its value
 * @param {Function} [callbacks.openElement] Takes the tag name of the element
 * @param {Function} [callbacks.closeOpenedElement] Takes the tag name of the element and the token used to
 * close it (">", "/>", "?>")
 * @param {Function} [callbacks.closeElement] Takes the name of the element
 * @param {Function} [callbacks.comment] Takes the content of the comment
 * @param {Function} [callbacks.docType] Takes the content of the document type declaration
 * @param {Function} [callbacks.cdata] Takes the content of the CDATA
 * @param {Function} [callbacks.xmlProlog] Takes no arguments
 * @param {Function} [callbacks.text] Takes the value of the text node
 */
parse(htmlString, callbacks)

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
parseFile(fileName, encoding, callbacks, callback)

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
sanitize(htmlString, removalCallbacks)
```

## Development
```shell
git clone https://github.com/tmont/html-parser.git
cd html-parser
npm link
npm test
```
