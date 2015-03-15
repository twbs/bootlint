/*!
 * Bootlint - an HTML linter for Bootstrap projects
 * https://github.com/twbs/bootlint
 * Copyright (c) 2014-2015 Christopher Rebert
 * Licensed under the MIT License.
 */

/*eslint-env node */

var cheerio = require('cheerio');
var parseUrl = require('url').parse;
var semver = require('semver');
var voidElements = require('void-elements');
var _location = require('./location');
var LocationIndex = _location.LocationIndex;

(function (exports) {
    'use strict';
    var NUM_COLS = 12;
    var COL_REGEX = /\bcol-(xs|sm|md|lg)-(\d{1,2})\b/;
    var COL_REGEX_G = /\bcol-(xs|sm|md|lg)-(\d{1,2})\b/g;
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
    var MIN_JQUERY_VERSION = '1.9.1';// as of Bootstrap v3.3.0
    var CURRENT_BOOTSTRAP_VERSION = '3.3.4';
    var BOOTSTRAP_VERSION_4 = '4.0.0';
    var PLUGINS = [
        'affix',
        'alert',
        'button',
        'carousel',
        'collapse',
        'dropdown',
        'modal',
        'popover',
        'scrollspy',
        'tab',
        'tooltip'
    ];
    var BOOTSTRAP_FILES = [
        'link[rel="stylesheet"][href$="/bootstrap.css"]',
        'link[rel="stylesheet"][href="bootstrap.css"]',
        'link[rel="stylesheet"][href$="/bootstrap.min.css"]',
        'link[rel="stylesheet"][href="bootstrap.min.css"]',
        'script[src$="/bootstrap.js"]',
        'script[src="bootstrap.js"]',
        'script[src$="/bootstrap.min.js"]',
        'script[src="bootstrap.min.js"]'
    ].join(',');

    function compareNums(a, b) {
        return a - b;
    }

    function isDoctype(node) {
        return node.type === 'directive' && node.name === '!doctype';
    }

    var tagNameOf = IN_NODE_JS ? function (element) {
        return element.name.toUpperCase();
    } : function (element) {
        /* @covignore */
        return element.tagName.toUpperCase();
    };

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
     * @returns {string} The processed "class" attribute value
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
     * @returns {Array.<Array.<integer>>} Array of pairs of start and end values of runs
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

    /**
     * This function returns the browser window object, or null if this is not running in a browser environment.
     * @returns {(Window|null)}
     */
    function getBrowserWindowObject() {
        var theWindow = null;
        try {
            /*eslint-disable no-undef, block-scoped-var */
            theWindow = window;// jshint ignore:line
            /*eslint-enable no-undef, block-scoped-var */
        }
        catch (e) {
            // deliberately do nothing
        }

        return theWindow;
    }

    function versionsIn(strings) {
        return strings.map(function (str) {
            var match = str.match(/^\d+\.\d+\.\d+$/);
            return match ? match[0] : null;
        }).filter(function (match) {
            return match !== null;
        });
    }

    function versionInLinkedElement($, element) {
        var elem = $(element);
        var urlAttr = (tagNameOf(element) === 'LINK') ? 'href' : 'src';
        var pathSegments = parseUrl(elem.attr(urlAttr)).pathname.split('/');
        var versions = versionsIn(pathSegments);
        if (!versions.length) {
            return null;
        }
        var version = versions[versions.length - 1];
        return version;
    }

    function jqueryPluginVersions(jQuery) {
        /* @covignore */
        return PLUGINS.map(function (pluginName) {
            var plugin = jQuery.fn[pluginName];
            if (!plugin) {
                return undefined;
            }
            var constructor = plugin.Constructor;
            if (!constructor) {
                return undefined;
            }
            return constructor.VERSION;
        }).filter(function (version) {
            return version !== undefined;
        }).sort(semver.compare);
    }

    function bootstrapScriptsIn($) {
        var longhands = $('script[src*="bootstrap.js"]').filter(function (i, script) {
            var url = $(script).attr('src');
            var filename = filenameFromUrl(url);
            return filename === "bootstrap.js";
        });
        var minifieds = $('script[src*="bootstrap.min.js"]').filter(function (i, script) {
            var url = $(script).attr('src');
            var filename = filenameFromUrl(url);
            return filename === "bootstrap.min.js";
        });

        return {
            longhands: longhands,
            minifieds: minifieds
        };
    }

    /**
     * @param {integer} id Unique string ID for this type of lint error. Of the form "E###" (e.g. "E123").
     * @param {string} message Human-readable string describing the error
     * @param {jQuery} elements jQuery or Cheerio collection of referenced DOM elements pointing to all problem locations in the document
     * @class
     */
    function LintError(id, message, elements) {
        this.id = id;
        this.message = message;
        this.elements = elements || cheerio('');
    }
    exports.LintError = LintError;

    /**
     * @param {integer} id Unique string ID for this type of lint warning. Of the form "W###" (e.g. "W123").
     * @param {string} message Human-readable string describing the warning
     * @param {jQuery} elements jQuery or Cheerio collection of referenced DOM elements pointing to all problem locations in the document
     * @class
     */
    function LintWarning(id, message, elements) {
        this.id = id;
        this.message = message;
        this.elements = elements || cheerio('');
    }
    exports.LintWarning = LintWarning;

    var allLinters = {};
    function addLinter(id, linter) {
        if (allLinters[id]) {
            /* @covignore */
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
            /* @covignore */
            throw new Error("Invalid linter ID: " + id);
        }

        function linterWrapper($, reporter) {
            function specializedReporter(message, elements) {
                reporter(new Problem(id, message, elements));
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
            /* @covignore */
            return function lintDoctype($, reporter) {
                /*eslint-disable no-undef, block-scoped-var */
                var doc = window.document;// jshint ignore:line
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
            reporter('`<head>` is missing UTF-8 charset `<meta>` tag');
        }
        else if (charset.toLowerCase() !== "utf-8") {
            reporter('charset `<meta>` tag is specifying a legacy, non-UTF-8 charset', meta);
        }
    });
    addLinter("W002", function lintXUaCompatible($, reporter) {
        var meta = $([
            'head>meta[http-equiv="X-UA-Compatible"][content="IE=edge"]',
            'head>meta[http-equiv="x-ua-compatible"][content="ie=edge"]'
        ].join(','));
        if (!meta.length) {
            reporter("`<head>` is missing X-UA-Compatible `<meta>` tag that disables old IE compatibility modes");
        }
    });
    addLinter("W003", function lintViewport($, reporter) {
        var meta = $('head>meta[name="viewport"][content]');
        if (!meta.length) {
            reporter("`<head>` is missing viewport `<meta>` tag that enables responsiveness");
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
            reporter("Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes", spanNs);
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
            reporter("Found one or more `.row`s that were not children of a grid column or descendants of a `.container` or `.container-fluid`", rowsOutsideColumnsAndContainers);
        }
    });
    addLinter("E004", function lintNestedContainers($, reporter) {
        var nestedContainers = $('.container, .container-fluid').children('.container, .container-fluid');
        if (nestedContainers.length) {
            reporter("Containers (`.container` and `.container-fluid`) are not nestable", nestedContainers);
        }
    });
    addLinter("E005", function lintRowAndColOnSameElem($, reporter) {
        var selector = COL_CLASSES.map(function (col) {
            return ".row" + col;
        }).join(',');

        var rowCols = $(selector);
        if (rowCols.length) {
            reporter("Found both `.row` and `.col-*-*` used on the same element", rowCols);
        }
    });
    addLinter("W004", function lintRemoteModals($, reporter) {
        var remoteModalTriggers = $('[data-toggle="modal"][data-remote]');
        if (remoteModalTriggers.length) {
            reporter("Found one or more modals using the deprecated `remote` option", remoteModalTriggers);
        }
    });
    addLinter("W005", function lintJquery($, reporter) {
        var OLD_JQUERY = "Found what might be an outdated version of jQuery; Bootstrap requires jQuery v" + MIN_JQUERY_VERSION + " or higher";
        var NO_JQUERY_BUT_BS_JS = "Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work";
        var NO_JQUERY_NOR_BS_JS = "Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work; however, you might not be using Bootstrap's JavaScript";
        var bsScripts = bootstrapScriptsIn($);
        var hasBsJs = !!(bsScripts.minifieds.length || bsScripts.longhands.length);
        var theWindow = null;
        try {
            /*eslint-disable no-undef, block-scoped-var */
            theWindow = window;// jshint ignore:line
            /*eslint-enable no-undef, block-scoped-var */
        }
        catch (e) {
            // deliberately do nothing
        }
        /* @covignore */
        if (theWindow) {
            // check browser global jQuery
            var globaljQuery = theWindow.$ || theWindow.jQuery;
            if (globaljQuery) {
                var globalVersion = null;
                try {
                    globalVersion = globaljQuery.fn.jquery.split(' ')[0];
                }
                catch (e) {
                    // skip; not actually jQuery?
                }
                if (globalVersion) {
                    // pad out short version numbers (e.g. '1.7')
                    while (globalVersion.match(/\./g).length < 2) {
                        globalVersion += ".0";
                    }

                    var upToDate = null;
                    try {
                        upToDate = semver.gte(globalVersion, MIN_JQUERY_VERSION, true);
                    }
                    catch (e) {
                        // invalid version number
                    }
                    if (upToDate === false) {
                        reporter(OLD_JQUERY);
                    }
                    if (upToDate !== null) {
                        return;
                    }
                }
            }
        }

        // check for jQuery <script>s
        var jqueries = $([
            'script[src*="jquery"]',
            'script[src*="jQuery"]'
        ].join(','));
        if (!jqueries.length) {
            reporter(hasBsJs ? NO_JQUERY_BUT_BS_JS : NO_JQUERY_NOR_BS_JS);
            return;
        }
        jqueries.each(function () {
            var script = $(this);
            var pathSegments = parseUrl(script.attr('src')).pathname.split('/');
            var filename = pathSegments[pathSegments.length - 1];
            if (!/^j[qQ]uery(\.min)?\.js$/.test(filename)) {
                return;
            }
            var versions = versionsIn(pathSegments);
            if (!versions.length) {
                return;
            }
            var version = versions[versions.length - 1];
            if (!semver.gte(version, MIN_JQUERY_VERSION, true)) {
                reporter(OLD_JQUERY, script);
            }
        });
    });
    addLinter("E006", function lintInputGroupFormControlTypes($, reporter) {
        var selectInputGroups = $('.input-group select');
        if (selectInputGroups.length) {
            reporter("`.input-group` contains a `<select>`; this should be avoided as `<select>`s cannot be fully styled in WebKit browsers", selectInputGroups);
        }
        var textareaInputGroups = $('.input-group textarea');
        if (textareaInputGroups.length) {
            reporter("`.input-group` contains a `<textarea>`; only text-based `<input>`s are permitted in an `.input-group`", textareaInputGroups);
        }
    });
    addLinter("E007", function lintBootstrapJs($, reporter) {
        var scripts = bootstrapScriptsIn($);
        if (scripts.longhands.length && scripts.minifieds.length) {
            reporter("Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js", scripts.longhands.add(scripts.minifieds));
        }
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
                " put the disabled element inside a wrapper `<div>` and apply the tooltip or popover to the wrapper `<div>` instead.",
                disabledWithTooltips
            );
        }
    });
    addLinter("W008", function lintTooltipsInBtnGroups($, reporter) {
        var nonBodyContainers = $('.btn-group [data-toggle="tooltip"]:not([data-container="body"]), .btn-group [data-toggle="popover"]:not([data-container="body"])');
        if (nonBodyContainers.length) {
            reporter("Tooltips and popovers within button groups should have their `container` set to 'body'. Found tooltips/popovers that might lack this setting.", nonBodyContainers);
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
            reporter("Button and input sizing within `.input-group`s can cause issues. Instead, use input group sizing classes `.input-group-lg` or `.input-group-sm`", badInputGroupSizing);
        }
    });
    addLinter("E010", function lintMultipleFormControlsInInputGroup($, reporter) {
        var badInputGroups = $('.input-group').filter(function (i, inputGroup) {
            return $(inputGroup).find('.form-control').length > 1;
        });
        if (badInputGroups.length) {
            reporter("Input groups cannot contain multiple `.form-control`s", badInputGroups);
        }
    });
    addLinter("E011", function lintFormGroupMixedWithInputGroup($, reporter) {
        var badMixes = $('.input-group.form-group');
        if (badMixes.length) {
            reporter("`.input-group` and `.form-group` cannot be used directly on the same element. Instead, nest the `.input-group` within the `.form-group`", badMixes);
        }
    });
    addLinter("E012", function lintGridClassMixedWithInputGroup($, reporter) {
        var selector = COL_CLASSES.map(function (colClass) {
            return '.input-group' + colClass;
        }).join(',');

        var badMixes = $(selector);
        if (badMixes.length) {
            reporter("`.input-group` and `.col-*-*` cannot be used directly on the same element. Instead, nest the `.input-group` within the `.col-*-*`", badMixes);
        }
    });
    addLinter("E013", function lintRowChildrenAreCols($, reporter) {
        var ALLOWED_CHILDREN = COL_CLASSES.concat(['script', '.clearfix', '.bs-customizer-input']);
        var selector = '.row>*' + ALLOWED_CHILDREN.map(function (colClass) {
            return ':not(' + colClass + ')';
        }).join('');

        var nonColRowChildren = $(selector);
        if (nonColRowChildren.length) {
            reporter("Only columns (`.col-*-*`) may be children of `.row`s", nonColRowChildren);
        }
    });
    addLinter("E014", function lintColParentsAreRowsOrFormGroups($, reporter) {
        var selector = COL_CLASSES.map(function (colClass) {
            return '*:not(.row):not(.form-group)>' + colClass + ':not(col):not(th):not(td)';
        }).join(',');

        var colsOutsideRowsAndFormGroups = $(selector);
        if (colsOutsideRowsAndFormGroups.length) {
            reporter("Columns (`.col-*-*`) can only be children of `.row`s or `.form-group`s", colsOutsideRowsAndFormGroups);
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
            reporter("Having multiple add-ons on a single side of an input group is not supported", multipleAddOns);
        }
    });
    addLinter("E016", function lintBtnToggle($, reporter) {
        var badBtnToggle = $('.btn.dropdown-toggle ~ .btn');
        if (badBtnToggle.length) {
            reporter("`.btn.dropdown-toggle` must be the last button in a button group.", badBtnToggle);
        }
    });
    addLinter("W007", function lintBtnType($, reporter) {
        var badBtnType = $('button:not([type="submit"], [type="reset"], [type="button"])');
        if (badBtnType.length) {
            reporter("Found one or more `<button>`s missing a `type` attribute.", badBtnType);
        }
    });
    addLinter("E017", function lintBlockCheckboxes($, reporter) {
        var badCheckboxes = $('.checkbox').filter(function (i, div) {
            return $(div).filter(':has(>label>input[type="checkbox"])').length <= 0;
        });
        if (badCheckboxes.length) {
            reporter('Incorrect markup used with the `.checkbox` class. The correct markup structure is .checkbox>label>input[type="checkbox"]', badCheckboxes);
        }
    });
    addLinter("E018", function lintBlockRadios($, reporter) {
        var badRadios = $('.radio').filter(function (i, div) {
            return $(div).filter(':has(>label>input[type="radio"])').length <= 0;
        });
        if (badRadios.length) {
            reporter('Incorrect markup used with the `.radio` class. The correct markup structure is .radio>label>input[type="radio"]', badRadios);
        }
    });
    addLinter("E019", function lintInlineCheckboxes($, reporter) {
        var wrongElems = $('.checkbox-inline:not(label)');
        if (wrongElems.length) {
            reporter("`.checkbox-inline` should only be used on `<label>` elements", wrongElems);
        }
        var badStructures = $('.checkbox-inline').filter(function (i, label) {
            return $(label).children('input[type="checkbox"]').length <= 0;
        });
        if (badStructures.length) {
            reporter('Incorrect markup used with the `.checkbox-inline` class. The correct markup structure is label.checkbox-inline>input[type="checkbox"]', badStructures);
        }
    });
    addLinter("E020", function lintInlineRadios($, reporter) {
        var wrongElems = $('.radio-inline:not(label)');
        if (wrongElems.length) {
            reporter("`.radio-inline` should only be used on `<label>` elements", wrongElems);
        }
        var badStructures = $('.radio-inline').filter(function (i, label) {
            return $(label).children('input[type="radio"]').length <= 0;
        });
        if (badStructures.length) {
            reporter('Incorrect markup used with the `.radio-inline` class. The correct markup structure is label.radio-inline>input[type="radio"]', badStructures);
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
            reporter("`.active` class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin", mismatchedButtonInputs);
        }
    });
    addLinter("E022", function lintModalsWithinOtherComponents($, reporter) {
        var selector = [
          '.table .modal',
          '.navbar .modal'
        ].join(',');
        var badNestings = $(selector);
        if (badNestings.length) {
            reporter("Modal markup should not be placed within other components, so as to avoid the component's styles interfering with the modal's appearance or functionality", badNestings);
        }
    });
    addLinter("E023", function lintPanelBodyWithoutPanel($, reporter) {
        var badPanelBody = $('.panel-body').parent(':not(.panel, .panel-collapse)');
        if (badPanelBody.length) {
            reporter("`.panel-body` must have a `.panel` or `.panel-collapse` parent", badPanelBody);
        }
    });
    addLinter("E024", function lintPanelHeadingWithoutPanel($, reporter) {
        var badPanelHeading = $('.panel-heading').parent(':not(.panel)');
        if (badPanelHeading.length) {
            reporter("`.panel-heading` must have a `.panel` parent", badPanelHeading);
        }
    });
    addLinter("E025", function lintPanelFooterWithoutPanel($, reporter) {
        var badPanelFooter = $('.panel-footer').parent(':not(.panel, .panel-collapse)');
        if (badPanelFooter.length) {
            reporter("`.panel-footer` must have a `.panel` or `.panel-collapse` parent", badPanelFooter);
        }
    });
    addLinter("E026", function lintPanelTitleWithoutPanelHeading($, reporter) {
        var badPanelTitle = $('.panel-title').parent(':not(.panel-heading)');
        if (badPanelTitle.length) {
            reporter("`.panel-title` must have a `.panel-heading` parent", badPanelTitle);
        }
    });
    addLinter("E027", function lintTableResponsive($, reporter) {
        var badStructure = $('.table.table-responsive, table.table-responsive');
        if (badStructure.length) {
            reporter("`.table-responsive` is supposed to be used on the table's parent wrapper `<div>`, not on the table itself", badStructure);
        }
    });
    addLinter("E028", function lintFormControlFeedbackWithoutHasFeedback($, reporter) {
        var ancestorsMissingClasses = $('.form-control-feedback').filter(function () {
            return $(this).closest('.form-group.has-feedback').length !== 1;
        });
        if (ancestorsMissingClasses.length) {
            reporter("`.form-control-feedback` must have a `.form-group.has-feedback` ancestor", ancestorsMissingClasses);
        }
    });
    addLinter("E029", function lintRedundantColumnClasses($, reporter) {
        var columns = $(COL_CLASSES.join(','));
        columns.each(function (_index, col) {
            var column = $(col);
            var classes = column.attr('class');
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
            var oldClass = '`class="' + classes + '"`';
            var newClass = '`class="' + simplifiedClasses + '"`';
            reporter(
                "Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), " +
                oldClass + " is redundant and can be simplified to " + newClass,
                column
            );
        });
    });
    addLinter("E030", function lintSoloGlyphiconClasses($, reporter) {
        var missingGlyphiconClass = $('[class*="glyphicon-"]:not(.glyphicon):not(.glyphicon-class)').filter(function () {
            return /\bglyphicon-([a-zA-Z]+)\b/.test($(this).attr('class'));
        });
        if (missingGlyphiconClass.length) {
            reporter("Found elements with a `.glyphicon-*` class that were missing the additional required `.glyphicon` class.", missingGlyphiconClass);
        }
    });
    addLinter("E031", function lintGlyphiconOnNonEmptyElement($, reporter) {
        var glyphiconNotEmpty = $('.glyphicon:not(:empty)');
        if (glyphiconNotEmpty.length) {
            reporter("Glyphicon classes must only be used on elements that contain no text content and have no child elements.", glyphiconNotEmpty);
        }
    });
    addLinter("E032", function lintModalStructure($, reporter) {
        var elements;

        elements = $('.modal-dialog').parent(':not(.modal)');
        if (elements.length) {
            reporter("`.modal-dialog` must be a child of `.modal`", elements);
        }

        elements = $('.modal-content').parent(':not(.modal-dialog)');
        if (elements.length) {
            reporter("`.modal-content` must be a child of `.modal-dialog`", elements);
        }

        elements = $('.modal-header').parent(':not(.modal-content)');
        if (elements.length) {
            reporter("`.modal-header` must be a child of `.modal-content`", elements);
        }

        elements = $('.modal-body').parent(':not(.modal-content)');
        if (elements.length) {
            reporter("`.modal-body` must be a child of `.modal-content`", elements);
        }

        elements = $('.modal-footer').parent(':not(.modal-content)');
        if (elements.length) {
            reporter("`.modal-footer` must be a child of `.modal-content`", elements);
        }

        elements = $('.modal-title').parent(':not(.modal-header)');
        if (elements.length) {
            reporter("`.modal-title` must be a child of `.modal-header`", elements);
        }
    });
    addLinter("E033", function lintAlertMissingDismissible($, reporter) {
        var alertsMissingDismissible = $('.alert:not(.alert-dismissible):has([data-dismiss="alert"])');
        if (alertsMissingDismissible.length) {
            reporter('`.alert` with dismiss button must have class `.alert-dismissible`', alertsMissingDismissible);
        }
    });
    addLinter("E034", function lintAlertDismissStructure($, reporter) {
        var nonFirstChildCloses = $('.alert>.close:not(:first-child)');
        var closesPrecededByText = $('.alert>.close').filter(function () {
            var firstNode = $(this).parent().contents().eq(0);
            var firstNodeIsText = IN_NODE_JS ? firstNode[0].type === 'text' : firstNode[0].nodeType === 3;
            return !!(firstNodeIsText && firstNode.text().trim());
        });
        var problematicCloses = nonFirstChildCloses.add(closesPrecededByText);
        if (problematicCloses.length) {
            reporter('`.close` button for `.alert` must be the first element in the `.alert`', problematicCloses);
        }
    });
    addLinter("E035", function lintFormGroupWithFormClass($, reporter) {
        var badFormGroups = $('.form-group.form-inline, .form-group.form-horizontal');
        if (badFormGroups.length) {
            reporter('Neither `.form-inline` nor `.form-horizontal` should be used directly on a `.form-group`. Instead, nest the `.form-group` within the `.form-inline` or `.form-horizontal`', badFormGroups);
        }
    });
    addLinter("E036", function lintMultipleInputGroupButtons($, reporter) {
        $('.input-group-btn').each(function () {
            ['.btn:not(.dropdown-toggle)', '.dropdown-menu'].forEach(function (selector) {
                var elements = $(this).children(selector);
                if (elements.length > 1) {
                    reporter('Having multiple `' + selector.split(':')[0] + '`s inside of a single `.input-group-btn` is not supported', elements.slice(1));
                }
            }, this);
        });
    });
    addLinter("E037", function lintColZeros($, reporter) {
        var selector = SCREENS.map(function (screen) {
            return ".col-" + screen + "-0";
        }).join(',');
        var elements = $(selector);
        if (elements.length) {
            reporter("Column widths must be positive integers (and <= 12 by default). Found usage(s) of invalid nonexistent `.col-*-0` classes.", elements);
        }
    });
    addLinter("E038", function lintMediaPulls($, reporter) {
        var mediaPullsOutsideMedia = $('.media-left, .media-right').filter(function () {
            return !($(this).parent().closest('.media').length);
        });
        if (mediaPullsOutsideMedia.length) {
            reporter('`.media-left` and `.media-right` should not be used outside of `.media` objects.', mediaPullsOutsideMedia);
        }
    });
    addLinter("E039", function lintNavbarPulls($, reporter) {
        var navbarPullsOutsideNavbars = $('.navbar-left, .navbar-right').filter(function () {
            return !($(this).parent().closest('.navbar').length);
        });
        if (navbarPullsOutsideNavbars.length) {
            reporter('`.navbar-left` and `.navbar-right` should not be used outside of navbars.', navbarPullsOutsideNavbars);
        }
    });
    addLinter("E040", function lintModalHide($, reporter) {
        var modalsWithHide = $('.modal.hide');
        if (modalsWithHide.length) {
            reporter('`.hide` should not be used on `.modal` in Bootstrap v3.', modalsWithHide);
        }
    });
    addLinter("E041", function lintCarouselStructure($, reporter) {
        var carouselsWithWrongInners = $('.carousel').filter(function () {
            return $(this).children('.carousel-inner').length !== 1;
        });
        if (carouselsWithWrongInners.length) {
            reporter('`.carousel` must have exactly one `.carousel-inner` child.', carouselsWithWrongInners);
        }

        var innersWithWrongActiveItems = $('.carousel-inner').filter(function () {
            return $(this).children('.item.active').length !== 1;
        });
        if (innersWithWrongActiveItems.length) {
            reporter('`.carousel-inner` must have exactly one `.item.active` child.', innersWithWrongActiveItems);
        }
    });
    addLinter("W009", function lintEmptySpacerCols($, reporter) {
        var selector = COL_CLASSES.map(function (colClass) {
            return colClass + ':not(:last-child)';
        }).join(',');
        var columns = $(selector);
        columns.each(function (_index, col) {
            var column = $(col);
            var isVoidElement = voidElements[col.tagName.toLowerCase()];
            // can't just use :empty because :empty excludes nodes with all-whitespace text content
            var hasText = !!column.text().trim().length;
            var hasChildren = !!column.children(':first-child').length;
            if (hasChildren || hasText || isVoidElement) {
                return;
            }

            var colClasses = column.attr('class').split(/\s+/g).filter(function (klass) {
                return COL_REGEX.test(klass);
            });
            colClasses = sortedColumnClasses(colClasses.join(' ')).trim();

            var colRegex = new RegExp('\\b(col-)(' + SCREENS.join('|') + ')(-\\d+)\\b', 'g');
            var offsetClasses = colClasses.replace(colRegex, '$1$2-offset$3');

            reporter("Using empty spacer columns isn't necessary with Bootstrap's grid. So instead of having an empty grid column with " + '`class="' + colClasses + '"` , just add `class="' + offsetClasses + '"` to the next grid column.', column);
        });
    });
    addLinter("W010", function lintMediaPulls($, reporter) {
        var mediaPulls = $('.media>.pull-left, .media>.pull-right');
        if (mediaPulls.length) {
            reporter('Using `.pull-left` or `.pull-right` as part of the media object component is deprecated as of Bootstrap v3.3.0. Use `.media-left` or `.media-right` instead.', mediaPulls);
        }
    });
    addLinter("W012", function lintNavbarContainers($, reporter) {
        var navBars = $('.navbar');
        var containers = [
            '.container',
            '.container-fluid'
        ].join(',');
        navBars.each(function () {
            var navBar = $(this);
            var hasContainerChildren = !!navBar.children(containers).length;

            if (!hasContainerChildren) {
                reporter('`.container` or `.container-fluid` should be the first child inside of a `.navbar`', navBar);
            }
        });
    });
    addLinter("W013", function lintOutdatedBootstrap($, reporter) {
        var OUTDATED_BOOTSTRAP = "Bootstrap version might be outdated. Latest version is at least " + CURRENT_BOOTSTRAP_VERSION + " ; saw what appears to be usage of Bootstrap ";
        var theWindow = getBrowserWindowObject();
        var globaljQuery = theWindow && (theWindow.$ || theWindow.jQuery);
        /* @covignore */
        if (globaljQuery) {
            var versions = jqueryPluginVersions(globaljQuery);
            if (versions.length) {
                var minVersion = versions[0];
                if (semver.lt(minVersion, CURRENT_BOOTSTRAP_VERSION, true)) {
                    reporter(OUTDATED_BOOTSTRAP + minVersion);
                    return;
                }
            }
        }
        // check for Bootstrap <link>s and <script>s
        var bootstraps = $(BOOTSTRAP_FILES);
        bootstraps.each(function () {
            var version = versionInLinkedElement($, this);
            if (version === null) {
                return;
            }
            if (semver.lt(version, CURRENT_BOOTSTRAP_VERSION, true)) {
                reporter(OUTDATED_BOOTSTRAP + version, $(this));
            }
        });
    });
    addLinter("W014", function lintCarouselControls($, reporter) {
        var controls = $('.carousel-indicators > li, .carousel-control');
        controls.each(function (_index, cont) {
            var control = $(cont);
            var target = control.attr('href') || control.attr('data-target');
            var carousel = $(target);

            if (!carousel.length || carousel.is(':not(.carousel)')) {
                reporter('Carousel controls and indicators should use `href` or `data-target` to reference an element with class `.carousel`.', control);
            }
        });
    });
    addLinter("W015", function lintNewBootstrap($, reporter) {
        var FUTURE_VERSION_ERROR = "Detected what appears to be Bootstrap v4 or later. This version of Bootlint only supports Bootstrap v3.";
        var theWindow = getBrowserWindowObject();

        var globaljQuery = theWindow && (theWindow.$ || theWindow.jQuery);
        /* @covignore */
        if (globaljQuery) {
            var versions = jqueryPluginVersions(globaljQuery);
            if (versions.length) {
                var minVersion = versions[0];
                if (semver.gte(minVersion, BOOTSTRAP_VERSION_4, true)) {
                    reporter(FUTURE_VERSION_ERROR);
                    return;
                }
            }
        }
        // check for Bootstrap <link>s and <script>s
        var bootstraps = $(BOOTSTRAP_FILES);
        bootstraps.each(function () {
            var version = versionInLinkedElement($, this);
            if (version === null) {
                return;
            }
            if (semver.gte(version, BOOTSTRAP_VERSION_4, true)) {
                reporter(FUTURE_VERSION_ERROR, $(this));
            }
        });
    });

    exports._lint = function ($, reporter, disabledIdList, html) {
        var locationIndex = IN_NODE_JS ? new LocationIndex(html) : null;
        var reporterWrapper = IN_NODE_JS ? function (problem) {
            if (problem.elements) {
                problem.elements = problem.elements.each(function (i, element) {
                    if (element.startIndex !== undefined) {
                        var location = locationIndex.locationOf(element.startIndex);
                        if (location) {
                            element.startLocation = location;
                        }
                    }
                });
            }
            reporter(problem);
        } : reporter;

        var disabledIdSet = {};
        disabledIdList.forEach(function (disabledId) {
            disabledIdSet[disabledId] = true;
        });
        Object.keys(allLinters).sort().forEach(function (linterId) {
            if (!disabledIdSet[linterId]) {
                allLinters[linterId]($, reporterWrapper);
            }
        });
    };
    /**
     * @callback reporter
     * @param {LintWarning|LintError} problem A lint problem
     * @returns {undefined} Any return value is ignored.
     */

    if (IN_NODE_JS) {
        // cheerio; Node.js
        /**
         * Lints the given HTML.
         * @param {string} html The HTML to lint
         * @param {reporter} reporter Function to call with each lint problem
         * @param {string[]} disabledIds Array of string IDs of linters to disable
         * @returns {undefined} Nothing
         */
        exports.lintHtml = function (html, reporter, disabledIds) {
            var $ = cheerio.load(html, {withStartIndices: true});
            this._lint($, reporter, disabledIds, html);
        };
    }
    else {
        // jQuery; in-browser
        /* @covignore */
        (function () {
            var $ = cheerio;
            /**
             * Lints the HTML of the current document.
             * @param {reporter} reporter Function to call with each lint problem
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
             * @param {object} [alertOpts] Options object to configure alert()ing
             * @param {boolean} [alertOpts.hasProblems=true] Show one alert() when the first lint problem is found?
             * @param {boolean} [alertOpts.problemFree=true] Show one alert() at the end of linting if the page has no lint problems?
             * @returns {undefined} Nothing
             */
            exports.showLintReportForCurrentDocument = function (disabledIds, alertOpts) {
                alertOpts = alertOpts || {};
                var alertOnFirstProblem = alertOpts.hasProblems || alertOpts.hasProblems === undefined;
                var alertIfNoProblems = alertOpts.problemFree || alertOpts.problemFree === undefined;

                var seenLint = false;
                var errorCount = 0;
                var reporter = function (lint) {
                    var background = "background: #" + (lint.id[0] === "W" ? "f0ad4e" : "d9534f") + "; color: #ffffff;";
                    if (!seenLint) {
                        if (alertOnFirstProblem) {
                            /*eslint-disable no-alert, no-undef, block-scoped-var */
                            window.alert("bootlint found errors in this document! See the JavaScript console for details.");// jshint ignore:line
                            /*eslint-enable no-alert, no-undef, block-scoped-var */
                        }
                        seenLint = true;
                    }

                    if (!lint.elements.length) {
                        console.warn("bootlint: %c " + lint.id + " ", background, lint.message);
                    }
                    else {
                        console.warn("bootlint: %c " + lint.id + " ", background, lint.message + '\n', lint.elements);
                    }
                    errorCount++;
                };
                this.lintCurrentDocument(reporter, disabledIds);

                if (errorCount > 0) {
                    console.info("bootlint: For details, look up the lint problem IDs in the Bootlint wiki: https://github.com/twbs/bootlint/wiki");
                }
                else if (alertIfNoProblems) {
                    /*eslint-disable no-alert, no-undef, block-scoped-var */
                    window.alert("bootlint found no errors in this document.");// jshint ignore:line
                    /*eslint-enable no-alert, no-undef, block-scoped-var */
                }
            };
            /*eslint-disable no-undef, block-scoped-var */
            window.bootlint = exports;// jshint ignore:line
            /*eslint-enable no-undef, block-scoped-var */
        })();
    }
})(typeof exports === 'object' && exports || this);
