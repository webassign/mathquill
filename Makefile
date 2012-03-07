SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

SOURCES = \
	$(SRC_DIR)/vendor/pjs/src/p.js \
	$(SRC_DIR)/tree.js \

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(CSS_DIR)/*.less

BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
CLEAN += $(BUILD_JS) $(BUILD_CSS) $(UGLY_JS)

# -*- Build tasks -*- #
.PHONY: all
all: uglify css

.PHONY: uglify
uglify: $(UGLY_JS)

.PHONY: clean
clean:
	rm -rf $(CLEAN)

.PHONY: js
js: $(BUILD_JS) $(BUILD_CSS)

.PHONY: css
css: $(BUILD_CSS)

$(BUILD_JS): $(SOURCES) $(INTRO) $(OUTRO)
	cat $(INTRO) $(SOURCES) $(OUTRO) > $(BUILD_JS)

# pass DEV=1 to get a cleaner CSS output
ifeq ($(DEV), 1)
LESS_OPTS =
else
LESS_OPTS = -x
endif
$(BUILD_CSS): $(CSS_SOURCES)
	lessc $(LESS_OPTS) $(CSS_MAIN) > $@

$(UGLY_JS): $(BUILD_JS)
	uglifyjs $(BUILD_JS) > $(UGLY_JS)

# -*- Test tasks -*- #
UNIT_TESTS = ./test/unit/*.test.js
TEST_INTRO = ./test/unit/intro.js
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js

# NB: the unit tests get cat'ed inside the mathquill closure.
# that way they can test internal functionality.
$(BUILD_TEST): $(SOURCES) $(UNIT_TESTS) $(INTRO) $(OUTRO)
	cat $(INTRO) $(SOURCES) $(TEST_INTRO) $(UNIT_TESTS) $(OUTRO) > $(BUILD_TEST)

.PHONY: test
test: css $(BUILD_TEST)
	@echo "now open test/test.html in your browser to run the tests." >/dev/stderr

# -*- Publishing tasks -*- #
.PHONY: publish
publish: clean all
	./script/publish
