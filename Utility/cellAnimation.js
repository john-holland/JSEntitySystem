function CellAnimation(imageFile, cellX, cellY, frameCount, framesPerSecond, continuation) {
    var self = this;
    this.ImageFile = imageFile;
    this.CellX = cellX;
    this.CellY = cellY;
    this.Delta = (1000 / framesPerSecond);
    this.CurrentFrame = 0;
    this.FrameDelta = 0;
    
    this.StartFrame = 0;
    this.EndFrame = frameCount;
    
    /* The current image  */
    this.CurrentImage = null;
    
    this.Frames = [];
    
    var init = function() {
        var baseImage = new Image();
        baseImage.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            
            var canvasContext = canvas.getContext("2d");
            
            // stamp the image on the left of the canvas:
            canvasContext.drawImage(baseImage, 0, 0);
                    
            var baseX = 0;
            var baseY = 0;
            var imageWidth = baseImage.width;
            var imageHeight = baseImage.height;
            
            var cellWidth = imageWidth / cellX;
            var cellHeight = imageHeight / cellY;
            
            var newCanvas = document.createElement('canvas');
            
            newCanvas.width = cellWidth;
            newCanvas.height = cellHeight;
            
            var newContext = newCanvas.getContext("2d");
            
            var framesGrabbed = 0;
            for (baseY = 0; baseY < cellY; baseY++) {
                var currentBaseY = baseY * cellHeight;
                baseX = 0;
                for (baseX = 0; baseX < cellX; baseX++) {
                    if (framesGrabbed >= frameCount) {
                        break;
                    }                    
                    framesGrabbed++;
                    
                    var currentBaseX = baseX * cellWidth;
                    //console.log("Current Frame: " + framesGrabbed + ", X: " + currentBaseX + ", Y: " + currentBaseY);
                    
                    newContext.fillStyle = "#000000";
                    newContext.fillRect(0,0,cellWidth,cellHeight);
                    
                    newContext.drawImage(canvas, currentBaseX, currentBaseY, cellWidth, cellHeight, 0,0,cellWidth,cellHeight);

                    self.Frames.push(Canvas2Image.saveAsPNG(newCanvas, true));
                }
            }
            
            if (typeof continuation !== 'undefined'
            && typeof continuation === 'function') {
                continuation();
            }
        };
        baseImage.src = imageFile;
    };
    
    if (cellX > 0 && cellY > 0) {
        if (frameCount === 'undefined') {
            var frameCount = cellX * cellY;
        } else if (frameCount < 1) {
            frameCount = cellX * cellY;
        }
        
        init();
    }
    /*
      Pushes a new image into the Frames property.
    */
    this.PushImage = function(newImage) {
        this.Frames.push(newImage);
    }
    
    /*
      Updates the animation cell. You can then RenderCurrent(context, x, y[, width, height]);
    */
    this.UpdateCell = function(delta) {
        self.FrameDelta += delta;
        
        if (self.FrameDelta > self.Delta) {
            self.FrameDelta -= self.Delta;
            
            if (self.CurrentFrame >= self.EndFrame) {
                self.CurrentFrame = self.StartFrame;
            } else {
                self.CurrentFrame++;
            }
            
            self.CurrentImage = self.Frames[self.CurrentFrame];

        }
    }
    
    this.SetCurrentImage = function() {
        self.CurrentImage = self.Frames[self.CurrentFrame];
    }
    
    this.ChangeAnimationBounds = function(startCell, endCell) {
        if (startCell < 0) {
            startCell = 0;
        } 
        if (endCell >= self.Frames.length) {
            endCell = self.Frames.length - 1;
        }
        
        self.StartFrame = startCell;
        self.EndFrame = endCell;
        self.CurrentFrame = startCell;

        self.CurrentImage = self.Frames[self.CurrentFrame];
        console.log("S:" + self.StartFrame + ", E:" + self.EndFrame + ", c:" + self.CurrentFrame);
    }
}