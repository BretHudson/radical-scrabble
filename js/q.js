/*
Q.js - a tiny jQuery-inspired library

The MIT License (MIT)

Copyright (c) 2016 - 2017 Ian Jones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


// Add some useful methods to all Elements

/// If this browser has basic classList support
if (document.documentElement.classList &&
	document.documentElement.classList.add) {

	// Returns true if this element has class (name)
	Element.prototype.hasClass = function(name) {
		return this.classList.contains(name);
	}

	// Removes class (name)
	Element.prototype.removeClass = function(name) {
		this.classList.remove(name);
	}

	// Adds class (name)
	Element.prototype.addClass = function(name) {
		this.classList.add(name);
	}

	// Toggle class (name)
	Element.prototype.toggleClass = function(name) {
		return this.classList.toggle(name);
	}
} else {
	// Returns true if this element has class (name)
	Element.prototype.hasClass = function(name) {
		return new RegExp("(?:^|\\s)" + name + "(?:\\s|$)").test(this.className);
	}

	// Removes class (name)
	Element.prototype.removeClass = function(name) {
		this.className = this.className.replace(new RegExp(
			"(^|\\s)" + name + "(\\s|$)", "g"), " ").replace(
			/(^\s|\s{2,}|\s$)/g, "");
	}

	// Adds class (name)
	Element.prototype.addClass = function(name) {
		if (this.hasClass(name)) return;
		this.className = (this.className + " " + name).replace(
			/(^\s|\s{2,}|\s$)/g, "");
	}

	// Toggle class (name)
	Element.prototype.toggleClass = function(name) {
		if (this.hasClass(name)) {
			this.className = this.className.replace(new RegExp(
				"(^|\\s)" + name + "(\\s|$)", "g"), " ").replace(
				/(^\s|\s{2,}|\s$)/g, "");
			return false;
		} else {
			this.className = (this.className + " " + name).replace(
				/(^\s|\s{2,}|\s$)/g, "");
			return true;
		}
	}
}

// Prepends elements or HTML strings
Element.prototype.prepend = function(node) {
	// If the element is empty, just append it
	if (this.childNodes.length === 0) {
		this.append(node);
		return;
	}
	// Prepend the node
	if (typeof node === 'string') { // HTML string
		var frag = document.createElement("div");
		frag.innerHTML = node;
		for (var i = frag.childNodes.length; i --; ) {
			this.insertBefore(frag.childNodes[i], this.childNodes[0]);
		}
	} else if (window.$Element &&
		node instanceof $Element) { // Blueprint $Element
		this.insertBefore(node.element(), this.childNodes[0]);
	} else if (node instanceof Element) { // Element(s)
		this.insertBefore(node, this.childNodes[0]);
	} else if (node.element) {
		this.insertBefore(node.element, this.childNodes[0]);
	} else {
		console.group('Error prepending node:');
		console.error(node);
		console.groupEnd();
	}
}

// Append elements or HTML strings
Element.prototype.append = function(node) {
	if (typeof node === 'string') { // HTML string
		var frag = document.createElement("div");
		frag.innerHTML = node;
		for (var i = frag.childNodes.length; i --; ) {
			this.appendChild(frag.childNodes[0]);
		}
	} else if (window.$Element &&
		node instanceof $Element) { // Blueprint $Element
		this.appendChild(node.element());
	} else if (node instanceof Element) { // Element(s)
		this.appendChild(node);
	} else if (node.element) {
		this.appendChild(node.element);
	} else {
		console.group('Error appending node:');
		console.error(node);
		console.groupEnd();
	}
}

// Append plaintext strings (sanitizes automatically)
Element.prototype.appendText = function(text) {
	this.appendChild(document.createTextNode(text));
}

var selectorCache = new Object();

// Provide a faster querySelectorAll
Document.prototype.q =
DocumentFragment.prototype.q =
Element.prototype.q = function(sel) {
	var result = null;
	// If there is a cached version of this selector
	var type = selectorCache[sel];
	if (type != null) {
		switch (type) {
			case 0:
				// Complex
				result = this.querySelectorAll(sel);
				break;
			case 1:
				// Class
				result = this.getElementsByClassName(sel.substr(1));
				break;
			case 2:
				// ID
				return this.getElementById(sel.substr(1)) || new _q_EmptyList();
				break;
			default:
				// Tag
				result = this.getElementsByTagName(sel);
				break;
		}
	} else {
		// Determine if this query can be optimized
		for (var i = sel.length; -- i; ) {
			var n = sel.charCodeAt(i);
			if (n !== 45 && ((n < 65 && (n < 48 || n > 57)) || (n > 90 &&
				(n < 97 || n > 122)))) {
				selectorCache[sel] = 0;
				result = this.querySelectorAll(sel);
				break;
			}
		}
		if (result === null) {
			switch (sel[0]) {
				case '.':
					// Class
					selectorCache[sel] = 1;
					result = this.getElementsByClassName(sel.substr(1));
					break;
				case '#':
					// ID
					selectorCache[sel] = 2;
					return this.getElementById(sel.substr(1)) || new _q_EmptyList();
					break;
				default:
					// Tag
					selectorCache[sel] = 3;
					result = this.getElementsByTagName(sel);
					break;
			}
		}
	}
	if (result.length === 1) return result[0];
	return result;
}

// Make it so that checking the length of .q will always work
Element.prototype.length = 1;

// Make it so that looping through the contents of .q will always work
Object.defineProperty(Element.prototype, '0', {
	set: function() {},
	get: function() {
		return this;
	}
});

// Make it possible to query a list of elements
HTMLCollection.prototype.q =
NodeList.prototype.q = function() {
	var result = new Array();
	for (var i = this.length; i --; ) {
		var i_result = this[i].querySelectorAll.apply(this[i], arguments);
		for (var x = 0, y = i_result.length; x < y; ++ x) {
			result.push(i_result[x]);
		}
	}
	if (result == 1) return result[0];
	result.q = this.q;
	result.do = this.do;
	return result;
}

/// Makes it easy to perform an action on one or more elements
Element.prototype.do = function(method) {
	if (typeof method === 'string') { // Method
		this[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else { // Function
		method.apply(this, Array.prototype.slice.call(arguments, 1));
	}
}
HTMLCollection.prototype.do =
NodeList.prototype.do = function(method) {
	// Loop through elements and perform action on each one
	for (var i = this.length; i --; ) {
		this[i].do.apply(this[i], arguments);
	}
}

// This is a more efficient implementation that does something similar to the
// do method, but supports no custom arguments and passes each element as the
// sole argument to the callback (this method also works much better with arrow
// functions than `do` does)
Element.prototype.each = function(callback) {
	callback(this);
}
HTMLCollection.prototype.each =
NodeList.prototype.each = function(callback) {
	// Loop through elements and perform action on each one
	for (var i = this.length; i --; ) {
		this[i].each(callback);
	}
}

// Make it easy to scroll an element into view (polyfill + simplicity)
Element.prototype.scrollTo = function(x, y) {
	// (x, y)
	if (y != null && typeof x === 'number') {
		this.scrollLeft = x;
		this.scrollTop = y;
		return;
	}
	// (y)
	if (typeof x === 'number') {
		this.scrollTop = x;
		return;
	}
	// (Element)
	if (x instanceof Element) {
		var t_rect = this.getBoundingClientRect();
		var x_rect = x.getBoundingClientRect();
		if (x_rect.top > t_rect.top + t_rect.height - x_rect.height) {
			this.scrollTop += x_rect.bottom - t_rect.bottom;
		} else if (x_rect.top < t_rect.top) {
			this.scrollTop += x_rect.top - t_rect.top;
		}
	}
}

// Add a getElementById method to Elements
Element.prototype.getElementById = function(id) {
	return document.getElementById(id);
}

/// Implement some methods that document fragments would be better off with
DocumentFragment.prototype.getElementsByTagName = function(name) {
	var result = new Array();
	var upperName = name.toUpperCase();
	for (var x = 0, y = this.childNodes.length; x < y; ++ x) {
		// Determine if this node fits the query
		if (this.childNodes[x].tagName === upperName) result.push(this.childNodes[x]);
		// Determine if childNodes of this node fit the query
		result = result.concat(Array.prototype.slice.call(
			this.childNodes[x].getElementsByTagName(name), 0));
	}
	return result;
}

DocumentFragment.prototype.getElementsByClassName = function(name) {
	var result = new Array();
	for (var x = 0, y = this.childNodes.length; x < y; ++ x) {
		// Determine if this node fits the query
		if (this.childNodes[x].hasClass(name)) result.push(this.childNodes[x]);
		// Determine if childNodes of this node fit the query
		result = result.concat(Array.prototype.slice.call(
			this.childNodes[x].getElementsByClassName(name), 0));
	}
	return result;
}

if (DocumentFragment.prototype.getElementById == null) {
	DocumentFragment.prototype.getElementById = function(id) {
		var nodes = this.childNodes;
		for (var i = 0; i < nodes.length; ++ i) {
			// Determine if this node fits the query
			if (nodes[i].id === id) return nodes[i];
			// Add this nodes' children to the queue
			nodes = Array.prototype.concat.call(
				Array.prototype.slice.call(nodes),
				Array.prototype.slice.call(nodes[i].children)
			);
		}
		return null;
	}
}

function EventListenerInfo(arg) {
	this.type = arg[0];
	this.func = arg[1];
	this.capture = arg[2] || false;
}

Element.prototype._addEventListener =
	Element.prototype.addEventListener;

Element.prototype.on =
Element.prototype.addEventListener = function(type,
	func, capture) {
	// If events hasn't been initialized, initialize it
	if (!this.events) this.events = new Array();
	// Store the event listener so it can be
	// removed later
	this.events.push(new EventListenerInfo(arguments));
	// Call the client's native method
	this._addEventListener(type, func, capture);
}

Element.prototype.off =
Element.prototype.unbindEventListeners = function(type) {
	if (!this.events) return;
	var type = type || "";
	var i = this.events.length;
	while (i --) {
		var e = this.events[i];
		if (type != "" && type != e.type) continue;
		this.removeEventListener(e.type,
			e.func, e.capture);
		this.events.splice(i, 1);
	}
}

Element.prototype.empty = function() { // Removes all children
	while (this.childNodes.length !== 0) {
		// Remove child node
		this.removeChild(this.childNodes[0]);
	}
}

Element.prototype.remove = function() {
	if (this.parentElement !== null) {
		this.parentElement.removeChild(this);
	}
}

Element.prototype.getStyle = function(name) {
	return this.currentStyle ? this.currentStyle[name] :
     getComputedStyle(this, null)[name];
}

Element.prototype.attr = function(name, value) {
	if (arguments.length >= 2) {
		this.setAttribute(name, value);
		return String(value);
	} else {
		return this.getAttribute(name);
	}
}

window.on = window.addEventListener;
Document.prototype.on = Document.prototype.addEventListener;
DocumentFragment.prototype.on = DocumentFragment.prototype.addEventListener;

_q_EmptyList = function() {

}

_q_EmptyList.prototype.length = 0;

_q_EmptyList.prototype.do =
_q_EmptyList.prototype.each = function(){};

_q_EmptyList.prototype.q = function(){ return this; };