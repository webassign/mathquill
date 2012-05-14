/*********************************************
 * Root math elements with event delegation.
 ********************************************/
function createRoot(jQ, root, textbox, editable) {
  var contents = jQ.contents().detach();

  if (!textbox) {
    jQ.addClass('mathquill-rendered-math');
  }

  root.jQ = jQ.data(jQueryDataKey, {
    block: root,
    revert: function() {
      jQ.empty().unbind('.mathquill')
        .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
        .append(contents);
    }
  });

  var cursor = root.cursor = new Cursor(root);

  root.renderLatex(contents.text());

  //textarea stuff
  var textareaSpan = root.textarea = $('<span class="textarea"><textarea autocomplete="off" autocorrect="off" autocapitalize="none"></textarea></span>'),
    textarea = textareaSpan.children();

  /******
   * TODO [Han]: Document this
   */
  var textareaSelectionTimeout;
  root.selectionChanged = function() {
    if (textareaSelectionTimeout === undefined) {
      textareaSelectionTimeout = setTimeout(setTextareaSelection);
    }
    forceIERedraw(jQ[0]);
  };
  function setTextareaSelection() {
    textareaSelectionTimeout = undefined;
    var latex = cursor.selection ? '$'+cursor.selection.latex()+'$' : '';
    textarea.val(latex);
    if (latex) {
      textarea[0].selectionStart=0;
      textarea[0].selectionEnd=textarea[0].value.length;
    }
  }

  //prevent native selection except textarea
  jQ.bind('selectstart.mathquill', function(e) {
    if (e.target !== textarea[0]) e.preventDefault();
    e.stopPropagation();
  });

  //doubletop-to-select event handling
  if ( navigator.platform.match('iPad') || navigator.platform.match('iPhone') ) {
    jQ.doubletap(function(e){
      e.preventDefault();
      e = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e.originalEvent;
      if ( cursor.selection ) {
        var sel    = cursor.selection.jQ,
            bounds = sel.offset(),
            x      = e.pageX,
            y      = e.pageY;

        bounds.right  = bounds.left + sel.outerWidth();
        bounds.bottom = bounds.top + sel.outerHeight();

        if( x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom ) {
          ( x < bounds.left ) ? cursor.moveRight() : cursor.moveLeft();
          anticursor = new MathFragment(cursor.parent, cursor.prev, cursor.next);
          cursor.seek($(e.target), x, y);
          cursor.selectFrom( anticursor );
          return;
        }

        if ( !cursor.selection.prev && !cursor.selection.next ) {
          cursor.selectRight();
          return;
        }

        cursor.next = cursor.selection.next;
        cursor.prev = cursor.next.prev;

        while( cursor.next ) {
          var n = cursor.next;
          cursor.selectRight();
          if ( n.cmd.length > 1 || (cursor.next && cursor.next.cmd.length > 1) ) break;
        }

        if ( cursor.selection ) {
          cursor.prev = cursor.selection.prev;
          cursor.next = cursor.prev.next;
        }
        while( cursor.prev ) {  
          var p = cursor.prev;
          cursor.selectLeft();
          if ( p.cmd.length > 1 || (cursor.prev && cursor.prev.cmd.length > 1) ) break;
        }
      } else {
        cursor.seek( $(e.target), e.pageX, e.pageY );
        ( e.pageX < cursor.offset().left ) ? cursor.selectLeft() : cursor.selectRight(); 
      }

      if ( cursor.selection ) {
        cursor.next = cursor.selection.next;
        cursor.prev = cursor.next.prev;
      }

    }, function(e){}, 300);
  }

  //drag-to-select event handling
  var anticursor, blink = cursor.blink;
  jQ.bind('mousedown.mathquill', function(e) {
    function mousemove(e) {
      cursor.seek($(e.target), e.pageX, e.pageY);

      if (cursor.prev !== anticursor.prev
          || cursor.parent !== anticursor.parent) {
        cursor.selectFrom(anticursor);
      }

      return false;
    }

    // docmousemove is attached to the document, so that
    // selection still works when the mouse leaves the window.
    function docmousemove(e) {
      // [Han]: i delete the target because of the way seek works.
      // it will not move the mouse to the target, but will instead
      // just seek those X and Y coordinates.  If there is a target,
      // it will try to move the cursor to document, which will not work.
      // cursor.seek needs to be refactored.
      delete e.target;

      return mousemove(e);
    }

    function mouseup(e) {
      anticursor = undefined;
      cursor.blink = blink;
      if (!cursor.selection) {
        if (editable) {
          cursor.show();
        }
        else {
          textareaSpan.detach();
        }
      }

      // delete the mouse handlers now that we're not dragging anymore
      jQ.unbind('mousemove', mousemove);
      $(document).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
    }

    cursor.blink = $.noop;
    cursor.seek($(e.target), e.pageX, e.pageY);

    anticursor = new MathFragment(cursor.parent, cursor.prev, cursor.next);

    if (!editable) jQ.prepend(textareaSpan);

    jQ.mousemove(mousemove);
    $(document).mousemove(docmousemove).mouseup(mouseup);

    e.stopPropagation();
  });

  if (!editable) {
    jQ.bind('cut paste', false).bind('copy', setTextareaSelection)
      .prepend('<span class="selectable">$'+root.latex()+'$</span>');
    textarea.blur(function() {
      cursor.clearSelection();
      setTimeout(detach); //detaching during blur explodes in WebKit
    });
    function detach() {
      textareaSpan.detach();
    }
    return;
  }

  jQ.prepend(textareaSpan);

  //root CSS classes
  jQ.addClass('mathquill-editable');
  if (textbox)
    jQ.addClass('mathquill-textbox');

  //focus and blur handling
  textarea.focus(function(e) {
    if (!cursor.parent)
      cursor.appendTo(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged); //select textarea after focus
    }
    else
      cursor.show();
    e.stopPropagation();
  }).blur(function(e) {
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
    e.stopPropagation();
  });

  jQ.bind('focus.mathquill blur.mathquill', function(e) {
    textarea.trigger(e);
  }).bind('mousedown.mathquill', function() {
    setTimeout(focus);
  }).bind('click.mathquill', focus) //stupid Mobile Safari
  .blur();
  function focus() {
    textarea.focus();
  }

  //clipboard event handling
  jQ.bind('cut', function(e) {
    setTextareaSelection();

    if (cursor.selection) {
      setTimeout(function() {
        cursor.deleteSelection();
        cursor.redraw();
      });
    }

    e.stopPropagation();
  })
  .bind('copy', function(e) {
    setTextareaSelection();
    e.stopPropagation();
  })
  .bind('paste', function(e) {
    pasting = true;
    setTimeout(paste);
    e.stopPropagation();
  });

  function paste() {
    //FIXME HACK the parser in RootTextBlock needs to be moved to
    //Cursor::writeLatex or something so this'll work with MathQuill textboxes
    var latex = textarea.val();
    if (latex.slice(0,1) === '$' && latex.slice(-1) === '$') {
      latex = latex.slice(1, -1);
    }
    else {
      latex = '\\text{' + latex + '}';
    }
    cursor.writeLatex(latex).show();
    textarea.val('');
    pasting = false;
  }

  //keyboard events and text input, see Wiki page "Keyboard Events"
  var lastKeydn, lastKeydnHappened, lastKeypressWhich, pasting = false;
  jQ.bind('keydown.mathquill', function(e) {
    lastKeydn = e;
    lastKeydnHappened = true;
    if (cursor.parent.keydown(e) === false)
      e.preventDefault();
  }).bind('keypress.mathquill', function(e) {
    if (lastKeydnHappened)
      lastKeydnHappened = false;
    else {
      //there's two ways keypress might be triggered without a keydown happening first:
      if (lastKeypressWhich !== e.which)
        //all browsers do that if this textarea is given focus during the keydown of
        //a different focusable element, i.e. by that element's keydown event handler.
        //No way of knowing original keydown, so ignore this keypress
        return;
      else
        //some browsers do that when auto-repeating key events, replay the keydown
        cursor.parent.keydown(lastKeydn);
    }
    lastKeypressWhich = e.which;

    //make sure setTextareaSelection() doesn't happen before textInput(), where we
    //check if any text was typed
    if (textareaSelectionTimeout !== undefined)
      clearTimeout(textareaSelectionTimeout);

    //after keypress event, trigger virtual textInput event if text was
    //input to textarea
    setTimeout(textInput);
  });

  function textInput() {
    if (pasting || (
      'selectionStart' in textarea[0]
      && textarea[0].selectionStart !== textarea[0].selectionEnd
    )) return;
    var text = textarea.val();
    if (text) {
      textarea.val('');
      // sanitize the input
      text = text.replace(/[^a-z0-9.!+\-=*/{}[\]()|<,>^_ ]/gi, '');
      if ( !text ) return;
      for (var i = 0; i < text.length; i += 1) {
        cursor.parent.textInput(text.charAt(i));
      }
      checkKeywords();
      checkTrig();
    }
    else {
      if (cursor.selection || textareaSelectionTimeout !== undefined)
        setTextareaSelection();
    }
  }
  
  /**
   * Converts existing trig methods into their respective arc and hyperbolic versions
   * when a user types an 'a' or 'h'
   */
  function checkTrig() {
  	var prev = cursor.prev.prev;
  	var next = cursor.next;
  	if ( prev && cursor.prev.cmd == 'h' && prev.jQ.hasClass('trig') && !prev.cmd.match(/h$/) ) {
  		cursor.backspace().backspace().writeLatex(prev.cmd + 'h').show();
  	}
  	else if ( next && cursor.prev.cmd == 'a' && next.jQ.hasClass('trig') && !next.cmd.match(/^a/) ) {
  		cursor.backspace().deleteForward().writeLatex('\\a' + next.cmd.substr(1)).show();
  	}
  }
  
  /**
     * Analyzes the characters surrounding the cursor to check if any keywords can be substituted
     */
  function checkKeywords() {
    var prefix = '',
        suffix = '',
        c      = cursor;
    // do not apply keywords when within a latex command input element
    if( cursor.parent && cursor.parent.jQ.hasClass('latex-command-input') ) {
        return;
    }
    
    // from the current cursor position, gather all preceding characters in the expression
    // until we reach a non-character ( frac, sqrt, sub, greek, etc )
    while( prefix.length < MAX_KEYWORD_LENGTH && c.prev && c.prev.cmd.length == 1 ) {
      prefix = c.prev.cmd + prefix;
      c = c.prev;
    }
    // from the current cursor position, gather all following characters in the expression
    // until we reach a non-character 
    c = cursor;
    while( suffix.length < MAX_KEYWORD_LENGTH-1 && c.next && c.next.cmd.length == 1 ) {
      suffix += c.next.cmd;
      c = c.next;
    }
     
    var search = prefix + suffix; 
    // loop over the keywords ( should be sorted in ascending length order ) and check the search string
    // against the keywords.
    for( var i = Keywords.length; --i >= 0; ) {
      var keyword = Keywords[i];
      // if the search string is shorter than the keyword, we can stop looking
      if( keyword.cmd.length > search.length ) return;
      
      // check for the index of the keyword in the search string
      var start = search.indexOf( keyword.cmd );
      
      // start should be a positive number if the keyword was found in the search string
      if( start >= 0 ) {
        var skip = false;
        // the current keyword might be a substring of a longer keyword that is in progress,
        // if so we should skip the keyword until the user has entered more data
        for( var j = i; --j >= 0; ) {
        	// see the current keyword is a substring of any longer keywords
            var conflict = Keywords[j].cmd.indexOf(keyword.cmd);
            // if the short keyword is a part of the longer keyword and the characters from 0 to matched-index are
            // also present in the user input, then we should NOT use the shorter keyword.  
            if( conflict >= 1 && search.indexOf( Keywords[j].cmd.substr(0, conflict + keyword.cmd.length ) ) >= 0 ) {
                skip = true;
            }
        }
        if( skip ) continue;
        // move the cursor to the beginning of the keyword
        for( var j = prefix.length-start; --j >= 0; ) {
          cursor.moveLeft();
        }
        // select as many characters as there are in the keyword
        for( var j = 0; j < keyword.cmd.length; j++ ) {
          cursor.selectRight();
        }
        // overwrite the keyword with the latex of the keyword
        cursor.writeLatex(keyword.latex).show();
      
        break;
      }
    }
  }
}

function RootMathBlock(){}
_ = RootMathBlock.prototype = new MathBlock;
_.latex = function() {
  return MathBlock.prototype.latex.call(this).replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
};
_.text = function() {
  return this.foldChildren('', function(text, child) {
    return text + child.text();
  });
};
_.renderLatex = function(latex) {
  this.jQ.children().slice(1).remove();
  this.firstChild = this.lastChild = 0;

  // temporarily take the element out of the displayed DOM
  // while we add stuff to it.
  //var placeholder = $('<span>');
  //this.jQ.replaceWith(placeholder);
  this.cursor.appendTo(this).writeLatex(latex);
  //placeholder.replaceWith(this.jQ);

  // XXX HACK ALERT
  //this.jQ.mathquill('redraw');
  this.blur();
};
_.keydown = function(e)
{
  e.ctrlKey = e.ctrlKey || e.metaKey;
  switch ((e.originalEvent && e.originalEvent.keyIdentifier) || e.which) {
  case 8: //backspace
  case 'Backspace':
  case 'U+0008':
    if (e.ctrlKey)
      while (this.cursor.prev || this.cursor.selection)
        this.cursor.backspace();
    else
      this.cursor.backspace();
    break;
  case 27: //may as well be the same as tab until we figure out what to do with it
  case 'Esc':
  case 'U+001B':
  case 9: //tab
  case 'Tab':
  case 'U+0009':
    if (e.ctrlKey) break;

    var parent = this.cursor.parent;
    if (e.shiftKey) { //shift+Tab = go one block left if it exists, else escape left.
      if (parent === this.cursor.root) //cursor is in root editable, continue default
        return this.skipTextInput = true;
      else if (parent.prev) //go one block left
        this.cursor.appendTo(parent.prev);
      else //get out of the block
        this.cursor.insertBefore(parent.parent);
    }
    else { //plain Tab = go one block right if it exists, else escape right.
      if (parent === this.cursor.root) //cursor is in root editable, continue default
        return this.skipTextInput = true;
      else if (parent.next) //go one block right
        this.cursor.prependTo(parent.next);
      else //get out of the block
        this.cursor.insertAfter(parent.parent);
    }

    this.cursor.clearSelection();
    break;
  case 13: //enter
  case 'Enter':
    break;
  case 35: //end
  case 'End':
    if (e.shiftKey)
      while (this.cursor.next || (e.ctrlKey && this.cursor.parent !== this))
        this.cursor.selectRight();
    else //move to the end of the root block or the current block.
      this.cursor.clearSelection().appendTo(e.ctrlKey ? this : this.cursor.parent);
    break;
  case 36: //home
  case 'Home':
    if (e.shiftKey)
      while (this.cursor.prev || (e.ctrlKey && this.cursor.parent !== this))
        this.cursor.selectLeft();
    else //move to the start of the root block or the current block.
      this.cursor.clearSelection().prependTo(e.ctrlKey ? this : this.cursor.parent);
    break;
  case 37: //left
  case 'Left':
    if (e.ctrlKey) break;

    if (e.shiftKey)
      this.cursor.selectLeft();
    else
      this.cursor.moveLeft();
    break;
  case 38: //up
  case 'Up':
    if (e.ctrlKey) break;

    if (e.shiftKey) {
      if (this.cursor.prev)
        while (this.cursor.prev)
          this.cursor.selectLeft();
      else
        this.cursor.selectLeft();
    }
    else if (this.cursor.parent.prev)
      this.cursor.clearSelection().appendTo(this.cursor.parent.prev);
    else if (this.cursor.prev)
      this.cursor.clearSelection().prependTo(this.cursor.parent);
    else if (this.cursor.parent !== this)
      this.cursor.clearSelection().insertBefore(this.cursor.parent.parent);
    break;
  case 39: //right
  case 'Right':
    if (e.ctrlKey) break;

    if (e.shiftKey)
      this.cursor.selectRight();
    else
      this.cursor.moveRight();
    break;
  case 40: //down
  case 'Down':
    if (e.ctrlKey) break;

    if (e.shiftKey) {
      if (this.cursor.next)
        while (this.cursor.next)
          this.cursor.selectRight();
      else
        this.cursor.selectRight();
    }
    else if (this.cursor.parent.next)
      this.cursor.clearSelection().prependTo(this.cursor.parent.next);
    else if (this.cursor.next)
      this.cursor.clearSelection().appendTo(this.cursor.parent);
    else if (this.cursor.parent !== this)
      this.cursor.clearSelection().insertAfter(this.cursor.parent.parent);
    break;
  case 46: //delete
  case 'Del':
  case 'U+007F':
    if (e.ctrlKey)
      while (this.cursor.next || this.cursor.selection)
        this.cursor.deleteForward();
    else
      this.cursor.deleteForward();
    break;
  case 65: //the 'A' key, as in Ctrl+A Select All
  case 'A':
  case 'U+0041':
    if (e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (this !== this.cursor.root) //so not stopPropagation'd at RootMathCommand
        return this.parent.keydown(e);

      this.cursor.clearSelection().appendTo(this);
      while (this.cursor.prev)
        this.cursor.selectLeft();
      break;
    }
  default:
    this.skipTextInput = false;
    return true;
  }
  this.skipTextInput = true;
  return false;
};
_.textInput = function(ch) {
  if (!this.skipTextInput)
    this.cursor.write(ch);
};

function RootMathCommand(cursor) {
  this.init('$');
  this.firstChild.cursor = cursor;
  this.firstChild.textInput = function(ch) {
    if (this.skipTextInput) return;

    if (ch !== '$' || cursor.parent !== this)
      cursor.write(ch);
    else if (this.isEmpty()) {
      cursor.insertAfter(this.parent).backspace()
        .insertNew(new VanillaSymbol('\\$','$')).show();
    }
    else if (!cursor.next)
      cursor.insertAfter(this.parent);
    else if (!cursor.prev)
      cursor.insertBefore(this.parent);
    else
      cursor.write(ch);
  };
}
_ = RootMathCommand.prototype = new MathCommand;
_.html_template = ['<span class="mathquill-rendered-math"></span>'];
_.initBlocks = function() {
  this.firstChild =
  this.lastChild =
  this.jQ.data(jQueryDataKey).block =
    new RootMathBlock;

  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ;
};
_.latex = function() {
  return '$' + this.firstChild.latex() + '$';
};

function RootTextBlock(){}
_ = RootTextBlock.prototype = new MathBlock;
_.renderLatex = function(latex) {
  var self = this, cursor = self.cursor;
  self.jQ.children().slice(1).remove();
  self.firstChild = self.lastChild = 0;
  cursor.show().appendTo(self);

  latex = latex.match(/(?:\\\$|[^$])+|\$(?:\\\$|[^$])*\$|\$(?:\\\$|[^$])*$/g) || '';
  for (var i = 0; i < latex.length; i += 1) {
    var chunk = latex[i];
    if (chunk[0] === '$') {
      if (chunk[-1+chunk.length] === '$' && chunk[-2+chunk.length] !== '\\')
        chunk = chunk.slice(1, -1);
      else
        chunk = chunk.slice(1);

      var root = new RootMathCommand(cursor);
      cursor.insertNew(root);
      root.firstChild.renderLatex(chunk);
      cursor.show().insertAfter(root);
    }
    else {
      for (var j = 0; j < chunk.length; j += 1)
        this.cursor.insertNew(new VanillaSymbol(chunk[j]));
    }
  }
};
_.keydown = RootMathBlock.prototype.keydown;
_.textInput = function(ch) {
  if (this.skipTextInput) return;

  this.cursor.deleteSelection();
  if (ch === '$')
    this.cursor.insertNew(new RootMathCommand(this.cursor));
  else
    this.cursor.insertNew(new VanillaSymbol(ch));
};

