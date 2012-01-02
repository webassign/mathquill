suite('Interstice', function() {
  var interstice = create(Interstice);

  test('is an interstice', function() {
    assert.instanceOf(interstice, Interstice);
  });

  test('#insertBefore', function() {
    var parent = create(Node)
      , one = create(Node)
      , two = create(Node)
    ;

    parent.append(one).append(two)

    interstice.insertBefore(two);

    assert.equal(one, interstice.prev);
    assert.equal(two, interstice.next);
    assert.equal(parent, interstice.parent);
  });

  test('#insertAfter', function() {
    var parent = create(Node)
      , one = create(Node)
      , two = create(Node)
    ;

    parent.append(one).append(two)

    interstice.insertAfter(one);

    assert.equal(one, interstice.prev);
    assert.equal(two, interstice.next);
    assert.equal(parent, interstice.parent);
  });

  test('#appendTo', function() {
    var parent = create(Node)
      , child = create(Node)
    ;

    parent.append(child);

    interstice.appendTo(parent);

    assert.equal(parent, interstice.parent);
    assert.equal(0, interstice.next);
    assert.equal(child, interstice.prev);

    // doesn't modify other things
    assert.equal(child, parent.lastChild);
    assert.equal(0, child.next);
  });

  test('#prependTo', function() {
    var parent = create(Node)
      , child = create(Node)
    ;

    parent.append(child);

    interstice.prependTo(parent);
    assert.equal(parent, interstice.parent);
    assert.equal(0, interstice.prev);
    assert.equal(child, interstice.next);

    // doesn't modify other things
    assert.equal(child, parent.firstChild);
    assert.equal(0, child.prev);
  });
});
