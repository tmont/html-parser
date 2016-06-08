exports.create = function(raw, callbacks, regex) {
	var index = 0,
		current = null,
		substring = null;

	var context = {
		text: '',
		peek: function(count) {
			count = count || 1;
			return this.raw.substr(this.index + 1, count);
		},
		read: function(count) {
			if (count === 0) {
				return '';
			}
			count = count || 1;
			var next = this.peek(count);
			this.index += count;
			if (this.index > this.length) {
				this.index = this.length;
			}
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
			return this.index >= this.length;
		},
		readRegex: function(regex) {
			var value = (regex.exec(this.raw.substring(this.index)) || [''])[0];
			this.index += value.length;
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
		return this.isEof() ? '' : current === null ? (current = this.raw.charAt(this.index)) : current;
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
	context.__defineSetter__('index', function(value) {
		index = value;
		current = null;
		substring = null;
	});
	context.__defineGetter__('substring', function() {
		return substring === null ? (substring = this.raw.substring(this.index)) : substring;
	});

	context.callbacks = {};
	var types = [ 'openElement', 'closeElement', 'attribute', 'comment', 'cdata', 'text', 'docType', 'xmlProlog', 'closeOpenedElement' ];
	types.forEach(function(value) {
		context.callbacks[value] = function() {};
	});

	merge(context.callbacks, callbacks || {});

	context.regex = {
		name: /[a-zA-Z_][\w:\-\.]*/,
		attribute: /[a-zA-Z_][\w:\-\.]*/,
		dataElements: {
			cdata: {
				start: '<![CDATA[',
				end: ']]>'
			},
			comment: {
				start: '<!--',
				end: '-->'
			},
			docType: {
				start: /^<!DOCTYPE /i,
				end: '>'
			}
		}
	};

	merge(context.regex, regex || {});

	return context;
};

function merge(target, source) {
    for (var name in source) {
		if (!source.hasOwnProperty(name)) continue;

		var value = source[name];

		if (target[name] && typeof value === 'object' && value instanceof RegExp === false) {
			merge(target[name], value);
		} else {
			target[name] = value;
		}
	}
}