suite('Node', function() {
  var node;

  setup(function() {
    node = Node();
  });

  // helper method to assert a prev/next chain.
  function assertSequence(/* args... */) {
    var one, two;
    for (var i = 1, len = arguments.length; i < len; i += 1) {
      one = arguments[i-1]; two = arguments[i];
      assert.equal(two, one.next);
      assert.equal(one, two.prev);
    }
  }

  test("it's a node", function() {
    assert.instanceOf(node, Node);
  });

  suite('#set{Next,Prev}', function() {
    test("#setNext with a node", function() {
      var next = Node();
      node.setNext(next);
      assertSequence(node, next);
    });

    test("#setNext with 0 marks it as last", function() {
      node.parent = Node();
      node.setNext(0);
      assert.ok(!node.next);
      assert.equal(node, node.parent.lastChild);
    });

    test("#setPrev with a node", function() {
      var prev = Node();
      node.setPrev(prev);
      assertSequence(prev, node);
    });

    test("#setPrev with 0 marks it as first", function() {
      node.parent = Node();
      node.setPrev(0);
      assert.ok(!node.prev);
      assert.equal(node, node.parent.firstChild);
    });
  });

  suite('sugary methods', function() {
    test("#appendTo", function() {
      var one = Node()
        , two = Node()
      ;

      one.appendTo(node);
      assert.equal(one, node.firstChild);
      assert.equal(one, node.lastChild);
      assert.equal(node, one.parent);
      assert.ok(!one.prev);
      assert.ok(!one.next);

      two.appendTo(node);
      assert.equal(one, node.firstChild);
      assert.equal(two, node.lastChild);
      assert.equal(node, two.parent);
      assertSequence(one, two);
      assert.ok(!two.next);
    });

    test("#prependTo", function() {
      var one = Node()
        , two = Node()
      ;

      two.prependTo(node);
      assert.equal(two, node.lastChild);
      assert.equal(two, node.firstChild);
      assert.equal(node, two.parent);
      assert.ok(!two.prev);
      assert.ok(!two.next);

      one.prependTo(node);
      assert.equal(one, node.firstChild);
      assert.equal(two, node.lastChild);
      assert.equal(node, two.parent);
      assertSequence(one, two);
      assert.ok(!one.prev);
    });

    test('#insertAfter', function() {
      var parent = Node()
        , one = Node()
        , two = Node()
      ;

      parent.append(one).append(two);
      node.insertAfter(one);

      assertSequence(one, node, two);
    });

    test('#insertBefore', function() {
      var parent = Node()
        , one = Node()
        , two = Node()
      ;

      parent.append(one).append(two);
      node.insertBefore(two);

      assertSequence(one, node, two);
    });
  });

  suite('#adopt', function() {
    test('with siblings', function() {
      var prev = Node()
        , next = Node()
        , parent = Node();
      ;

      node.adopt(parent, prev, next);

      // sets immediate relations
      assert.equal(parent, node.parent)
      assert.equal(next, node.next)
      assert.equal(prev, node.prev);

      // sets secondary relations
      assert.equal(node, next.prev);
      assert.equal(node, prev.next);
    });

    test('at the start', function() {
      var next = Node()
        , parent = Node();

      node.adopt(parent, 0, next);
      assert.equal(node, parent.firstChild);
    });

    test('at the end', function() {
      var prev = Node()
        , parent = Node()
      ;

      node.adopt(parent, prev, 0);
      assert.equal(node, parent.lastChild);
    });

    test('by itself', function() {
      var parent = Node();

      node.adopt(parent, 0, 0);
      assert.equal(node, parent.firstChild);
      assert.equal(node, parent.lastChild);
    });
  });

  suite('#disown', function() {
    test('with siblings', function() {
      var prev = Node()
        , next = Node()
        , parent = Node();

      node.adopt(parent, prev, next);
      node.disown();

      assert.equal(next, prev.next);
      assert.equal(prev, next.prev);
    });

    test('at the start', function() {
      var next = Node()
        , parent = Node()
      ;

      next.adopt(parent, 0, 0);
      node.adopt(parent, 0, next);

      node.disown();
      assert.equal(0, next.prev);
      assert.equal(next, parent.firstChild);
    });

    test('at the end', function() {
      var prev = Node()
        , parent = Node()
      ;

      prev.adopt(parent, 0, 0);
      node.adopt(parent, prev, 0);
      node.disown();

      assert.equal(0, prev.next);
      assert.equal(prev, parent.lastChild);
    });

    test('by itself', function() {
      var parent = Node();

      node.adopt(parent, 0, 0);
      node.disown();

      assert.ok(!parent.firstChild);
      assert.ok(!parent.lastChild);
    });
  });
});
