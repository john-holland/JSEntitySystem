//This tile system operatos on the idea that you can take the modulus of vectors passed in and 
//get the upper left hand corner of the square you're in based on that.
function TileSystem(gradient) {
    
}

function TileCursor(tileSystem) {
    var currrentPos = null;
    
    this.MoveLeft = function(amount) {
        return this;
    }
    
    this.MoveRight = function(amount) {
        return this;
    }
    
    this.MoveUp = function(amount) {
        return this;
    }
    
    this.MoveDown = function(amount) {
        return this;
    }
}