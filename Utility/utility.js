//This functions much like jQuery.each.
var IterateProperties = function(obj, func) {
    for (propertyName in obj) {
        if (obj.hasOwnProperty(propertyName)) {
            func(propertyName);   
        }
    }
}

function RandomFromTo(from, to) {
    return (Math.random() * to) + from;
}

Array.prototype.indexAndRemove = function(itemToRemove) {
    var indexOfItem = this.indexOf(itemToRemove);
    
    if (indexOfItem == -1) {
        return false;
    }
    
    this.splice(indexOfItem, 1);
    return true;
}

V2.prototype.To = function(target) {
    //A -> B == B - A
    return target.Sub(this);
}

ImmutableV2.prototype.To = function(target) {
    //A -> B == B - A
    return target.Sub(this);
}

/*Object.prototype.DepthFirstSearch = function(getChildren, action) {
    var children = getChildren(this);
    var extraArgs = arguments.slice(2);
    if (!action.apply(action, [this].concat())) {
        return;
    }
    
    children.forEach(function (child) {
        child.DepthFirstSearch(getChildren, action);
    });
}*/

Array.prototype.contains = function(item) {
    return $.inArray(item, this) !== -1;
}

/*
  Checks to see if the two arrays contain the same elements regardless of order.
*/
Array.prototype.contentEquals = function(otherArray) {
    return ($(this).not(otherArray).length === 0 && $(otherArray).not(this).length === 0);
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//boo yeah dynamic languages :)
/*Object.prototype.Sequence = function(action) {
    return action(this);
}*/