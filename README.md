# html-parser

Now with less explosions!

The purpose of this library is not to be the best XML parsing library ever
conceived. Because it's not. It's meant to be an HTML/XML parser that doesn't
require valid HTML/XML. It's also meant to act as a sanitizer, which is the
main reason for it's existence.

For example, you can just shove a blob of text into it, and it will happily
parse as if it were valid XML.

## Callback based parsing
```javascript
var htmlParser = require('html-parser');

var html = '<!doctype html><html><body onload="alert(\'hello\');">Yo<br />dawg</body></html>';
htmlParser.parse(html, {
	openElement: function(name) { console.log('open: %s', name); },
	closeOpenedElement: function(name, token) { console.log('close token: %s', token); },
	closeElement: function(name) { console.log('close: %s', name); },
	comment: function(value) { console.log('comment: %s', value); },
	cdata: function(value) { console.log('cdata: %s', value); },
	attribute: function(name, value) { console.log('attribute: %s=%s', name, value); },
	docType: function(value) { console.log('doctype: %s', value); }
});

/*
doctype: html
open: html
close token: >
open: body
attribute: onload=alert('hello');
close token: >
open: br
close token: />
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
	}
	comments: true
});

console.log(sanitized);
//<p>blah blah</p>
```