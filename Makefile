SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

SOURCES = \
	$(SRC_DIR)/vendor/pjs/src/p.js \
	$(SRC_DIR)/tree.js \
	# $(SRC_DIR)/roots.js \
	# $(SRC_DIR)/commands.js \
	# $(SRC_DIR)/symbols.js \
	# $(SRC_DIR)/cursor.js \
	# $(SRC_DIR)/public.js

SOURCE_CSS = $(SRC_DIR)/mathquill.css

BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
CLEAN += $(BUILD_DIR)

# -*- Build tasks -*- #
.PHONY: all
all: uglify css

.PHONY: uglify
uglify: $(UGLY_JS)

.PHONY: clean
clean:
	rm -r $(CLEAN)

.PHONY: js
js: $(BUILD_JS) $(BUILD_CSS)

.PHONY: css
css: $(BUILD_CSS)

$(BUILD_JS): $(BUILD_DIR) $(SOURCES) $(INTRO) $(OUTRO)
	cat $(INTRO) $(SOURCES) $(OUTRO) > $(BUILD_JS)

$(BUILD_CSS): $(BUILD_DIR) $(SOURCE_CSS)
	cp $(SOURCE_CSS) $(BUILD_CSS)

$(UGLY_JS): $(BUILD_JS)
	uglifyjs $(BUILD_JS) > $(UGLY_JS)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

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
