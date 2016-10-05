/*
  Compilation for the browser
*/
IncDom.compile = (function() {

  const voidTags = ['input','yield'];
  var methods = {};
  
  function mkAttribute(attributes){
    var attribute='[';
    attributes.forEach(function(nodeAttribute, i) {
      if(i > 0)attribute=attribute+ ",";
      attribute=attribute+ `'${nodeAttribute.nodeName}',${nodeAttribute.nodeValue}`;
    });
    return attribute+']';
  }
  function mkscript(nodes){
      var scripts=[];
      nodes.forEach(function(node, i) {
        if(node.nodeName=='#text'){
          scripts.push(`text(${node.nodeTextContent}); `);
        }else if(voidTags.indexOf(node.nodeName)>=0){
          scripts.push(`elementVoid('${node.nodeName}', '', ${mkAttribute(node.nodeAttributes)}); `);
        }else{
          scripts.push(`elementOpen('${node.nodeName}', '', ${mkAttribute(node.nodeAttributes)}); `);
          if(node.child.length>0){scripts=scripts.concat(mkscript(node.child));}
          else{scripts.push(`text(${node.nodeTextContent}); `);}
          scripts.push(`elementClose('${node.nodeName}'); `);
        }
      });
      return scripts;
  }
  //// Entry point -----
  /**
  arg : tagName or tagString or url
  */
  return function(src, fn, opts) {
    //console.log(src);

    Object.keys(src).forEach(function(key) {
      methods[key] = function(data){};
      methods[key].script = [];
      var script = this[key].script.innerText;
      if(script)methods[key].script.push(script);
      methods[key].script = methods[key].script.concat(mkscript(this[key].template));
      //console.log(methods[key].script);
      //console.log(`function render(data) {${ methods[key].script.join('\n')} \n};`);
      
      methods[key] = new Function('data', `${ methods[key].script.join('\n')}`);
      console.log(methods[key]);
    }, src);

    return methods;
  }
})()
