suite('Range', function() {
  var range, n1, n2;

  setup(function() {
    n1 = Node();
    n2 = Node();
    range = Range(n1, n2);
  });

  test("it's a Range", function() {
    assert.instanceOf(range, Range);
  });

  suite("#init", function() {
    test("with two arguments", function() {
      var range = Range(n1, n2);
      assert.equal(range.first, n1);
      assert.equal(range.last,  n2);
    });

    test("with one argument", function() {
      var range = Range(n1);
      assert.equal(range.first, n1);
      assert.equal(range.last,  n1);
    });

    test("with no arguments", function() {
      var range = Range();
      assert.ok(!range.first);
      assert.ok(!range.last);
    });
  });

  suite('#each', function() {
    var node;
    setup(function() {
      node = Node()
        .appendChild(Node())
        .appendChild(Node())
        .appendChild(Node())
      ;
    });

    test('passes each member in to the function', function() {
      var results = [];
      node.children().each(function(e) {
        results.push(e);
      });

      assert.equal(3, results.length);
    });

    test('breaks when the string \'break\' is thrown', function() {
      node.firstChild.next.flag = true;
      results = [];
      node.children().each(function(e) {
        results.push(e);
        if (e.flag) throw 'break';
      });

      assert.equal(2, results.length);
    });

    // // pending
    // test('it bubbles up other errors', function() {
    //   var MyError = P(Error, function(e) {
    //     e.init = function() { Error.apply(this, arguments); };
    //   });
    //   assert.throws(function() {
    //     node.children().each(function(e) {
    //       throw (MyError('o noes'));
    //     });
    //   }, MyError);
    // });
  });

  suite('#adopt', function() {
    // TODO
  });

  suite('#disown', function() {
    // TODO
  });
});
