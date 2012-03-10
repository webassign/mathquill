/**
 * Copyleft 2010-2011 Jay and Han (laughinghan@gmail.com)
 *   under the GNU Lesser General Public License
 *     http://www.gnu.org/licenses/lgpl.html
 * Project Website: http://mathquill.com
 */

(function() {

var $ = jQuery,
  undefined,
  _, //temp variable for multiple assignment to objects
  jQueryDataKey = '[[mathquill internal data]]',
  min = Math.min,
  max = Math.max;

/** Usage of '_':
 * temp variable for multiple assignment to objects
 * Instead of
 *  ooo.eee.oo.ah_ah.ting.tang.walla.walla.bing = true;
 *  ooo.eee.oo.ah_ah.ting.tang.walla.walla.bang = true;
 * you can just write
 *  _ = ooo.eee.oo.ah_ah.ting.tang.walla.walla;
 *  _.bing = true;
 *  _.bang = true;
 * Example blatantly stolen from http://www.yuiblog.com/blog/2006/04/11/with-statement-considered-harmful/
 */

/**
 * simple sugar for idiomatic JS classes
 * Usage:
 *  var Cat = _class(new Animal, function(furriness) {
 *    this.furriness = furriness;
 *    this.adorableness = furriness/10;
 *  });
 *  _.play = function(){ this.chase('mouse'); };
 */
function _class(prototype, constructor) {
  if (!constructor) constructor = function(){};
  _ = constructor.prototype = prototype;
  return constructor;
}

/**
 * more sugar, for classes without a pre-supplied prototype
 * Usage:
 *  var Animal = _baseclass();
 *  _.chase = function(prey) ...
 */
function _baseclass(constructor) {
  return _class({}, constructor);
}

/**
 * sugar specifically for copying the constructor
 * Usage:
 *  var HouseCat = _subclass(Cat);
 *  _.play = function(){ this.chase('yarn'); };
 */
function _subclass(superclass) {
  return _class(new superclass, function(){
    superclass.apply(this, arguments);
  });
}

