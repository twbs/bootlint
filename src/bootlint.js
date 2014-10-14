/*!
 * Bootlint - an HTML linter for Bootstrap projects
 * https://github.com/twbs/bootlint
 * Copyright (c) 2014 Christopher Rebert
 * Licensed under the MIT License.
 */

/*eslint-env node */

var cheerio = require('cheerio');

(function (exports) {
    'use strict';
    var NUM_COLS = 12;
    var COL_REGEX = /\bcol-(xs|sm|md|lg)-(\d{0,2})\b/;
    var COL_REGEX_G = /\bcol-(xs|sm|md|lg)-(\d{0,2})\b/g;
    var COL_CLASSES = [];
    var SCREENS = ['xs', 'sm', 'md', 'lg'];
    SCREENS.forEach(function (screen) {
        for (var n = 1; n <= NUM_COLS; n++) {
            COL_CLASSES.push('.col-' + screen + '-' + n);
        }
    });
    var SCREEN2NUM = {
        'xs': 0,
        'sm': 1,
        'md': 2,
        'lg': 3
    };
    var NUM2SCREEN = ['xs', 'sm', 'md', 'lg'];
    var IN_NODE_JS = !!(cheerio.load);

    function compareNums(a, b) {
        return a - b;
    }

    function isDoctype(node) {
        return node.type === 'directive' && node.name === '!doctype';
    }

    function filenameFromUrl(url) {
        var filename = url.replace(/[#?].*$/, ''); // strip querystring & fragment ID
        var lastSlash = filename.lastIndexOf('/');
        if (lastSlash !== -1) {
            filename = filename.slice(lastSlash + 1);
        }
        return filename;
    }

    function withoutClass(classes, klass) {
        return classes.replace(new RegExp('\\b' + klass + '\\b', 'g'), '');
    }

    function columnClassKey(colClass) {
        return SCREEN2NUM[COL_REGEX.exec(colClass)[1]];
    }

    function compareColumnClasses(a, b) {
        return columnClassKey(a) - columnClassKey(b);
    }

    /**
     * Moves any grid column classes to the end of the class string and sorts the grid classes by ascending screen size.
     * @param {string} classes The "class" attribute of a DOM node
     * @returns {string}
     */
    function sortedColumnClasses(classes) {
        // extract column classes
        var colClasses = [];
        while (true) {
            var match = COL_REGEX.exec(classes);
            if (!match) {
                break;
            }
            var colClass = match[0];
            colClasses.push(colClass);
            classes = withoutClass(classes, colClass);
        }

        colClasses.sort(compareColumnClasses);
        return classes + ' ' + colClasses.join(' ');
    }

    /**
     * @param {string} classes The "class" attribute of a DOM node
     * @returns {Object.<string, integer[]>} Object mapping grid column widths (1 thru 12) to sorted arrays of screen size numbers (see SCREEN2NUM)
     *      Widths not used in the classes will not have an entry in the object.
     */
    function width2screensFor(classes) {
        var width = null;
        var width2screens = {};
        while (true) {
            var match = COL_REGEX_G.exec(classes);
            if (!match) {
                break;
            }
            var screen = match[1];
            width = match[2];
            var screens = width2screens[width];
            if (!screens) {
                screens = width2screens[width] = [];
            }
            screens.push(SCREEN2NUM[screen]);
        }

        for (width in width2screens) {
            if (width2screens.hasOwnProperty(width)) {
                width2screens[width].sort(compareNums);
            }
        }

        return width2screens;
    }

    /**
     * Given a sorted array of integers, this finds all contiguous runs where each item is incremented by 1 from the next.
     * For example:
     *      [0, 2, 3, 5] has one such run: [2, 3]
     *      [0, 2, 3, 4, 6, 8, 9, 11] has two such runs: [2, 3, 4], [8, 9]
     *      [0, 2, 4] has no runs.
     * @param {integer[]} list Sorted array of integers
     * @returns {integer[][]} Array of pairs of start and end values of runs
     */
    function incrementingRunsFrom(list) {
        list = list.concat([Infinity]);// use Infinity to ensure any nontrivial (length >= 2) run ends before the end of the loop
        var runs = [];
        var start = null;
        var prev = null;
        for (var i = 0; i < list.length; i++) {
            var current = list[i];
            if (start === null) {
                // first element starts a trivial run
                start = current;
            }
            else if (prev + 1 !== current) {
                // run ended
                if (start !== prev) {
                    // run is nontrivial
                    runs.push([start, prev]);
                }
                // start new run
                start = current;
            }
            // else: the run continues

            prev = current;
        }
        return runs;
    }

    function LintError(id, message) {
        this.id = id;
        this.message = message;
    }
    exports.LintError = LintError;

    function LintWarning(id, message) {
        this.id = id;
        this.message = message;
    }
    exports.LintWarning = LintWarning;

    var allLinters = {};
    function addLinter(id, linter) {
        if (allLinters[id]) {
            throw new Error("Linter already registered with ID: " + id);
        }

        var Problem = null;
        if (id[0] === 'E') {
            Problem = LintError;
        }
        else if (id[0] === 'W') {
            Problem = LintWarning;
        }
        else {
            throw new Error("Invalid linter ID: " + id);
        }

        function linterWrapper($, reporter) {
            function specializedReporter(message) {
                reporter(new Problem(id, message));
            }

            linter($, specializedReporter);
        }

        linterWrapper.id = id;
        allLinters[id] = linterWrapper;
    }


    addLinter("E001", (function () {
        var MISSING_DOCTYPE = "Document is missing a DOCTYPE declaration";
        var NON_HTML5_DOCTYPE = "Document declares a non-HTML5 DOCTYPE";
        if (IN_NODE_JS) {
            return function lintDoctype($, reporter) {
                var doctype = $(':root')[0];
                while (doctype && !isDoctype(doctype)) {
                    doctype = doctype.prev;
                }
                if (!doctype) {
                    reporter(MISSING_DOCTYPE);
                    return;
                }
                var doctypeId = doctype.data.toLowerCase();
                if (doctypeId !== '!doctype html' && doctypeId !== '!doctype html system "about:legacy-compat"') {
                    reporter(NON_HTML5_DOCTYPE);
                }
            };
        }
        else {
            return function lintDoctype($, reporter) {
                /*eslint-disable no-undef, block-scoped-var */
                var doc = window.document;
                /*eslint-enable un-undef, block-scoped-var */
                if (doc.doctype === null) {
                    reporter(MISSING_DOCTYPE);
                }
                else if (doc.doctype.publicId) {
                    reporter(NON_HTML5_DOCTYPE);
                }
                else if (doc.doctype.systemId && doc.doctype.systemId !== "about:legacy-compat") {
                    reporter(NON_HTML5_DOCTYPE);
                }
            };
        }
    })());
    addLinter("W001", function lintMetaCharsetUtf8($, reporter) {
        var meta = $('head>meta[charset]');
        var charset = meta.attr('charset');
        if (!charset) {
            reporter('<head> is missing UTF-8 charset <meta> tag');
        }
        else if (charset.toLowerCase() !== "utf-8") {
            reporter('charset <meta> tag is specifying a legacy, non-UTF-8 charset');
        }
    });
    addLinter("W002", function lintXUaCompatible($, reporter) {
        var meta = $('head>meta[http-equiv="X-UA-Compatible"][content="IE=edge"]');
        if (!meta.length) {
            reporter("<head> is missing X-UA-Compatible <meta> tag that disables old IE compatibility modes");
        }
    });
    addLinter("W003", function lintViewport($, reporter) {
        var meta = $('head>meta[name="viewport"][content]');
        if (!meta.length) {
            reporter("<head> is missing viewport <meta> tag that enables responsiveness");
        }
    });
    addLinter("E002", function lintBootstrapv2($, reporter) {
        var columnClasses = [];
        for (var n = 1; n <= 12; n++) {
            columnClasses.push('.span' + n);
        }
        var selector = columnClasses.join(',');
        var spanNs = $(selector);
        if (spanNs.length) {
            reporter("Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes");
        }
    });
    addLinter("E003", function lintContainers($, reporter) {
        var notAnyColClass = COL_CLASSES.map(function (colClass) {
            return ':not(' + colClass + ')';
        }).join('');
        var selector = '*' + notAnyColClass + '>.row';
        var rowsOutsideColumns = $(selector);
        var rowsOutsideColumnsAndContainers = rowsOutsideColumns.filter(function () {
            var parent = $(this).parent();
            while (parent.length) {
                if (parent.is('.container, .container-fluid')) {
                    return false;
                }
                parent = $(parent).parent();
            }
            return true;
        });
        if (rowsOutsideColumnsAndContainers.length) {
            reporter("Found one or more `.row`s that were not children of a grid column or descendants of a `.container` or `.container-fluid`");
        }
    });
    addLinter("E004", function lintNestedContainers($, reporter) {
        var nestedContainers = $('.container, .container-fluid').children('.container, .container-fluid');
        if (nestedContainers.length) {
            reporter("Containers (`.container` and `.container-fluid`) are not nestable");
        }
    });
    addLinter("E005", function lintRowAndColOnSameElem($, reporter) {
        var selector = COL_CLASSES.map(function (col) {
            return ".row" + col;
        }).join(',');

        var rowCols = $(selector);
        if (rowCols.length) {
            reporter("Found both `.row` and `.col-*-*` used on the same element");
        }
    });
    addLinter("W004", function lintRemoteModals($, reporter) {
        var remoteModalTriggers = $('[data-toggle="modal"][data-remote]');
        if (remoteModalTriggers.length) {
            reporter("Found one or more modals using the deprecated `remote` option");
        }
    });
    addLinter("W005", function lintJquery($, reporter) {
        var theWindow = null;
        try {
            /*eslint-disable no-undef, block-scoped-var */
            theWindow = window;
            /*eslint-enable no-undef, block-scoped-var */
        }
        catch (e) {
            // deliberately do nothing
        }
        if (theWindow && (theWindow.$ || theWindow.jQuery)) {
            return;
        }
        var jqueries = $('script[src*="jquery"],script[src*="jQuery"]');
        if (!jqueries.length) {
            reporter("Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work");
        }
    });
    addLinter("E006", function lintInputGroupFormControlTypes($, reporter) {
        var selectInputGroups = $('.input-group select');
        if (selectInputGroups.length) {
            reporter("`.input-group` contains a <select>; this should be avoided as <select>s cannot be fully styled in WebKit browsers");
        }
        var textareaInputGroups = $('.input-group textarea');
        if (textareaInputGroups.length) {
            reporter("`.input-group` contains a <textarea>; only text-based <input>s are permitted in an `.input-group`");
        }
    });
    addLinter("E007", function lintBootstrapJs($, reporter) {
        var longhands = $('script[src*="bootstrap.js"]').filter(function (i, script) {
            var url = $(script).attr('src');
            var filename = filenameFromUrl(url);
            return filename === "bootstrap.js";
        });
        if (!longhands.length) {
            return;
        }
        var minifieds = $('script[src*="bootstrap.min.js"]').filter(function (i, script) {
            var url = $(script).attr('src');
            var filename = filenameFromUrl(url);
            return filename === "bootstrap.min.js";
        });
        if (!minifieds.length) {
            return;
        }

        reporter("Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js");
    });
    addLinter("W006", function lintTooltipsOnDisabledElems($, reporter) {
        var selector = [
            '[disabled][data-toggle="tooltip"]',
            '.disabled[data-toggle="tooltip"]',
            '[disabled][data-toggle="popover"]',
            '.disabled[data-toggle="popover"]'
        ].join(',');
        var disabledWithTooltips = $(selector);
        if (disabledWithTooltips.length) {
            reporter(
                "Tooltips and popovers on disabled elements cannot be triggered by user interaction unless the element becomes enabled." +
                " To have tooltips and popovers be triggerable by the user even when their associated element is disabled," +
                " put the disabled element inside a wrapper <div> and apply the tooltip or popover to the wrapper <div> instead."
            );
        }
    });
    addLinter("W008", function lintTooltipsInBtnGroups($, reporter) {
        var nonBodyContainers = $('.btn-group [data-toggle="tooltip"]:not([data-container="body"]), .btn-group [data-toggle="popover"]:not([data-container="body"])');
        if (nonBodyContainers.length) {
            reporter("Tooltips and popovers within button groups should have their `container` set to 'body'. Found tooltips/popovers that might lack this setting.");
        }
    });
    addLinter("E009", function lintMissingInputGroupSizes($, reporter) {
        var selector = [
            '.input-group:not(.input-group-lg) .btn-lg',
            '.input-group:not(.input-group-lg) .input-lg',
            '.input-group:not(.input-group-sm) .btn-sm',
            '.input-group:not(.input-group-sm) .input-sm'
        ].join(',');
        var badInputGroupSizing = $(selector);
        if (badInputGroupSizing.length) {
            reporter("Button and input sizing within `.input-group`s can cause issues. Instead, use input group sizing classes `.input-group-lg` or `.input-group-sm`");
        }
    });
    addLinter("E010", function lintMultipleFormControlsInInputGroup($, reporter) {
        var badInputGroups = $('.input-group').filter(function (i, inputGroup) {
            return $(inputGroup).find('.form-control').length > 1;
        });
        if (badInputGroups.length) {
            reporter("Input groups cannot contain multiple `.form-control`s");
        }
    });
    addLinter("E011", function lintFormGroupMixedWithInputGroup($, reporter) {
        var badMixes = $('.input-group.form-group');
        if (badMixes.length) {
            reporter(".input-group and .form-group cannot be used directly on the same element. Instead, nest the .input-group within the .form-group");
        }
    });
    addLinter("E012", function lintGridClassMixedWithInputGroup($, reporter) {
        var selector = COL_CLASSES.map(function (colClass) {
            return '.input-group' + colClass;
        }).join(',');

        var badMixes = $(selector);
        if (badMixes.length) {
            reporter(".input-group and .col-*-* cannot be used directly on the same element. Instead, nest the .input-group within the .col-*-*");
        }
    });
    addLinter("E013", function lintRowChildrenAreCols($, reporter) {
        var ALLOWED_CHILD_CLASSES = COL_CLASSES.concat(['.clearfix', '.bs-customizer-input']);
        var selector = '.row>*' + ALLOWED_CHILD_CLASSES.map(function (colClass) {
            return ':not(' + colClass + ')';
        }).join('');

        var nonColRowChildren = $(selector);
        if (nonColRowChildren.length) {
            reporter("Only columns (.col-*-*) may be children of `.row`s");
        }
    });
    addLinter("E014", function lintColParentsAreRowsOrFormGroups($, reporter) {
        var selector = COL_CLASSES.map(function (colClass) {
            return '*:not(.row):not(.form-group)>' + colClass + ':not(col):not(th):not(td)';
        }).join(',');

        var colsOutsideRowsAndFormGroups = $(selector);
        if (colsOutsideRowsAndFormGroups.length) {
            reporter("Columns (.col-*-*) can only be children of `.row`s or `.form-group`s");
        }
    });
    addLinter("E015", function lintInputGroupsWithMultipleAddOnsPerSide($, reporter) {
        var addOnClasses = ['.input-group-addon', '.input-group-btn'];
        var combos = [];
        addOnClasses.forEach(function (first) {
            addOnClasses.forEach(function (second) {
                combos.push('.input-group>' + first + '+' + second);
            });
        });
        var selector = combos.join(',');
        var multipleAddOns = $(selector);
        if (multipleAddOns.length) {
            reporter("Having multiple add-ons on a single side of an input group is not supported");
        }
    });
    addLinter("E016", function lintBtnToggle($, reporter) {
        var badBtnToggle = $('.btn.dropdown-toggle ~ .btn');
        if (badBtnToggle.length) {
            reporter("`.btn.dropdown-toggle` must be the last button in a button group.");
        }
    });
    addLinter("W007", function lintBtnType($, reporter) {
        var badBtnType = $('button:not([type="submit"], [type="reset"], [type="button"])');
        if (badBtnType.length) {
            reporter("Found one or more `<button>`s missing a `type` attribute.");
        }
    });
    addLinter("E017", function lintBlockCheckboxes($, reporter) {
        var badCheckboxes = $('.checkbox').filter(function (i, div) {
            return $(div).filter(':has(>label>input[type="checkbox"])').length <= 0;
        });
        if (badCheckboxes.length) {
            reporter('Incorrect markup used with the `.checkbox` class. The correct markup structure is .checkbox>label>input[type="checkbox"]');
        }
    });
    addLinter("E018", function lintBlockRadios($, reporter) {
        var badRadios = $('.radio').filter(function (i, div) {
            return $(div).filter(':has(>label>input[type="radio"])').length <= 0;
        });
        if (badRadios.length) {
            reporter('Incorrect markup used with the `.radio` class. The correct markup structure is .radio>label>input[type="radio"]');
        }
    });
    addLinter("E019", function lintInlineCheckboxes($, reporter) {
        var wrongElems = $('.checkbox-inline:not(label)');
        if (wrongElems.length) {
            reporter(".checkbox-inline should only be used on <label> elements");
        }
        var badStructures = $('.checkbox-inline').filter(function (i, label) {
            return $(label).children('input[type="checkbox"]').length <= 0;
        });
        if (badStructures.length) {
            reporter('Incorrect markup used with the `.checkbox-inline` class. The correct markup structure is label.checkbox-inline>input[type="checkbox"]');
        }
    });
    addLinter("E020", function lintInlineRadios($, reporter) {
        var wrongElems = $('.radio-inline:not(label)');
        if (wrongElems.length) {
            reporter(".radio-inline should only be used on <label> elements");
        }
        var badStructures = $('.radio-inline').filter(function (i, label) {
            return $(label).children('input[type="radio"]').length <= 0;
        });
        if (badStructures.length) {
            reporter('Incorrect markup used with the `.radio-inline` class. The correct markup structure is label.radio-inline>input[type="radio"]');
        }
    });
    addLinter("E021", function lintButtonsCheckedActive($, reporter) {
        var selector = [
            '[data-toggle="buttons"]>label:not(.active)>input[type="checkbox"][checked]',
            '[data-toggle="buttons"]>label.active>input[type="checkbox"]:not([checked])',
            '[data-toggle="buttons"]>label:not(.active)>input[type="radio"][checked]',
            '[data-toggle="buttons"]>label.active>input[type="radio"]:not([checked])'
        ].join(',');
        var mismatchedButtonInputs = $(selector);
        if (mismatchedButtonInputs.length) {
            reporter(".active class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin");
        }
    });
    addLinter("E022", function lintModalsWithinOtherComponents($, reporter) {
        var badNestings = $('.table .modal');
        if (badNestings.length) {
            reporter("Modal markup should not be placed within other components, so as to avoid the component's styles interfering with the modal's appearance or functionality");
        }
    });
    addLinter("E023", function lintPanelBodyWithoutPanel($, reporter) {
        var badPanelBody = $('.panel-body').parent(':not(.panel, .panel-collapse)');
        if (badPanelBody.length) {
            reporter("`.panel-body` must have a `.panel` or `.panel-collapse` parent");
        }
    });
    addLinter("E024", function lintPanelHeadingWithoutPanel($, reporter) {
        var badPanelHeading = $('.panel-heading').parent(':not(.panel)');
        if (badPanelHeading.length) {
            reporter("`.panel-heading` must have a `.panel` parent");
        }
    });
    addLinter("E025", function lintPanelFooterWithoutPanel($, reporter) {
        var badPanelFooter = $('.panel-footer').parent(':not(.panel, .panel-collapse)');
        if (badPanelFooter.length) {
            reporter("`.panel-footer` must have a `.panel` or `.panel-collapse` parent");
        }
    });
    addLinter("E026", function lintPanelTitleWithoutPanelHeading($, reporter) {
        var badPanelTitle = $('.panel-title').parent(':not(.panel-heading)');
        if (badPanelTitle.length) {
            reporter("`.panel-title` must have a `.panel-heading` parent");
        }
    });
    addLinter("E027", function lintTableResponsive($, reporter) {
        var badStructure = $('.table.table-responsive,table.table-responsive');
        if (badStructure.length) {
            reporter("`.table-responsive` is supposed to be used on the table's parent wrapper <div>, not on the table itself");
        }
    });
    addLinter("E028", function lintFormControlFeedbackWithoutHasFeedback($, reporter) {
        var ancestorsMissingClasses = $('.form-control-feedback').filter(function () {
            return $(this).closest('.form-group.has-feedback').length !== 1;
        });
        if (ancestorsMissingClasses.length) {
            reporter("`.form-control-feedback` must have a `.form-group.has-feedback` ancestor");
        }
    });
    addLinter("E029", function lintRedundantColumnClasses($, reporter) {
        var columns = $(COL_CLASSES.join(','));
        columns.each(function (_index, column) {
            var classes = $(column).attr('class');
            var simplifiedClasses = classes;
            var width2screens = width2screensFor(classes);
            var isRedundant = false;
            for (var width = 1; width <= NUM_COLS; width++) {
                var screens = width2screens[width];
                if (!screens) {
                    continue;
                }
                var runs = incrementingRunsFrom(screens);
                if (!runs.length) {
                    continue;
                }

                isRedundant = true;

                for (var i = 0; i < runs.length; i++) {
                    var run = runs[i];
                    var min = run[0];
                    var max = run[1];

                    // remove redundant classes
                    for (var screenNum = min + 1; screenNum <= max; screenNum++) {
                        var colClass = 'col-' + NUM2SCREEN[screenNum] + '-' + width;
                        simplifiedClasses = withoutClass(simplifiedClasses, colClass);
                    }
                }
            }
            if (!isRedundant) {
                return;
            }

            simplifiedClasses = sortedColumnClasses(simplifiedClasses);
            simplifiedClasses = simplifiedClasses.replace(/ {2,}/g, ' ').trim();
            var oldClass = 'class="' + classes + '"';
            var newClass = 'class="' + simplifiedClasses + '"';
            reporter(
                "Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), " +
                oldClass + " is redundant and can be simplified to " + newClass
            );
        });
    });
    addLinter("E030", function lintSoloGlyphiconClasses($, reporter) {
        var missingGlyphiconClass = $('[class*="glyphicon-"]:not(.glyphicon):not(.glyphicon-class)').filter(function () {
            return /\bglyphicon-([a-zA-Z]+)\b/.test($(this).attr('class'));
        });
        if (missingGlyphiconClass.length) {
            reporter("Found elements with a .glyphicon-* class that were missing the additional required .glyphicon class.");
        }
    });
    addLinter("E031", function lintGlyphiconOnNonEmptyElement($, reporter) {
        if ($('.glyphicon:not(:empty)').length) {
            reporter("Glyphicon classes must only be used on elements that contain no text content and have no child elements.");
        }
    });
    addLinter("E032", function lintModalStructure($, reporter) {
        if ($('.modal-dialog').parent(':not(.modal)').length) {
            reporter(".modal-dialog must be a child of .modal");
        }
        if ($('.modal-content').parent(':not(.modal-dialog)').length) {
            reporter(".modal-content must be a child of .modal-dialog");
        }

        if ($('.modal-header').parent(':not(.modal-content)').length) {
            reporter(".modal-header must be a child of .modal-content");
        }
        if ($('.modal-body').parent(':not(.modal-content)').length) {
            reporter(".modal-body must be a child of .modal-content");
        }
        if ($('.modal-footer').parent(':not(.modal-content)').length) {
            reporter(".modal-footer must be a child of .modal-content");
        }

        if ($('.modal-title').parent(':not(.modal-header)').length) {
            reporter(".modal-title must be a child of .modal-header");
        }
    });

    exports._lint = function ($, reporter, disabledIdList) {
        var disabledIdSet = {};
        disabledIdList.forEach(function (disabledId) {
            disabledIdSet[disabledId] = true;
        });
        Object.keys(allLinters).sort().forEach(function (linterId) {
            if (!disabledIdSet[linterId]) {
                allLinters[linterId]($, reporter);
            }
        });
    };
    if (IN_NODE_JS) {
        // cheerio; Node.js
        /**
         * Lints the given HTML.
         * @param {string} html The HTML to lint
         * @param reporter Function to call with each lint problem
         * @param {string[]} disabledIds Array of string IDs of linters to disable
         * @returns {undefined} Nothing
         */
        exports.lintHtml = function (html, reporter, disabledIds) {
            var $ = cheerio.load(html);
            this._lint($, reporter, disabledIds);
        };
    }
    else {
        // jQuery; in-browser
        (function () {
            var $ = cheerio;
            /**
             * Lints the HTML of the current document.
             * @param reporter Function to call with each lint problem
             * @param {string[]} disabledIds Array of string IDs of linters to disable
             * @returns {undefined} Nothing
             */
            exports.lintCurrentDocument = function (reporter, disabledIds) {
                this._lint($, reporter, disabledIds);
            };
            /**
             * Lints the HTML of the current document.
             * If there are any lint warnings, one general notification message will be window.alert()-ed to the user.
             * Each warning will be output individually using console.warn().
             * @param {string[]} disabledIds Array of string IDs of linters to disable
             * @returns {undefined} Nothing
             */
            exports.showLintReportForCurrentDocument = function (disabledIds) {
                var seenLint = false;
                var reporter = function (lint) {
                    var background = "background: #" + (lint.id[0] === "W" ? "f0ad4e" : "d9534f") + "; color: #ffffff;";
                    if (!seenLint) {
                        /*eslint-disable no-alert, no-undef, block-scoped-var */
                        window.alert("bootlint found errors in this document! See the JavaScript console for details.");
                        /*eslint-enable no-alert, no-undef, block-scoped-var */
                        seenLint = true;
                    }
                    console.warn("bootlint: %c " + lint.id + " ", background, lint.message);
                };
                this.lintCurrentDocument(reporter, disabledIds);
            };
            /*eslint-disable no-undef, block-scoped-var */
            window.bootlint = exports;
            /*eslint-enable no-undef, block-scoped-var */
            $(function () {
                exports.showLintReportForCurrentDocument([]);
            });
        })();
    }
})(typeof exports === 'object' && exports || this);
