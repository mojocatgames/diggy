(function() {

function makeObject(fn, defaultSet, defaultEvents) {

	fn = (fn || function() {});
	defaultSet = (defaultSet || {});
	defaultEvents = (defaultEvents || {});

	defaultEvents['set:id'] = function(id) {
		this.id = id;
	};

	// TODO: make sure this works, hasn't been tested
	defaultEvents['set:parent'] = function(obj) {
		obj.add(this);
	};

	/**
	 * A core object class to extend for use in other meangingful ways.
	 * @namespace DGE
	 * @class Object
	 */
	var Obj = fn;

	/**
	 * Initializes the object and its properties.
	 * @param {String} conf A key/value pair of values to set.
	 * @return {Object} this (for chaining).
	 * @method init
	 */
	Obj.prototype.init = function(conf) {

		for (var k in Obj.defaults) {
			if (conf[k] === undefined) conf[k] = Obj.defaults[k];
		}

		if (conf.id === undefined) conf.id = DGE.makeId();

		Obj.children[conf.id] = this;
		this.children = (this.children || {});
		this.data = (this.data || {});
		this.events = (this.events || {});

		this.set(conf);

	};

	/**
	 * This object's identifier.
	 * @default null
	 * @property id
	 * @type Object
	 */
	Obj.prototype.id = null;

	/**
	 * Any children attached to this object.
	 * @property children
	 * @type Object
	 */
	Obj.prototype.children = null;

	/**
	 * The data itself, stored by key.
	 * @property data
	 * @type Object
	 */
	Obj.prototype.data = null;

	/**
	 * A container for the listeners.
	 * @default null
	 * @property events
	 * @type Object
	 */
	Obj.prototype.events = null;

	/**
	 * A reference to the parent object.
	 * @default null
	 * @property parent
	 * @type Object
	 */
	Obj.prototype.parent = null;

	/**
	 * Adds an object as a child to this one.
	 * @param {Object} obj The object to add.
	 * @return {Object} this (for chaining).
	 * @method add
	 */
	Obj.prototype.add = function(obj) {
		this.children[obj.id] = obj;
		obj.parent = this;
		return this.fire('add');
	};

	/**
	 * Fires off a key change event.
	 * @param {String} key The key of the value to fetch.
	 * @param {String} value The value that was set.
	 * @return {Object} this (for chaining).
	 * @method fire
	 */
	Obj.prototype.fire = function(key, value) {
		if (key in this.events) this.events[key].apply(this, [value]);
		if (key in defaultEvents) defaultEvents[key].apply(this, [value]);
		return this;
	};

	/**
	 * Gets a stored value.
	 * @param {String} key The key of the value to fetch.
	 * @return {Object} The stored value
	 * @method get
	 */
	Obj.prototype.get = function(key) {
		this.fire(DGE.sprintf('get:%s', key), this.data[key]);
		return this.data[key];
	};

	/**
	 * Sets a stored value.
	 * @param {String} key The key of the value to set.
	 * @param {String} key The value of the key to set.
	 * @return {Object} this (for chaining).
	 */
	Obj.prototype.set = function(key, value) {

		if (key === undefined) return this;

		if (typeof(key) == 'object') {

			for (var k in key) {
				arguments.callee.apply(this, [k, key[k]]);
			}

		} else {

			var previous = this.data[key];
			this.data[key] = value;

			if (value !== previous) {
				this.fire(DGE.sprintf('change:%s', key), value);
			}

			this.fire(DGE.sprintf('set:%s', key), value);

		}

		return this;

	};

	/**
	 * Attaches a listener to when the passed key changes.
	 * @param {String} key The key of the value to fetch.
	 * @param {Function} e The function to fire.
	 * @return {Object} this (for chaining).
	 * @method on
	 */
	Obj.prototype.on = function(key, e) {

		if (typeof(key) == 'object') {
			for (var k in key) {
				arguments.callee.apply(this, [k, key[k]]);
			}
		}

		this.events[key] = e;

		var on = DGE.sprintf('on:%s', key);

		if (on in defaultEvents) {
			defaultEvents[on].apply(this, [e]);
		}

		return this;

	};

	/**
	 * Removes this object from memory.
	 * @param {Number} delay (optional) The number of ms to wait before removing.
	 * @method remove
	 */
	Obj.prototype.remove = function(delay) {

		var that = this;

		function remove() {
			that.fire('remove');
			Obj.removeById(that.id);
		};

		if (delay) {
			setTimeout(remove, delay);
		} else {
			remove();
		}

	};

	/**
	 * All created objects of this type.
	 * @default Object
	 * @property children
	 * @type Object
	 */
	Obj.children = {};

	/**
	 * All created objects of this type.
	 * @default Object
	 * @property children
	 * @type Object
	 */
	Obj.defaults = defaultSet;

	/**
	 * Extends this object.
	 * @param {Function} F The object to extend with.
	 * @return {Function} F, having extended Obj.
	 * @method extend
	 * @static
	 */
	Obj.extend = function(F, defaultSetNew, defaultEventsNew) {

		var defaultSetExtended = {};
		var defaultEventsExtended = {};

		F.prototype = new Obj();

		for (var k in defaultSet) {
			defaultSetExtended[k] = defaultSet[k];
		}

		for (var k in defaultSetNew) {
			defaultSetExtended[k] = defaultSetNew[k];
		}

		for (var k in defaultEvents) {
			defaultEventsExtended[k] = defaultEvents[k];
		}

		for (var k in defaultEventsNew) {
			defaultEventsExtended[k] = defaultEventsNew[k];
		}

		return makeObject(F, defaultSetExtended, defaultEventsExtended);

	};

	/**
	 * Gets an object by its id.
	 * @param {String} id The id of the object to get.
	 * @return {Object || null} The object if it exists or null on failure.
	 * @method getById
	 * @static
	 */
	Obj.getById = function(id) {
		return Obj.children[id];
	};

	/**
	 * Creates multiple new objects at once, by id.
	 * @param {Object} keys An object with keys as ids and the value as additional confs to pass.
	 * @param {Object} conf (optional) A key/value pair of values to set.
	 * @return {Object} The created objects, with their id's as keys.
	 * @method makeMultiple
	 * @static
	 */
	Obj.makeMultiple = function(keys, conf) {

		var objects = {};

		for (var id in objects) {

			for (var k in conf) {
				objects.id = id;
				if (objects[k] === undefined) objects[k] = conf[k];
			}

			var obj = new Obj(objects[k]);
			objects[obj.id] = obj;

		}

		return objects;
		
	};

	/**
	 * Removes an object from memory.
	 * @param {String} id The id of the object to remove.
	 * @method removeById
	 * @static
	 */
	Obj.removeById = function(id) {

		var obj = Obj.children[id];

		// Get rid of the object's children
		for (var id in obj.children) {
			obj.children[id].remove();
		}

		// Remove from parent
		if (obj.parent) delete obj.parent.children[this.id];

	};

	return Obj;

};

DGE.Object = makeObject();
DGE.Object.make = makeObject;

})();
