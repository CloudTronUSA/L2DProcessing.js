
# Processing.js with Live2D!

For the Processing project website, visit http://processingjs.org

For Live2D's website, visit https://www.live2d.com/en/

This is the compilation repository for Processing.js, used in building the `processing.js` library from a series of Node.js flavored ES modules.

This repository adds Live2D support for processing.js v1.6.6 which is the last version of processing.js available. CURRENTLY NO PLAN ON MIGRATING TO P5.JS.

# Version

The Current version for Processing.js is 1.6.6 (released December 2018)
Using Cubism 5 SDK for Web and Cubism 5 Framework for Web. Supports Live2D models from all previous versions.

## Getting Processing.js

Simply grab the `processing.js` file, include them as script on your webpage, and you're all set. See `test.html` for a simple example of using Processing.js on your pages.

An example of using Live2D with Processing.js can be found in `l2d_example.pde`.

## Playing with the code

Clone this project using git, and ensure you have [node.js](http://nodejs.org) installed. After cloning, install the required node packages using `npm install` in the processing-js directory. 

Modifying the code and building your own `processing.js` is then a fairly straightforward process. Modify the code as much as you want or need, then:

1. Test: `$> node test`
2. Build: `$> node build.js`

Step 1 will run the Processing object through a battery of tests. If no error is reported, you can run step 2 to build your `processing.js`.

If you want to build a minimized version of `processing.js`, change `minify: false` to `true` in `build.js` and rerun the build command.

## Manual tests

Run a simple python http server at project root directory:
`$> python -m http.server`

You can then visit the following webpage:

* [http://localhost:8000/test.html](http://localhost:8000/test.html) - vanilla example page
* [http://localhost:8000/test/ref](http://localhost:8000/test/ref) - reference testing page
* [http://localhost:8000/test/perf](http://localhost:8000/test/perf) - performance testing page
* [http://localhost:8000/test/tools/processing-helper.html](http://localhost:8000/test/tools/processing-helper.html) - utility page for converting/running Processing code

## New function calls added for L2D

To get a Live2D Runtime Object:
`Live2D l2d_rt = setupLive2D()`

You can then call the following functions on this object:
```
- initialize(x, y, width, height, modelDir, modelFile)
- release()
- loadModel(modelDir, modelFile)
- updateModel()
- setModelCanvasPosition(x, y, width, height)
- setModelPosition(x, y)
- setModelScale(scale)
- startMotion(group_name, id)
- stopMotion()
- setExpression(expression_name)
- unsetExpression()
- setParameter(name, value, weight)
- lookAt(x, y)
```

**Note: You can only have ONE Live2D object across all sketches in one webpage, and the Live2D object can only be initialized ONCE.**

**If you are using the processing-helper.html utility page, you must RELOAD the webpage before running another sketch that uses Live2D because it does not destroy the old sketch when you run the new one.**
