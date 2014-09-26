var L = require('leaflet');
require('./vendor/esri-leaflet.js');
require('./controls/autocomplete.js');
var curry = require('lodash.curry');
var popup = curry((a, b) => L.Util.template(a, b));
var get = require('ramda').get;

var getProps = get('properties');

var div = L.DomUtil.create('div', 'map-canvas', L.DomUtil.get('main'));
var parkStyle = { color: '#70ca49', weight: 2 };

var lmap = L.map(div).setView([45.528, -122.680], 13);

L.esri.basemapLayer('Gray').addTo(lmap);

var parks = new L.esri.FeatureLayer('http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Parks/FeatureServer/0', {
  style: () => parkStyle
}).addTo(lmap);

L.control.autocomplete({
  layer: parks
}).addTo(lmap);


var popupTemplate = '<h3>{NAME}</h3>{ACRES} Acres<br><small>Property ID: {PROPERTYID}<small>';
var popupFeature = popup(popupTemplate);
parks.bindPopup(feature => popupFeature(getProps(feature)));

