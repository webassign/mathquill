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

/** simple sugar for idiomatic JS classes:
 * (If you don't know how prototypes work in JavaScript, see http://github.com/laughinghan/mathquill/wiki/Prototype-based-Inheritance-in-JavaScript .)
 * Idiomatic classes in JS are just a constructor and a prototype,
 * this is some simple sugar to do that with a little less typing.
 * Instead of
 *    function Cat(furriness) {
 *      this.furriness = furriness;
 *      this.adorableness = furriness/10;
 *    }
 *    _ = Cat.prototype = new Animal;
 *    _.play = function(){ this.chase('mouse'); };
 * just do
 *    var Cat = _class(new Animal, function(furriness) {
 *      this.furriness = furriness;
 *      this.adorableness = furriness/10;
 *    });
 *    _.play = function(){ this.chase('mouse'); };
 * The constructor is actually optional, if you just want a class
 * that inherits from a prototype.
 * Instead of
 *    function Animal(){}
 *    _ = Animal.prototype;
 *    _.chase = function(prey) ...
 * just do
 *    var Animal = _class({});
 *    _.chase = function(prey) ...
 */
function _class(prototype, constructor) {
  if (!constructor) constructor = function(){};
  _ = constructor.prototype = prototype;
  return constructor;
}
/* There's actually sugar to make that common case even simpler:
 *     var Animal = _baseclass();
 *     _.chase = function(prey) ...
 */
function _baseclass(constructor) {
  return _class({}, constructor);
}
/* There's also sugar for the common case of wanting to
 * "inherit" the superclass constructor:
 * Instead of
 *    function HouseCat() {
 *      Cat.apply(this, arguments);
 *    }
 +    _ = HouseCat.prototype = new Cat;
 *    _.play = function(){ this.chase('yarn'); };
 * just do
 *    var HouseCat = _subclass(Cat);
 *    _.play = function(){ this.chase('yarn'); };
 */
function _subclass(superclass) {
  return _class(new superclass, function(){
    superclass.apply(this, arguments);
  });
}

