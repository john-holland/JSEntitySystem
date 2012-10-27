//Based off of: http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
var loadScript = function(url, callback){
    var _loadScript = function(urlToLoad, internalCallback) {
        var script = document.createElement("script")
        script.type = "text/javascript";
    
        if (script.readyState){  //IE
            script.onreadystatechange = function() {
                if (script.readyState == "loaded" ||
                        script.readyState == "complete") {
                    script.onreadystatechange = null;
                    internalCallback();
                }
            };
        } else {  //Others
            script.onload = function(){
                internalCallback();
            };
        }
    
        script.src = urlToLoad;
        document.getElementsByTagName("head")[0].appendChild(script);
    };

    if (typeof url === 'string') {
        _loadScript(url, callback);
    } else if (typeof url === 'object') {
        url.reverse();
        var scriptToLoad = url.pop();
        var kick = function() {
            if (url.length === 0) {
                _loadScript(scriptToLoad, callback);
            } else {
                _loadScript(scriptToLoad, function() {
                    scriptToLoad = url.pop();
                    kick();
                });
            }
        };
        
        kick();
    }
}