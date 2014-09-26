module.exports = L;

var L = require('leaflet');
var Immutable = require('immutable');
require('./../data/transduceimmutable.js');
var transducers = require('transducers.js');
var [sequence, compose, into, map, filter, take] =
  [transducers.sequence, transducers.compose, transducers.into, transducers.map, transducers.filter, transducers.take];

var curry = require('lodash.curry');
var kompose = require('ramda').compose;
var get = require('ramda').get;

var indexOf = (a, b) => a.indexOf(b);
var getName = get('NAME');
var getProps = get('properties');
var getPropName = kompose(getName, getProps);

var sort = function(a, b) {
  var a_name = getPropName(a);
  var b_name = getPropName(b);
  if (a_name > b_name) return 1;
  if (a_name < b_name) return -1;
  return 0;
};

var upper = function(s) {
  return s.toUpperCase();
};

var filtername = function(name) {
  return filter(x => upper(getPropName(x)) === upper(name));
};
var fuzzyname = function(name) {
  return filter(x => indexOf(upper(getPropName(x)), upper(name)) > -1);
};
var getfuzzyname = function(name) {
  return compose(fuzzyname(name), map(getProps));
};

var makeListItem = function(x) {
  var a = L.DomUtil.create('a', 'list-group-item');
  a.href = '';
  a.setAttribute('data-result-name', getName(x));
  a.innerHTML = getName(x);
  return a;
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

  onAdd: function (m) {
    var container = L.DomUtil.create('div', 'auto-complete-container');
    var form = this._form = L.DomUtil.create('form', 'form', container);
    var group = L.DomUtil.create('div', 'form-group', form);
    var input =
      this._input =
      L.DomUtil.create('input', 'form-control input-sm', group);
    input.type = 'text';
    input.placeholder = this.options.placeholder;
    this._results = L.DomUtil.create('div', 'list-group', group);
    L.DomEvent.addListener(input, 'keyup', this.keyup, this);
    L.DomEvent.addListener(form, 'submit', this.find, this);
    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  onRemove: function(m) {
    L.DomEvent.removeListener(this._input, 'keyup', this.keyup, this);
    L.DomEvent.removeListener(this._form, 'submit', this.find, this);
  },

  keyup: function(e) {
    this._results.innerHTML = '';
    if (this._input.value.length > 2) {
      var result = sequence(getfuzzyname(this._input.value), this.data);
      var results = result.toJS();
      sequence(compose(take(10), map(makeListItem), map(x => {
        this._results.appendChild(x);
        L.DomEvent.addListener(x, 'click', this.itemSelected, this);
        return x;
      })), results);    }
  },

  itemSelected: function(e) {
    L.DomEvent.preventDefault(e);
    var elem = e.target;
    var value = elem.innerHTML;
    this._results.innerHTML = '';
    this._input.value = elem.getAttribute('data-result-name');
    this.find(e);
  },

  find: function(e) {
    L.DomEvent.preventDefault(e);
    var result = sequence(filtername(this._input.value), this.data);
    var data = result.last();
    if (data) {
      var feature = this.options.layer.getFeature(data.id);
      this._map.fitBounds(feature.getBounds());
    }
  },

  featureAdded: function(e) {
    this.rawdata.push(e.feature);
  },

  layerLoad: function() {
    this.data = into(Immutable.Vector(), map(x => x), this.rawdata.sort(sort));
  }
});

L.control.autocomplete = (id, options) => new L.Control.AutoComplete(id, options);

