/*************************************************
 * tree.js
 * Abstract base classes for tree nodes and views
 ************************************************/

/**
 * Node is the core virtual DOM tree node base class.
 * All other classes of tree nodes descend from it.
 */
var Node = Class(function(node) {
  node.parent =
  node.prev =
  node.next =
  node.firstChild =
  node.lastChild =
  0;

  node.children = function() {
    return new Range(this.firstChild, this.lastChild);
  };

  node.bubble = function(event, arg) {
    for (var ancestor = this; ancestor; ancestor = ancestor.parent) {
      if (ancestor[event] && ancestor[event](arg) === false) break;
    }

    return this;
  }

  node.disown = function() {
    //parent & siblings no longer acknowledge my existence
    //Relinks them around me.
    //Tree remains well-formed, but this node still points
    //to its former parent and siblings

    var self = this;
    if (self.prev) self.prev.setNext(self.next);
    if (self.next) self.next.setPrev(self.prev);

    // handle the edge case of a node by itself
    if(!self.prev && !self.next) {
      self.parent.firstChild = self.parent.lastChild = 0;
    }

    return self;
  };

  node.adopt = function(parent, prev, next) {
    this.parent = parent;
    this.setPrev(prev);
    this.setNext(next);

    return this;
  };

  //util subroutine
  //links siblings' or parent pointers
  node.setNext = function(next) {
    var self = this;

    self.next = next;
    if (next) {
      next.prev = self;
    }
    else {
      self.parent.lastChild = self;
    }
  };

  node.setPrev = function(prev) {
    var self = this;

    self.prev = prev;
    if (prev) {
      prev.next = self;
    }
    else {
      self.parent.firstChild = self;
    }
  }
});

/**
 * An interstice between two nodes, a "location" in the
 * tree where a node can be inserted.
 * Not actually part of the tree, a view of an interstice
 * with one-way pointers to relevant nodes.
 */
var Interstice = Class(function(interstice) {
  interstice.parent =
  interstice.prev =
  interstice.next = 0;

  interstice.insertAt = function(parent, prev, next) {
    this.parent = parent;
    this.prev = prev;
    this.next = next;
    return this;
  };

  interstice.insertBefore = function(el) {
    return this.insertAt(el.parent, el.prev, el);
  };

  interstice.insertAfter = function(el) {
    return this.insertAt(el.parent, el, el.next);
  };

  interstice.appendTo = function(parent) {
    return this.insertAt(parent, parent.lastChild, 0);
  };

  interstice.prependTo = function(parent) {
    return this.insertAt(parent, 0, parent.firstChild);
  };

  interstice.append = function(el) {
    replaceWithElement(this, el);
    return this.insertAfter(el);
  };

  interstice.prepend = function(el) {
    replaceWithElement(this, el);
    return this.insertBefore(el);
  };

  // @private
  function replaceWithElement(self, el) {
    el.adopt(self.parent, self.prev, self.next);
  }
});

/**
 * A group of sibling nodes in the tree.
 * Not actually part of the tree, a view of a group of nodes
 * with one-way pointers to relevant nodes.
 */
var Range = Class(function(range) {
  range.init = function(first, last) {
    if (!arguments.length) return;
    this.first = first;
    this.last = last || first; //if only one argument, group of one
  };

  range.first = range.last = 0;

  range.each = function(fn) {
    for (var el = this.first; el !== this.last.next; el = el.next)
      if (fn.call(this, el) === false) break;

    return this;
  };

  range.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });
    return fold;
  };

  range.disown = function() {
    //parent & siblings no longer acknowledge our existence
    //Like Node::disown, relinks them around us,
    //tree remains well-formed, but this node still points
    //to its former parent and siblings
    //
    // [Jay] TODO: figure out how to do this with setNext and setPrev
    var self = this
      , first = this.first
      , last = this.last
    ;

    if (first.prev) first.prev.setNext(last.next);
    if (last.next)  last.next.setPrev(first.prev);

    // edge case: single-child parent
    if (!first.prev && !last.next) {
      self.parent.firstChild = self.parent.lastChild = 0;
    }

    return this;
  };

  range.adopt = function(parent, prev, next) {
    //adopt new parent and siblings
    //Like Node::adopt, links them to me and me to them,
    //but does not relink former parent & siblings, so if there
    //are any, must disown first or tree will become malformed.
    var self = this
      , first = self.first
      , last = self.last
    ;

    self.each(function(e) { e.parent = parent });
    first.setPrev(prev);
    last.setNext(next);

    return self;
  };
});
