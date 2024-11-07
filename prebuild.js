// wrapper.js

import buildProcessingJS from './src/index.js';
import './src/Live2D/live2dcubismcore.js';

// Define the Browser object as needed
const Browser = {
  isDomPresent: true,
  navigator: navigator,
  window: window,
  document: document,
  ajax: function(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType("text/plain");
    }
    xhr.setRequestHeader("If-Modified-Since", "Fri, 01 Jan 1960 00:00:00 GMT");
    xhr.send(null);
    if (xhr.status !== 200 && xhr.status !== 0) {
      throw new Error("XMLHttpRequest failed, status code " + xhr.status);
    }
    return xhr.responseText;
  }
};

// Call the function to get the Processing object and assign it to `window`
window.Processing = buildProcessingJS(Browser);