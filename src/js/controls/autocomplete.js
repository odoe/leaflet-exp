module.exports = L;

var L = require('leaflet');
var Immutable = require('immutable');
var transducers = require('transducers.js');
var [sequence, compose, into, map, filter, take] =
  [transducers.sequence, transducers.compose, transducers.into, transducers.map, transducers.filter, transducers.take];

Immutable.Vector.prototype['@@append'] = function(x) {
  return this.push(x);
};
Immutable.Vector.prototype['@@empty'] = function(x) {
  return Immutable.Vector();
};

var filtername = function(name) {
  return filter(x => x.properties.NAME === name);
};
var fuzzyname = function(name) {
  return filter(x => x.properties.NAME.indexOf(name) > -1);
};
var asproperties = map(x => x.properties);
var getfuzzyname = function(name) {
  return compose(fuzzyname(name), asproperties);
};

L.Control.AutoComplete = L.Control.extend({
  options: {
    position: 'topright',
    placeholder: 'Search...'
  },

  rawdata: [],
  data: null,

  layerLoaded: false,

  initialize: function (options) {
    L.Util.setOptions(this, options);
    if (options.layer) {
      options.layer.on('createfeature', this.featureAdded, this);
      options.layer.on('load', this.layerLoad, this);
    }
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'auto-complete-container');
    var form = this._form = L.DomUtil.create('form', 'form', container);
    var group = L.DomUtil.create('div', 'form-group', form);
    var input = this._input = L.DomUtil.create('input', 'form-control', group);
    L.DomUtil.addClass(input, 'input-sm');
    input.type = 'text';
    input.placeholder = this.options.placeholder;
    this._results = L.DomUtil.create('div', 'list-group', group);
    L.DomEvent.addListener(input, 'keyup', this.keyup, this);
    L.DomEvent.addListener(form, 'submit', this.find, this);
    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  onRemove: function(map) {
    L.DomEvent.removeListener(this._input, 'keyup', this.keyup, this);
    L.DomEvent.removeListener(this._form, 'submit', this.find, this);
  },

  keyup: function(e) {
    this._results.innerHTML = '';
    if (this._input.value.length > 2) {
      var result = sequence(getfuzzyname(this._input.value), this.data);
      var results = result.toJS();
      sequence(compose(map(x => {
        var li = L.DomUtil.create('a', 'list-group-item');
        li.setAttribute('data-result-name', x.NAME);
        li.innerHTML = x.NAME;
        this._results.appendChild(li);
        L.DomEvent.addListener(li, 'click', this.itemSelected, this);
        return li;
      }), take(10)), results);    }
  },

  itemSelected: function(e) {
    var value = e.target.innerHTML;
    this._results.innerHTML = '';
    this._input.value = e.target.getAttribute('data-result-name');
    this.find(e);
  },

  find: function(e) {
    L.DomEvent.preventDefault(e);
    var result = sequence(filtername(this._input.value), this.data);
    var data = result.last();
    var feature = this.options.layer.getFeature(data.id);
    this._map.fitBounds(feature.getBounds());
  },

  featureAdded: function(e) {
    this.rawdata.push(e.feature);
  },

  layerLoad: function() {
    this.data = into(Immutable.Vector(), map(x => x), this.rawdata);
  }
});

L.control.autocomplete = (id, options) => new L.Control.AutoComplete(id, options);

