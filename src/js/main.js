import L from 'leaflet';
import './vendor/esri-leaflet.js';
import './controls/autocomplete';
import curry from 'lodash.curry';
import get from 'lodash.property';
import pf from 'pointfree-fantasy';

var compose = pf.compose;

var getProps = get('properties');
var popup = curry((a, b) => L.Util.template(a, b));
var popupTemplate = '<h3>{NAME}</h3>{ACRES} Acres<br><small>Property ID: {PROPERTYID}<small>';
var popupFeature = popup(popupTemplate);

var div = L.DomUtil.create('div', 'map-canvas', L.DomUtil.get('main'));
var parkStyle = { color: '#70ca49', weight: 2 };
var grayBasemap = (x) => L.esri.basemapLayer('Gray').addTo(x);
var lmap = L.map(div).setView([45.528, -122.680], 13);
var addToMap = curry((a, b) => b.addTo(a));
var featureLayer = curry((a, b) => L.esri.featureLayer(b, a));
var bindToPopup = (x) => x.bindPopup(feature => popupFeature(getProps(feature)));
var autocompleteControl = curry((a, b) => L.control.autocomplete({ layer:b  }).addTo(a));

grayBasemap(lmap);
var addParks = compose(autocompleteControl(lmap), bindToPopup, addToMap(lmap), featureLayer(parkStyle));

addParks('http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Parks/FeatureServer/0');

