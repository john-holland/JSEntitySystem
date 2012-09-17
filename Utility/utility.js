//This functions much like jQuery.each.
function IterateProperties(theObject, func) {
    for (p in theObject) {
        if (theObject.hasOwnProperty(p)) {
            func(p);   
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