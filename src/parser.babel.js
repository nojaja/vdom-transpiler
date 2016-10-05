var IncDom = {
  version: 'WIP',
  settings: {}
};
var T_STRING = 'string';
var T_FUNCTION = 'function';
var T_OBJECT = 'object';
/**
 * Detect if the argument passed is a function
 * @param   { * } v - whatever you want to pass to this function
 * @returns { Boolean } -
 */
function isFunction(v) {
  return typeof v === T_FUNCTION || false // avoid IE problems
}
/**
 * Detect if the argument passed is an object, exclude null.
 * NOTE: Use isObject(x) && !isArray(x) to excludes arrays.
 * @param   { * } v - whatever you want to pass to this function
 * @returns { Boolean } -
 */
function isObject(v) {
  return v && typeof v === T_OBJECT // typeof null is 'object'
}
/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String } selector - DOM selector
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  return (ctx || document).querySelectorAll(selector)
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}
/**
 * Get the value of any DOM attribute on a node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { String } name - name of the attribute we want to get
 * @returns { String | undefined } name of the node attribute whether it exists
 */
function getAttr(dom, name) {
  return dom.getAttribute(name)
}
/*
  Compilation for the browser
*/
IncDom.parse = (function() {

  var tags = {};
  // gets the source of an external tag with an async call
  function GET(url, fn, name, opts) {
    var req = new XMLHttpRequest()

    req.onreadystatechange = function() {
      if (req.readyState === 4 &&
        (req.status === 200 || !req.status && req.responseText.length)) {
        fn(req.responseText, name, opts, url)
      }
    }
    req.open('GET', url, true)
    req.send('')
  }

  // compiles all the internal and external tags on the page
  function parseScripts(fn, opts) {
    var
      scripts = $$('script[type="IncDom/tag"]'),
      scriptsAmount = scripts.length

    function done() {
      if (fn) fn(tags);
    }

    function exprParse(src) {
      src = src.replace(/\\{/g, '\uFFF0').replace(/\\}/g, '\uFFF1');
      src = src.trim();
      if (/^\{\s*([^\}]+)\s*\}$/.test(src)) {
        src = src.replace(/^\{\s*([^\}]+)\s*\}$/, function(_, expr) {
          return expr.trim()
        });
      } else {
        src = "'" + src + "'";
        src = src.replace(/{/g, "'+(function() {return ");
        src = src.replace(/}/g, "})()+'");
      }
      src = src.replace(/\uFFF0/g, '{');
      src = src.replace(/\uFFF1/g, '}');
      return src;
    }
/*
    function extparse(nodejson,element) {
        if (/^\{#([^\s]+)/i.test(element.textContent.trim())) {
          element.textContent.trim().replace(/^\{#([^\s]+)\s*([^\}]+)\s*\}$/i, function(_, tag,expr) {
            nodejson.nodeName= "#"+tag.toLowerCase();
            nodejson.nodeTextContent = expr.trim();
          });
        }
    }
    */
    function tagparse(dom) {
      var node = dom.childNodes;
      var ret = [];
      for (var i = 0; i < node.length; i++) {
        var element = node[i];
        var nodejson = {
          nodeName: '',
          nodeAttributes: {},
          nodeTextContent: '',
          child: []
        };
        nodejson.nodeName = (element.tagName) ? element.tagName.toLowerCase() : element.nodeName;
        nodejson.nodeTextContent = exprParse(element.textContent || '');
        extparse(nodejson,element);
        //console.log(element);
        //console.log(nodejson.nodeName);
        //console.log(nodejson.nodeTextContent);
        if (element.attributes) {
          for (var j = 0; j < element.attributes.length; j++) {
            var attrkey =  element.attributes[j].nodeName;
            var attrValue= exprParse(element.attributes[j].nodeValue);
            nodejson.nodeAttributes[attrkey]=attrValue;
          }
        }
        if (element.childElementCount && element.childElementCount > 0) {
          nodejson.child = tagparse(element);
        }
        ret.push(nodejson);
      }
      return ret;
    }

    function extparse(src) {
        var ret=src+'';
        ret=ret.replace(/\{#([^\s]+)\s*([^\}]+)\s*\}/ig, function(_, tag,expr) {
            return `<${tag} condition='\{${expr}\}'>`;
          });
        ret=ret.replace(/\{\/([^\s]+)\s*\}/ig, function(_, tag,expr) {
            return `</${tag}>`;
        });
      return ret;
    }
    function parseTag(src, tagName, opts, url) {
      var buf = document.createElement('div'); // ダミーの要素を生成して

      src = extparse(src);
      src = src.replace(/\s+/g, ' ');
      src = src.replace(/=(\{[^\}]+\})([\s\>])/g, '="$1"$2');
      //src = src.replace(/'/g, "\\'");
      src = src.replace(/\\[{}]/g, '\\$&');
      src = src.replace(/> </g, '><');
      //console.log(src);
      buf.innerHTML = src; // 貼りつけた内容を突っ込む
      var template = buf.getElementsByTagName('x-template')[0];
      var json = tagparse(template);
      //console.log(json);

      var script = buf.getElementsByTagName('x-script')[0];

      tags[tagName] = {
        template: json,
        script: script
      };
      if (!--scriptsAmount) done()
    }
    if (!scriptsAmount) done()
    else {
      for (var i = 0; i < scripts.length; ++i) {
        var script = scripts[i];
        var url = getAttr(script, 'src');
        var tagName = getAttr(script, 'name');
        if (tagName) {
          url ? GET(url, parseTag, tagName, opts) : parseTag(script.innerHTML, tagName, opts)
        }
      }
    }
  }

  //// Entry point -----
  /**
  arg : tagName or tagString or url
  */
  return function(fn, opts) {
    parseScripts(fn, opts);
  }
})()
