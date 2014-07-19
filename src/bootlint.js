/*!
 * bootlint - an HTML linter for Bootstrap projects
 * https://github.com/cvrebert/bootlint
 * Copyright (c) 2014 Christopher Rebert
 * Licensed under the MIT License.
 */

var cheerio = require('cheerio');

(function (exports) {
    'use strict';
    var COL_CLASSES = [];
    var SCREENS = ['xs', 'sm', 'md', 'lg'];
    SCREENS.forEach(function (screen) {
        for (var n = 1; n <= 12; n++) {
            COL_CLASSES.push('.col-' + screen + '-' + n);
        }
    });

    function isDoctype(node) {
        return node.type === 'directive' && node.name === '!doctype';
    }

    exports.lintDoctype = function ($) {
        var doctype = $(':root')[0];
        while (doctype && !isDoctype(doctype)) {
            doctype = doctype.prev;
        }
        if (!doctype) {
            return "Document is missing a DOCTYPE declaration";
        }
        var doctypeId = doctype.data.toLowerCase();
        if (doctypeId !== '!doctype html' && doctypeId !== '!doctype html system "about:legacy-compat"') {
            return "Document declares a non-HTML5 DOCTYPE";
        }
        return null;
    };
    exports.lintMetaCharsetUtf8 = function ($) {
        var meta = $('head>meta[charset]');
        var charset = meta.attr('charset');
        if (!charset) {
            return '<head> is missing UTF-8 charset <meta> tag';
        }
        if (charset.toLowerCase() !== "utf-8") {
            return 'charset <meta> tag is specifying a legacy, non-UTF-8 charset';
        }
        return null;
    };
    exports.lintXUaCompatible = function ($) {
        var meta = $('head>meta[http-equiv="X-UA-Compatible"][content="IE=edge"]');
        if (!meta.length) {
            return "<head> is missing X-UA-Compatible <meta> tag that disables old IE compatibility modes";
        }
        return null;
    };
    exports.lintViewport = function ($) {
        var meta = $('head>meta[name="viewport"][content]');
        if (!meta.length) {
            return "<head> is missing viewport <meta> tag that enables responsiveness";
        }
        return null;
    };
    exports.lintBootstrapv2 = function ($) {
        var columnClasses = [];
        for (var n = 1; n <= 12; n++) {
            columnClasses.push('.span' + n);
        }
        var selector = columnClasses.join(',');
        var spanNs = $(selector);
        if (spanNs.length) {
            return "Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes";
        }
        return null;
    };
    exports.lintContainers = function ($) {
        var rowsOutsideContainers = $('*:not(.container):not(.container-fluid):not(.bs-example)>.row');
        if (rowsOutsideContainers.length) {
            return "Found one or more `.row`s that were not children of a `.container` or `.container-fluid`";
        }
        return null;
    };
    exports.lintRowAndColOnSameElem = function ($) {
        var selector = COL_CLASSES.map(function (col) { return ".row" + col; }).join(',');
        var rowCols = $(selector);
        if (rowCols.length) {
            return "Found both `.row` and `.col-*-*` used on the same element";
        }
        return null;
    };
    exports.lintRemoteModals = function ($) {
        var remoteModalTriggers = $('[data-toggle="modal"][data-remote]');
        if (remoteModalTriggers.length) {
            return "Found one or more modals using the deprecated `remote` option";
        }
        return null;
    };
    exports.lintJquery = function ($) {
        var theWindow = null;
        try {
            theWindow = window;
        }
        catch (e) {
            // deliberately do nothing
        }
        if (theWindow && (theWindow.$ || theWindow.jQuery)) {
            return null;
        }
        var jqueries = $('script[src*="jquery"],script[src*="jQuery"]');
        if (!jqueries.length) {
            return "Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work";
        }
        return null;
    };
    exports.lintInputGroupFormControlTypes = function ($) {
        var errs = [];
        var selectInputGroups = $('.input-group select');
        if (selectInputGroups.length) {
            errs.push("`.input-group` contains a <select>; this should be avoided as <select>s cannot be fully styled in WebKit browsers");
        }
        var textareaInputGroups = $('.input-group textarea');
        if (textareaInputGroups.length) {
            errs.push("`.input-group` contains a <textarea>; only text-based <input>s are permitted in an `.input-group`");
        }
        return errs;
    };
    exports.lintBootstrapJs = function ($) {
        if ($('script[src$="bootstrap.js"]').length && $('script[src$="bootstrap.min.js"]').length) {
            return "Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js";
        }
        return null;
    };
    exports.lintTooltipsOnDisabledElems = function ($) {
        var selector = [
            '[disabled][data-toggle="tooltip"]',
            '.disabled[data-toggle="tooltip"]',
            '[disabled][data-toggle="popover"]',
            '.disabled[data-toggle="popover"]'
        ].join(',');
        var disabledWithTooltips = $(selector);
        if (disabledWithTooltips.length) {
            return "Tooltips and popovers on disabled elements cannot be triggered by user interaction unless the element becomes enabled." +
                " To have tooltips and popovers be triggerable by the user even when their associated element is disabled," +
                " put the disabled element inside a wrapper <div> and apply the tooltip or popover to the wrapper <div> instead.";
        }
        return null;
    };
    exports.lintTooltipsInBtnGroups = function ($) {
        var nonBodyContainers = $('.btn-group [data-toggle="tooltip"]:not([data-container="body"]), .btn-group [data-toggle="popover"]:not([data-container="body"])');
        if (nonBodyContainers.length) {
            return "Tooltips and popovers within button groups should have their `container` set to 'body'. Found tooltips/popovers that might lack this setting.";
        }
        return null;
    };
    exports.lintMultipleFormControlsInInputGroup = function ($) {
        var badInputGroups = $('.input-group').filter(function (i, inputGroup) {
            return $(inputGroup).find('.form-control').length > 1;
        });
        if (badInputGroups.length) {
            return "Input groups cannot contain multiple `.form-control`s";
        }
        return null;
    };
    exports.lintFormGroupMixedWithInputGroup = function ($) {
        var badMixes = $('.input-group.form-group');
        if (badMixes.length) {
            return ".input-group and .form-group cannot be used directly on the same element. Instead, nest the .input-group within the .form-group";
        }
        return null;
    };
    exports.lintGridClassMixedWithInputGroup = function ($) {
        var selector = COL_CLASSES.map(function (colClass) { return '.input-group' + colClass; }).join(',');
        var badMixes = $(selector);
        if (badMixes.length) {
            return ".input-group and .col-*-* cannot be used directly on the same element. Instead, nest the .input-group within the .col-*-*";
        }
        return null;
    };
    exports.lintRowChildrenAreCols = function ($) {
        var ALLOWED_CHILD_CLASSES = COL_CLASSES.concat(['.clearfix', '.bs-customizer-input']);
        var selector = '.row>*' + ALLOWED_CHILD_CLASSES.map(function (colClass) { return ':not(' + colClass + ')'; }).join('');
        var nonColRowChildren = $(selector);
        if (nonColRowChildren.length) {
            return "Only columns (.col-*-*) may be children of `.row`s";
        }
        return null;
    };
    exports.lintInputGroupsWithMultipleAddOnsPerSide = function ($) {
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
            return "Having multiple add-ons on a single side of an input group is not supported";
        }
        return null;
    };
    exports.lintBlockCheckboxes = function ($) {
        var badCheckboxes = $('.checkbox').filter(function (i, div) {
            return $(div).filter(':has(>label>input[type="checkbox"])').length <= 0;
        });
        if (badCheckboxes.length) {
            return 'Incorrect markup used with the `.checkbox` class. The correct markup structure is .checkbox>label>input[type="checkbox"]';
        }
        return null;
    };
    exports.lintBlockRadios = function ($) {
        var badRadios = $('.radio').filter(function (i, div) {
            return $(div).filter(':has(>label>input[type="radio"])').length <= 0;
        });
        if (badRadios.length) {
            return 'Incorrect markup used with the `.radio` class. The correct markup structure is .radio>label>input[type="radio"]';
        }
        return null;
    };
    exports.lintInlineCheckboxes = function ($) {
        var errs = [];
        var wrongElems = $('.checkbox-inline:not(label)');
        if (wrongElems.length) {
            errs.push(".checkbox-inline should only be used on <label> elements");
        }
        var badStructures = $('.checkbox-inline').filter(function (i, label) {
            return $(label).children('input[type="checkbox"]').length <= 0;
        });
        if (badStructures.length) {
            errs.push('Incorrect markup used with the `.checkbox-inline` class. The correct markup structure is label.checkbox-inline>input[type="checkbox"]');
        }
        return errs;
    };
    exports.lintInlineRadios = function ($) {
        var errs = [];
        var wrongElems = $('.radio-inline:not(label)');
        if (wrongElems.length) {
            errs.push(".radio-inline should only be used on <label> elements");
        }
        var badStructures = $('.radio-inline').filter(function (i, label) {
            return $(label).children('input[type="radio"]').length <= 0;
        });
        if (badStructures.length) {
            errs.push('Incorrect markup used with the `.radio-inline` class. The correct markup structure is label.radio-inline>input[type="radio"]');
        }
        return errs;
    };
    exports.lintButtonsCheckedActive = function ($) {
        var selector = [
            '[data-toggle="buttons"]>label:not(.active)>input[type="checkbox"][checked]',
            '[data-toggle="buttons"]>label.active>input[type="checkbox"]:not([checked])',
            '[data-toggle="buttons"]>label:not(.active)>input[type="radio"][checked]',
            '[data-toggle="buttons"]>label.active>input[type="radio"]:not([checked])'
        ].join(',');
        var mismatchedButtonInputs = $(selector);
        if (mismatchedButtonInputs.length) {
            return ".active class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin";
        }
        return null;
    };
    exports.lintModalsWithinOtherComponents = function ($) {
        var badNestings = $('.table .modal');
        if (badNestings.length) {
            return "Modal markup should not be placed within other components, so as to avoid the component's styles interfering with the modal's appearance or functionality";
        }
        return null;
    };
    exports._lint = function ($) {
        var errs = [];
        errs.push(this.lintDoctype($));
        errs.push(this.lintMetaCharsetUtf8($));
        errs.push(this.lintXUaCompatible($));
        errs.push(this.lintBootstrapv2($));
        errs.push(this.lintContainers($));
        errs.push(this.lintViewport($));
        errs.push(this.lintRowAndColOnSameElem($));
        errs.push(this.lintRowChildrenAreCols($));
        errs.push(this.lintRemoteModals($));
        errs.push(this.lintJquery($));
        errs.push(this.lintBootstrapJs($));
        errs.push(this.lintTooltipsOnDisabledElems($));
        errs.push(this.lintTooltipsInBtnGroups($));
        errs.push(this.lintMultipleFormControlsInInputGroup($));
        errs.push(this.lintFormGroupMixedWithInputGroup($));
        errs.push(this.lintGridClassMixedWithInputGroup($));
        errs.push(this.lintInputGroupsWithMultipleAddOnsPerSide($));
        errs.push(this.lintBlockCheckboxes($));
        errs.push(this.lintBlockRadios($));
        errs.push(this.lintButtonsCheckedActive($));
        errs.push(this.lintModalsWithinOtherComponents($));
        errs = errs.concat(this.lintInputGroupFormControlTypes($));
        errs = errs.concat(this.lintInlineCheckboxes($));
        errs = errs.concat(this.lintInlineRadios($));
        errs = errs.filter(function (item) { return item !== null; });
        return errs;
    };
    if (cheerio.load) {
        // cheerio; Node.js
        exports.lintHtml = function (html) {
            var $ = cheerio.load(html);
            return this._lint($);
        };
    }
    else {
        // jQuery; in-browser
        (function () {
            var $ = cheerio;
            exports.lintCurrentDocument = function () {
                return this._lint($);
            };
            exports.showLintReportForCurrentDocument = function () {
                var errs = this.lintCurrentDocument();
                if (errs.length) {
                    window.alert("bootlint found errors in this document! See the JavaScript console for details.");
                    errs.forEach(function (err) {
                        console.warn("bootlint:", err);
                    });
                }
            };
            $(function () {
                exports.showLintReportForCurrentDocument();
            });
        })();
    }
}(typeof exports === 'object' && exports || this));
