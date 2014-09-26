module.exports = Immutable;

var Immutable = require('immutable');

Immutable.Vector.prototype['@@append'] = function(x) {
  return this.push(x);
};

Immutable.Vector.prototype['@@empty'] = function(x) {
  return Immutable.Vector();
};
