Array.prototype.Map = function(func) {
    var mappedArray = new Array(this.length);
	var i;
	
	for (i = 0; i < this.length; i++) {
		mappedArray[i] = func(this[i]);
	}
	
	return mappedArray;
}

Array.prototype.Select = Array.prototype.Map;

//takes a function that takes: (accumulated, currentElement)
Array.prototype.Fold = function(initialVal, func) {
	var ret = initialVal;
    var i;
	for (i = 0; i < this.length; i++) {
		ret = func(ret, this[i]);
	}
	
	return ret;
}

Array.prototype.Aggregate = Array.Fold;

Array.prototype.Find = function(predicate) {
	var matches = [];
	
	var i;
	for (i = 0; i < this.length; i++) {
		if (predicate(this[i]))
		{
			matches.push(this[i]);
		}
	}
	
	return matches;
}

Array.prototype.Where = Array.prototype.Find;
Array.prototype.Filter = Array.prototype.Find;

Array.prototype.First = function() {
	return this[0];
}

Array.prototype.Last = function() {
	return this[(this.length - 1)];
}

Array.prototype.Skip = function(amount) {
	var remaining = this.length - amount;
	
	//can't skip more than exist!
	if (remaining > 0) {
		var skipped = new Array(remaining);
	
		var i;
		for (i = amount; i < this.length; i++) {
			skipped[i];
		}
		
		return skipped;
	}
	
	return null;
}

Array.prototype.Take = function(amount) {
	if (this.length > amount) {
		amount = this.length;
	}
	
	var takenElements = new Array(amount);
	
	var i;
	for (i = 0; i < amount; i++) {
		takenElements[i] = this[i];
	}
	
	return takenElements;
}

/*
  The Any function accepts either a predicate function, a predicate object or
  no parameter (in which case it simply checks to see if the Array has anything at all).
  
  Usage:
  var collection = new Array(1, 2, 3);
  
  if (collection.Any(function(x) { return x == 3 })) {
    //Yes it does have 3!
  }
  
  if (collection.Any(2)) {
    //yup it has 2!
  }
  
  if (collection.Any()) {
    //yup it has stuff.
  }
*/
Array.prototype.Any = function(predicate) {
    if (typeof predicate == 'undefined') {
        return (this.length > 0);
    }
    
    var i;
    
    if (typeof predicate == 'Function') {
        for (i = 0; i < this.length; i++) {
            if (predicate(this[i])) {
                return true;
            }
        }
    } else {        
        for (i = 0; i < this.length; i++) {
            if (this[i] === predicate) {
                return true;
            }
        }
    }
    
    return false;
}



/* TODO FixME!?
//Takes a function, then some arguments and stores them so that you can later
//Call that function and it will remember its args.

	For example,
	
	function plus(x, y)
	{
		return x + y;
	}
	
	var fivePlus(5).Curry();
*/
Function.prototype.Curry = function() {
    var args = new Array(arguments.length);
    var self = this;
    var i;
    for (i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
    }
    
    return function() {
        return self.apply(self, args.concat(arguments));
    };
}