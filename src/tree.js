/*************************************************
 * tree.js
 * Abstract base classes for tree nodes and views
 ************************************************/

/**
 * Node is the core virtual DOM tree node base class.
 * All other classes of tree nodes descend from it.
 */
var Node = P(function(node) {
  node.reset = function() {
    var self = this;
    self.parent =
    self.prev =
    self.next =
    self.firstChild =
    self.lastChild =
    0;
  };

  // set the defaults on the prototype
  node.reset();

  node.children = function() {
    return Range(this.firstChild, this.lastChild);
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
    Interstice(self.parent, self.prev, self.next).link();

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
    Interstice(this.parent, this, next).link();
    return this;
  };

  node.setPrev = function(prev) {
    Interstice(this.parent, prev, this).link();
    return this;
  };

  node.appendChild = function(child) {
    child.reset();
    Interstice(this, this.lastChild, child).link();
    this.lastChild = child;
    return this;
  };

  node.prependChild = function(child) {
    child.reset();
    Interstice(this, child, this.firstChild).link();
    this.firstChild = child;
    return this;
  };

  node.insertAfter = function(e) { return this.adopt(e.parent, e, e.next); };
  node.insertBefore = function(e) { return this.adopt(e.parent, e.prev, e); };

  node.appendTo  = function(e) { return this.adopt(e, e.lastChild, 0); };
  node.prependTo = function(e) { return this.adopt(e, 0, e.firstChild); };
  node.append  = function(e) { e.appendTo(this); return this; };
  node.prepend = function(e) { e.prependTo(this); return this; };
});

/**
 * An interstice between two nodes, a "location" in the
 * tree where a node can be inserted.
 * Not actually part of the tree, a view of an interstice
 * with one-way pointers to relevant nodes.
 */
var Interstice = P(function(interstice) {
  interstice.parent =
  interstice.prev =
  interstice.next = 0;

  interstice.init = interstice.insertAt = function(parent, prev, next) {
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

  interstice.after = function(el) {
    replaceWithElement(this, el);
    return this.insertAfter(el);
  };

  interstice.before = function(el) {
    replaceWithElement(this, el);
    return this.insertBefore(el);
  };

  interstice.link = function() {
    if (this.prev) {
      this.prev.next = this.next;
      this.prev.parent = this.parent;
    }
    else {
      this.parent.firstChild = this.next;
    }

    if (this.next) {
      this.next.prev = this.prev;
      this.next.parent = this.parent;
    }
    else {
      this.parent.lastChild = this.prev;
    }

    return this;
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
var Range = P(function(range) {
  range.init = function(first, last) {
    this.first = first;
    this.last = last || first; //if only one argument, group of one
  };

  range.first = range.last = 0;

  range.each = function(fn) {
    for (var el = this.first; el !== this.last.next; el = el.next) {
      try { fn.call(this, el); } catch(e) {
        if (e === 'break') break; else throw e;
      }
    }

    return this;
  };

  range.map = function(fn) {
    var out = [];
    this.each(function(e) { out.push(fn.call(this, e)); });

    return out;
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
    var self = this
      , first = this.first
      , last = this.last
    ;

    Interstice(self.parent, first.prev, last.next).link();

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
    // this will break if undefined.
    // Is there such a thing as an empty Range?  Or is that an Interstice?
    // perhaps it would make sense if a Range consisted of two Interstices?
    first.setPrev(prev);
    last.setNext(next);

    return self;
  };
});
