suite('Node', function() {
  var node;

  setup(function() {
    window.thing = this;
    node = create(Node);
  });

  test("it's a node", function() {
    assert.instanceOf(node, Node);
  });

  suite('#set{Next,Prev}', function() {
    test("#setNext with a node", function() {
      var next = create(Node);
      node.setNext(next);
      assert.equal(node.next, next);
      assert.equal(node, next.prev);
    });

    test("#setNext with 0 marks it as last", function() {
      node.parent = create(Node);
      node.setNext(0);
      assert.equal(node.next, 0);
      assert.equal(node, node.parent.lastChild);
    });

    test("#setPrev with a node", function() {
      var prev = create(Node);
      node.setPrev(prev);
      assert.equal(node.prev, prev);
      assert.equal(node, prev.next);
    });

    test("#setPrev with 0 marks it as first", function() {
      node.parent = create(Node);
      node.setPrev(0);
      assert.equal(node.prev, 0);
      assert.equal(node, node.parent.firstChild);
    });
  });

  suite('#adopt', function() {
    test('with siblings', function() {
      var prev = create(Node)
        , next = create(Node)
        , parent = create(Node);
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
      var next = create(Node)
        , parent = create(Node);

      node.adopt(parent, 0, next);
      assert.equal(node, parent.firstChild);
    });

    test('at the end', function() {
      var prev = create(Node)
        , parent = create(Node)
      ;

      node.adopt(parent, prev, 0);
      assert.equal(node, parent.lastChild);
    });

    test('by itself', function() {
      var parent = create(Node);

      node.adopt(parent, 0, 0);
      assert.equal(node, parent.firstChild);
      assert.equal(node, parent.lastChild);
    });
  });

  suite('#disown', function() {
    test('with siblings', function() {
      var prev = create(Node)
        , next = create(Node)
        , parent = create(Node);

      node.adopt(parent, prev, next);
      node.disown();

      assert.equal(next, prev.next);
      assert.equal(prev, next.prev);
    });

    test('at the start', function() {
      var next = create(Node)
        , parent = create(Node)
      ;

      next.adopt(parent, 0, 0);
      node.adopt(parent, 0, next);

      node.disown();
      assert.equal(0, next.prev);
      assert.equal(next, parent.firstChild);
    });

    test('at the end', function() {
      var prev = create(Node)
        , parent = create(Node)
      ;

      prev.adopt(parent, 0, 0);
      node.adopt(parent, prev, 0);
      node.disown();

      assert.equal(0, prev.next);
      assert.equal(prev, parent.lastChild);
    });

    test('by itself', function() {
      var parent = create(Node);

      node.adopt(parent, 0, 0);
      node.disown();

      assert.equal(0, parent.firstChild);
      assert.equal(0, parent.lastChild);
    });
  });
});
