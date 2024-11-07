import virtEquals from './Helpers/virtEquals.js';
import virtHashCode from './Helpers/virtHashCode.js';
import ObjectIterator from './Helpers/ObjectIterator.js';
import PConstants from './Helpers/PConstants.js';
import ArrayList from './Objects/ArrayList.js';
import HashMap from './Objects/HashMap.js';
import PVector from './Objects/PVector.js';
import PFont from './Objects/PFont.js';
import Char from './Objects/Char.js';
import XMLAttribute from './Objects/XMLAttribute.js';
import XMLElement from './Objects/XMLElement.js';
import PMatrix2D from './Objects/PMatrix2D.js';
import PMatrix3D from './Objects/PMatrix3D.js';
import PShape from './Objects/PShape.js';
import colors from './Objects/webcolors.js';
import PShapeSVG from './Objects/PShapeSVG.js';
import CommonFunctions from './P5Functions/commonFunctions.js';
import defaultScope from './Helpers/defaultScope.js';
import Processing from './Processing.js';
import setupParser from './Parser/Parser.js';
import finalize from './Helpers/finalizeProcessing.js';
import { Live2D } from './Live2D/Live2D.js';

// Base source files
var source = {
  virtEquals,
  virtHashCode,
  ObjectIterator,
  PConstants,
  ArrayList,
  HashMap,
  PVector,
  PFont,
  Char,
  XMLAttribute,
  XMLElement,
  PMatrix2D,
  PMatrix3D,
  PShape,
  colors,
  PShapeSVG,
  CommonFunctions,
  defaultScope,
  Processing,
  setupParser,
  finalize,
  Live2D
};

// Additional code that gets tacked onto "p" during
// instantiation of a Processing sketch.
import withMath from './P5Functions/Math.js';
import withProxyFunctions from './P5Functions/JavaProxyFunctions.js';
const withProxyFunctionsFn = withProxyFunctions(source.virtHashCode, source.virtEquals);
import withTouch from './P5Functions/touchmouse.js';

source.extend = {
  withMath: withMath,
  withProxyFunctions: withProxyFunctionsFn,
  withTouch: withTouch,
  withCommonFunctions: source.CommonFunctions().withCommonFunctions
};

/**
 * Processing.js building function
 */
function buildProcessingJS(Browser, testHarness) {
  var noop = function(){},
      virtEquals = source.virtEquals,
      virtHashCode = source.virtHashCode,
      PConstants = source.PConstants,
      CommonFunctions = source.CommonFunctions,
      ObjectIterator = source.ObjectIterator,
      Char = source.Char,
      XMLAttribute = source.XMLAttribute(),

      ArrayList = source.ArrayList({
        virtHashCode: virtHashCode,
        virtEquals: virtEquals
      }),

      HashMap = source.HashMap({
        virtHashCode: virtHashCode,
        virtEquals: virtEquals
      }),

      PVector = source.PVector({
        PConstants: PConstants
      }),

      PFont = source.PFont({
        Browser: Browser,
        noop: noop
      }),

      XMLElement = source.XMLElement({
        Browser: Browser,
        XMLAttribute: XMLAttribute
      }),

      PMatrix2D = source.PMatrix2D({
        p:CommonFunctions
      }),

      PMatrix3D = source.PMatrix3D({
        p:CommonFunctions
      }),

      PShape = source.PShape({
        PConstants: PConstants,
        PMatrix2D: PMatrix2D,
        PMatrix3D: PMatrix3D
      }),

      PShapeSVG = source.PShapeSVG({
        CommonFunctions: CommonFunctions,
        PConstants: PConstants,
        PShape: PShape,
        XMLElement: XMLElement,
        colors: source.colors
      }),

      defaultScope = source.defaultScope({
        ArrayList: ArrayList,
        HashMap: HashMap,
        PVector: PVector,
        PFont: PFont,
        PShapeSVG: PShapeSVG,
        ObjectIterator: ObjectIterator,
        PConstants: PConstants,
        Char: Char,
        XMLElement: XMLElement,
        XML: XMLElement,
        Live2D: source.Live2D
      }),

      Processing = source.Processing({
        defaultScope: defaultScope,
        Browser: Browser,
        extend: source.extend,
        noop: noop
      });

  // set up the Processing syntax parser
  Processing = source.setupParser(Processing, {
    Browser: Browser,
    aFunctions: testHarness,
    defaultScope: defaultScope
  });

  // finalise the Processing object
  Processing = source.finalize(Processing, {
    version: '1.6.6+live2d',
    isDomPresent: false || Browser.isDomPresent,
    window: Browser.window,
    document: Browser.document,
    noop: noop
  });

  // done.
  return Processing;
};

export default buildProcessingJS;