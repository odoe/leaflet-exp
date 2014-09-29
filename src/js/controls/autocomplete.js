export default L;

import L from 'leaflet';
import Immutable from 'immutable';
import './../data/transduceimmutable';
import transducers from 'transducers.js';
import curry from 'lodash.curry';
import get from 'lodash.property';
import kompose from 'lodash.compose';
import debounce from 'lodash.debounce';

var [sequence, compose, into, map, filter, take] =
  [transducers.sequence, transducers.compose, transducers.into, transducers.map, transducers.filter, transducers.take];

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
    L.DomEvent.addListener(input, 'keyup', debounce(this.keyup, 300), this);
    L.DomEvent.addListener(form, 'submit', this.find, this);
    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  onRemove: function(m) {
    L.DomEvent.removeListener(this._input, 'keyup', this.keyup, this);
    L.DomEvent.removeListener(form, 'submit', this.find, this);
  },

  keydown: function(e) {
    console.debug('keycode', e);
    switch(e.keyCode) {
      case 38: //up
        this.select(1);
        console.debug('key up', e);
        break;
      case 40: //down
        this.select(-1);
        console.debug('key down', e);
        break;
      default:
        console.debug('key default');
    }
  },

  select: function(i) {
    this._count = this._count - i;
    if (this._count < 0) this._count = this.resultElems.length - 1;
    if (this._count > this.resultElems.length - 1) this._count = 0;
    //console.debug('i, count', i, this._count);
    if (this._selection) {
      //console.debug('select 1', this.resultElems);
      L.DomUtil.removeClass(this._selection, 'active');
      this._selection = this.resultElems[this._count];
      //this._selection = i > 0 ? this._selection.nextSibling : this._selection.previousSibling;// this._selection[i > 0 ? 'nextSibling' : 'previousSibling'];
      //console.debug('select defined', this._selection);
    }
    if (!this._selection) {
      this._selection = this.resultElems[this._count];
      //console.debug('is it there', this.resultElems, this._selection);
      //this._selection = this._results[i > 0 ? 'firstChild' : 'lastChild'].nextSibling;
      L.DomUtil.addClass(this._selection, 'active');
      //console.debug('select first made', this._selection);
    }
    if (this._selection) {
      //console.debug('select 2', this._selection);
      L.DomUtil.addClass(this._selection, 'active');
      //console.debug('selection class added if exist', this._selection);
    }
  },

  keyup: function(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      this.keydown(e);
    } else {
      this._results.innerHTML = '';
      if (this._input.value.length > 2) {
        var result = sequence(getfuzzyname(this._input.value), this.data);
        var results = result.toJS();
        this.resultElems = sequence(compose(take(10), map(makeListItem), map(x => {
          this._results.appendChild(x);
          L.DomEvent.addListener(x, 'click', this.itemSelected, this);
          return x;
        })), results);
        this._count = -1;
      }
    }
  },

  resultSelected: function() {
    var elem = this._selection;;
    var value = elem.innerHTML;
    this._results.innerHTML = '';
    this._input.value = elem.getAttribute('data-result-name');
    this._selection = null;
    this.find();
  },

  itemSelected: function(e) {
    if (e) L.DomEvent.preventDefault(e);
    var elem = e.target;
    var value = elem.innerHTML;
    this._input.value = elem.getAttribute('data-result-name');
    //this.find(e);
    var result = sequence(filtername(this._input.value), this.data);
    var data = result.last();
    if (data) {
      var feature = this.options.layer.getFeature(data.id);
      this._map.fitBounds(feature.getBounds());
    }
    this._results.innerHTML = '';
  },

  find: function(e) {
    if (e) L.DomEvent.preventDefault(e);
    if (this._selection) {
      this.resultSelected(e);
    } else {
      var result = sequence(filtername(this._input.value), this.data);
      var data = result.last();
      if (data) {
        var feature = this.options.layer.getFeature(data.id);
        this._map.fitBounds(feature.getBounds());
      }
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

