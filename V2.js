/*
  A simple vector2 class. Each operation returns a new vector2, so beware of garbage collection!
  
  TODO: Make side effecting versions of the functions below for performance benefits.
*/
function V2(x, y) {
    if (typeof x === 'undefined' || typeof y === 'undefined') {
        this.X = 0;
        this.Y = 0;
    } else {
        this.X = x;
        this.Y = y;
    }
    
    /*
      Checks the value passed in to make sure it's a Vector2.
    */
    var IsVector2 = function (value) {
        return value.constructor === V2;
    };
    
    /*
      Performs a Dot on this V2 and the V2 passed in.
    */
    this.Dot = function(vec2) {
        return (this.X * vec2.X + this.Y * vec2.Y); 
    }

    /*
      Returns the Length of the V2. It should be noted that LengthSqr should be used
      for greater performance.
    */
    this.Length = function() {
        return Math.sqrt(this.Dot(this)); 
    }

    /*
      Returns the length * length of the V2. Faster than V2.Length as it does not
      make a Math.sqrt call.
    */
    this.LengthSqr = function() { 
        return this.Dot(this); 
    }
    
    /*
      Returns the Absolute value for this vector's X and Y in a new V2.
    */
    this.Abs = function() {
        return new V2(Math.abs(this.X), Math.abs(this.Y));
    }

    /*
      Returns the unit length V2 (vector components divided by length)
    */
    this.Normalize = function() {
        var vlen = this.Length();
        return new V2(this.X / vlen, this.Y / vlen);
    }
    
    /*
      Returns the product of this vector and either a scalar or a V2 passed in.
    */
    this.Multiply = function (value) {
        if (IsVector2(value)) {
            return new V2(this.X * value.X, this.Y * value.Y);
        } else {
            return new V2(this.X * value, this.Y * value);   
        }
    }
    
    /*
      Returns the divisor of this vector and a scalar passed in.
    */
    this.Divide = function(value) {
        return new V2(this.X / value, this.Y / value); 
    }
    
    /*
      Returns the sum of this vector and either a scalar or a V2 passed in.
    */
    this.Add = function(value) {
        if (IsVector2(value)) {
            return new V2(this.X + value.X, this.Y + value.Y); 
        } else {
            return new V2(this.X + value, this.Y + value);
        }
    }
    
    /*
      Returns the difference of this vector and either a scalar or a V2 passed in.
    */
    this.Sub = function(value) {
        if (IsVector2(value)) { 
            return new V2(this.X - value.X, this.Y - value.Y);
        } else {
            return new V2(this.X - value, this.Y - value); 
        }
    }
}