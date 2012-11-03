var image = new Image();

var createAnimationEntity = null;
var createMultipleRandomElements = null;
var deleteMultipleRandomElements = null;
var  FollowMouseComponent = null;    
var entitySystem = null;
$(function() {
    var canvasElement = $("#myCanvas");
    var canvasContext = canvasElement[0].getContext("2d");
    entitySystem = new JSEntitySystem(16, canvasContext, "#000000");
    
    FollowMouseComponent = entitySystem.RegisterComponent('FollowMouse', ['MovementUpdater'],
        { Speed: 1000, AttractionRadius: 2000 })
        .Assigned(function(entity, gameTime) {                           
            if (typeof entity.Datas.ElementToMove !== 'undefined') {
                entity.Datas.ElementToMove.css('position', 'absolute');
                entity.Datas.ElementToMove.css('width','2em');
            }
            
            //if the current position is defined
            if (typeof entity.Datas.Position !== 'undefined') {
                //and if the original position is undefined, then we can copy over this current position
                if (typeof entity.Datas.OriginalPos === 'undefined') {
                    entity.Datas.OriginalPos = entity.Datas.Position.Copy();
                    entity.Datas.OriginalSpeed = entity.Datas.Speed;
                }
            }
            
            if (typeof entity.Datas.Position === 'undefined') {
                entity.Datas.Position = new V2();
            }
            
            if (typeof entity.Datas.ToMouse === 'undefined') {
                entity.Datas.ToMouse = new V2();
            }
            
            
            if (entitySystem.IsOnTouchDevice) {
                if (typeof entity.Datas.AveragePos === 'undefined') {
                    entity.Datas.AveragePos = new V2();
                }
            }
    	})
    	.Update(function(entity, gameTime) {
            //update
            
            //A -> B :: B - A
            var currentPos = entity.Datas.Position;//.Init(divPos.left, divPos.top);
            
            var speedModifier = 1;
            var lengthToMouse = 1000;
            
            var sensingDistance = 300;
            var sensingDistanceSqr = sensingDistance * sensingDistance;
                                        
            if (entitySystem.IsOnTouchDevice && entitySystem.TouchPositions.Any()) {
                sensingDistance = 200;
                sensingDistanceSqr = sensingDistance * sensingDistance;
                
                //average out the positions of nearby touches and head for that point.                                
                var j = 0;
                for (j = 0; j < entitySystem.TouchPositions.length; j++) {
                    if (j === 0) {
                        entity.Datas.AveragePos.InitFromV2(entitySystem.TouchPositions.First());
                    }
                    
                    var touchToMouse = entitySystem.TouchPositions[j].Copy();
                    
                    touchToMouse.Sub(currentPos);
                    
                    if (touchToMouse.LengthSqr() < sensingDistanceSqr) {
                        entity.Datas.ToMouse.InitFromV2(touchToMouse);
                    }
                }
            } else {                                
                entity.Datas.ToMouse.InitFromV2(entitySystem.MousePos).Sub(currentPos);
            }
            
            var toMouse = entity.Datas.ToMouse;
            
            lengthToMouse = toMouse.Length();
            
            if (lengthToMouse < 20) {
                entity.Datas.Speed = 0;
                return;
            } else if (lengthToMouse < sensingDistance) {
                entity.Datas.Speed = entity.Datas.OriginalSpeed * ((lengthToMouse / sensingDistance) - FollowMouseComponent.AttractionRadius / 1000);
            }
            
            entity.Datas.Rotation = Math.atan2(toMouse.Y, toMouse.X);
            
            if (lengthToMouse >= sensingDistance || !entitySystem.IsMouseDown) {
                if (typeof entity.Datas.OriginalPos !== 'undefined') {
                    entity.Datas.Speed = FollowMouseComponent.AttractionRadius;
                    toMouse = entity.Datas.ToMouse.InitFromV2(entity.Datas.OriginalPos)
                                                  .Sub(currentPos);
    
                    entity.Datas.Rotation = Math.atan2(toMouse.Y, toMouse.X);
    
                    if (toMouse.Length() < 40) {
                        entity.Datas.Speed = 0;
                        entity.Datas.Position.InitFromV2(entity.Datas.OriginalPos);
                        return;
                    }
                } else {
                    entity.Datas.Speed = 0;
                }
            }
            
    	})
        .HandleMessage("twist", function(entity, data) {
            entity.Datas.Position.X += data;
            entity.Datas.OriginalPos.X += data;
        });
        
    FollowMouseComponent.AttractionRadius = 1000;
                    
    entitySystem.RegisterComponent('RotateClockwise', [], [])
        .Update(function(entity, gameTime) {
            if (typeof entity.Datas.Rotation === 'undefined') {                                
                entity.Datas.Rotation = 0;
            }
            
            entity.Datas.Rotation += 100 * (gameTime / 1000);
            
            if (typeof entity.Datas.ElementToMove !== 'undefined') {
                entity.Datas.ElementToMove.rotate(entity.Datas.Rotation);
            }
		});
                    
    entitySystem.RegisterComponent('MovementUpdater', [],
        ['Position', 'Speed', 'Heading'])
        .Update(function(entity, gameTime) {        
            var rot = entity.Datas.Rotation;

            entity.Datas.Heading.Init(Math.cos(rot), Math.sin(rot)).Normalize();

            entity.Datas.Position.Add(entity.Datas.Heading.Multiply(entity.Datas.Speed).Multiply(gameTime / 1000));
            
            if (typeof entity.Datas.ElementToMove !== 'undefined') {
                var div = entity.Datas.ElementToMove;
                div.css('left', entity.Datas.Position.X);
                div.css('top', entity.Datas.Position.Y);
            }
        });
        
    var toRadians = Math.PI/180;
    entitySystem.RegisterComponent('ImageCanvasRenderer', [],
        ['Position', 'Rotation', 'ImageToRender', 'ContextToRenderOn'])
        .Render(function(entity, gameTime) {
            if (entity.Datas.ContextToRenderOn === null || entity.Datas.ImageToRender === null
                || typeof entity.Datas.ImageToRender === 'undefined') {
                return;
            }
            
            var context = entity.Datas.ContextToRenderOn;
            
            context.save();
 
            context.translate(entity.Datas.Position.X, entity.Datas.Position.Y);
         
        	context.rotate(entity.Datas.Rotation);
         
        	context.drawImage(entity.Datas.ImageToRender, -(entity.Datas.ImageToRender.width/2), -(entity.Datas.ImageToRender.height/2));
            
            context.restore();
        });
        
    entitySystem.RegisterComponent('CellAnimationRenderer',
        ['ImageCanvasRenderer'],
        ['ImageFile', 'CellX', 'CellY', 'FrameCount', 'FramesPerSecond'])
        .Assigned(function(entity, gameTime) {
            //assigned
            if (typeof this.Animation === 'undefined') {
                this.Animation = new CellAnimation(entity.Datas.ImageFile, entity.Datas.CellX, entity.Datas.CellY, entity.Datas.FrameCount, entity.Datas.FramesPerSecond);
            }
            
            this.FrameDelta = 0;
            this.CurrentFrame = 0;
        })
        .Update(function(entity, gameTime) {
            //update
            this.Animation.FrameDelta = this.FrameDelta;
            this.Animation.CurrentFrame = this.CurrentFrame;
            
            this.Animation.UpdateCell(gameTime);
            if (typeof this.Animation.CurrentImage !== 'undefined') {
                this.ImageToRender = this.Animation.CurrentImage;   
            }
            
            this.FrameDelta = this.Animation.FrameDelta;
            this.CurrentFrame = this.Animation.CurrentFrame;
        });
    
    entitySystem.RegisterComponent("SomeGuy", [], [])
        .Update(function(entity, gameTime) {
            entity.Datas.Rotation = entity.Datas.Rotation + 0.1;
        });
    
    (function() {
        var typedYet = false;        
        
        var docHeight = $(document).height();
        var docWidth = $(document).width();
        
        canvasElement[0].width = $(window).width();
        canvasElement[0].height = $(window).height();
        
        var bodyElem = $('body');
        image.src = "star.png";
        
        //entity.Datas.Animation 
        
        //lol pokemon
        //var animation = new CellAnimation("pokemon_sprites_1_151_by_dragonite14.png", 24, 26, 608, 10,
        //                        function() { animation.ChangeAnimationBounds(0, 3); });
        
        //var animation = new CellAnimation("rolling_dot.png", 4, 1, 4, 5);
        //var animation = new CellAnimation("swirls.png", 3, 3, 9, 60);
        var createNewElement = (function(x, y) {
                var ent = entitySystem.CreateEntity();
                
                ent.Datas.Speed = 1000;
                ent.Datas.Position = new V2(x, y);
                
                ent.Datas.Heading = new V2();
                
                ent.Datas.Rotation = 0;
                
                ent.Datas.ContextToRenderOn = canvasContext;
                ent.Datas.ImageToRender = image;            
                
                ent.Datas.ImageFile = "pokemon_sprites_1_151_by_dragonite14.png";
                ent.Datas.CellX = 24;
                ent.Datas.CellY = 26;
                ent.Datas.FrameCount = 608;
                ent.Datas.FramesPerSecond = 5;
                
                //ent.Datas.Animation = animation;
                //ent.AddComponent('CellAnimationRenderer');
                    
                ent.AddComponent('FollowMouse');
                ent.AddComponent('ImageCanvasRenderer');
                
                ent.Datas.Rotation = 0;
            });
        var i = 0;
        
        //24 x 26
        
        createAnimationEntity = function() {
            var animationEntity = entitySystem.CreateEntity();
            
            animationEntity.Datas.ImageFile = "pokemon_sprites_1_151_by_dragonite14.png";
            animationEntity.Datas.CellX = 24;
            animationEntity.Datas.CellY = 26;
            animationEntity.Datas.FrameCount = 608;
            animationEntity.Datas.FramesPerSecond = 5;
            animationEntity.Datas.Speed = 1000;//i + 1;
            animationEntity.Datas.Position = new V2(100, 100);
            animationEntity.Datas.Heading = new V2();
            animationEntity.Datas.Rotation = 0;
            animationEntity.Datas.ImageToRender = null;
            animationEntity.Datas.ContextToRenderOn = canvasContext;
            
            animationEntity.AddComponent('ImageCanvasRenderer');
            //animationEntity.AddComponent('CellAnimationRenderer');
        };
        //random elements to make.
        
        createMultipleRandomElements = function(amountOfEntitiesToMake) {
            for (i = 0; i < amountOfEntitiesToMake; i++) {
                createNewElement(RandomFromTo(0, docWidth), RandomFromTo(0, docHeight));
            }
        }
        
        deleteMultipleRandomElements = function(amountOfEntitiesToRemove) {
            for (i = 0; i < amountOfEntitiesToRemove; i++) {
                if (entitySystem.EntityUpdateList.Any()) {
                    entitySystem.RemoveEntity(entitySystem.EntityUpdateList.Last().Id);
                } else {
                    break;
                }
            }
        }
        
        createMultipleRandomElements(entitySystem.IsOnTouchDevice ? 250 : 1000);
        
        $(document).ready(function () {
            $(window).keydown(function(args) {
                var char = String.fromCharCode(args.which);
                var entIndex = 0;
                if (char === ' ') {
                    createMultipleRandomElements(10);
                } else if (char === 'D') {
                    //remove the last entity in the entities list
                    for (i = 0; i < 10; i++) {
                        if (entitySystem.EntityUpdateList.Any()) {
                            entitySystem.RemoveEntity(entitySystem.EntityUpdateList.Last().Id);
                        }
                    }
                }
            });
        });
    })();
    
    entitySystem.StartUpdating();
});