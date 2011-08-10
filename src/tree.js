/*************************************************
 * Abstract base classes for tree nodes and views
 ************************************************/

/**
 * Node is the core virtual DOM tree node base class.
 * All other classes of tree nodes descend from it.
 */
var Node = _baseclass();
_.parent = _.prev = _.next = _.firstChild = _.lastChild = 0;
_.children = function() {
  return new Group(this.firstChild, this.lastChild);
};
_.bubble = function(event, arg) {
  for (var ancestor = this; ancestor; ancestor = ancestor.parent)
    if (ancestor[event] && ancestor[event](arg) === false) break;

  return this;
};
_.disown = function(){
  //parent & siblings no longer acknowledge my existence
  //Relinks them around me.
  //Tree remains well-formed, but this node still points
  //to its former parent and siblings
  return siblingify(this, this.parent, this.prev, this.next, this.next, this.prev);
};
_.adopt = function(parent, prev, next) {
  //adopt new parent and siblings
  //Links them to me and me to them.
  //Does not relink former parent & siblings, so if there
  //are any, must disown first or tree will become malformed.
  this.parent = parent;
  this.prev = prev;
  this.next = next;
  return siblingify(this, parent, prev, next, this, this);
};

/**
 * An interstice between two nodes, a "location" in the
 * tree where a node can be inserted.
 * Not actually part of the tree, a view of an interstice
 * with one-way pointers to relevant nodes.
 */
var Interstice = _baseclass();
_.parent = _.prev = _.next = 0;
_.insertAt = function(parent, prev, next) {
  this.parent = parent;
  this.prev = prev;
  this.next = next;
  return this;
};
_.insertBefore = function(el) {
  return this.insertAt(el.parent, el.prev, el)
};
_.insertAfter = function(el) {
  return this.insertAt(el.parent, el, el.next);
};
_.prependTo = function(el) {
  return this.insertAt(el, 0, el.firstChild);
};
_.appendTo = function(el) {
  return this.insertAt(el, el.lastChild, 0);
};

/**
 * A group of sibling nodes in the tree.
 * Not actually part of the tree, a view of a group of nodes
 * with one-way pointers to relevant nodes.
 */
var Group = _baseclass(function(first, last) {
  if (!arguments.length) return;
  this.first = first;
  this.last = last || first; //if only one argument, group of one
});
_.first = _.last = 0;
_.each = function(fn) {
  for (var el = this.first; el !== this.last.next; el = el.next)
    if (fn.call(this, el) === false) break;

  return this;
};
_.fold = function(fold, fn) {
  this.each(function(el) {
    fold = fn.call(this, fold, el);
  });
  return fold;
};
_.disown = function() {
  //parent & siblings no longer acknowledge our existence
  //Like Node::disown, relinks them around us,
  //tree remains well-formed, but this node still points
  //to its former parent and siblings
  var prev = this.first.prev, next = this.last.next;
  return siblingify(this, this.first.parent, prev, next, next, prev);
};
_.adopt = function(parent, prev, next) {
  //adopt new parent and siblings
  //Like Node::adopt, links them to me and me to them,
  //but does not relink former parent & siblings, so if there
  //are any, must disown first or tree will become malformed.
  var group = this, first = group.first, last = group.last;
  group.each(function(el){ el.parent = parent; });
  first.prev = prev;
  last.next = next;
  return siblingify(group, parent, prev, next, first, last);
};

//util subroutine
//links siblings' or parent pointers
function siblingify(self, parent, prev, next, prev_next, next_prev) {
  if (prev)
    prev.next = prev_next;
  else
    parent.firstChild = prev_next;

  if (next)
    next.prev = next_prev;
  else
    parent.lastChild = next_prev;

  return self;
}

