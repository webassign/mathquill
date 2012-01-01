SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

SOURCES = \
	$(SRC_DIR)/tree.js \
	$(SRC_DIR)/roots.js \
	$(SRC_DIR)/commands.js \
	$(SRC_DIR)/symbols.js \
	$(SRC_DIR)/cursor.js \
	$(SRC_DIR)/public.js

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

# -*- Publishing tasks -*- #
.PHONY: publish
publish: clean all
	./script/publish
