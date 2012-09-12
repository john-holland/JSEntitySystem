var image = new Image();

var createAnimationEntity = null;
        
$(function() {
    var canvasElement = $("#myCanvas");
    var canvasContext = canvasElement[0].getContext("2d");
    var entitySystem = new JSEntitySystem(16, canvasContext, "#000000");
    
    //TODO: This 'TestComponent' should be reworked into a 'FollowMouse' component that takes an element reference in its Datas.
    entitySystem.RegisterComponent('FollowMouse',
        new entitySystem.Component(function(entity, gameTime) {
                            //assigned
                            
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
            			},
            			function(entity, gameTime) {
                            //removed
        				},
            			function(entity, gameTime) {
                            //update
                            
                            //A -> B :: B - A
                            var currentPos = entity.Datas.Position;//.Init(divPos.left, divPos.top);
                            
                            var speedModifier = 1;
                            var lengthToMouse = 10000;
                            
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
                                        //entity.Datas.AveragePos.Add(entitySystem.TouchPositions[j]);
                                        entity.Datas.ToMouse.InitFromV2(touchToMouse);
                                    }
                                }
//                                
//                                var divideByAmount = 1;
//                                if (entitySystem.TouchPositions.length > 1) {
//                                    divideByAmount = entitySystem.TouchPositions.length;
//                                }
                                
//                                entity.Datas.AveragePos.Divide(divideByAmount);
//                                if (entityDatas.AveragePos.ToTouchPositions.Any()) {
//                                    entity.Datas.ToMouse.InitFromV2(entityDatas.AveragePos.ToTouchPositions.First()).Sub(currentPos);
//                                }
                            } else {                                
                                entity.Datas.ToMouse.InitFromV2(entitySystem.MousePos).Sub(currentPos);
                            }
                            
                            var toMouse = entity.Datas.ToMouse;
                            
                            entity.Datas.Rotation = Math.atan2(toMouse.Y, toMouse.X);
                            
                            lengthToMouse = toMouse.Length();
                            
                            if (lengthToMouse < 20) {
                                entity.Datas.Speed = 0;
                            } else if (lengthToMouse < sensingDistance) {
                                entity.Datas.Speed = entity.Datas.OriginalSpeed * ((lengthToMouse / sensingDistance) - 0.5);
                            }
                            
                            if (lengthToMouse >= sensingDistance || !entitySystem.IsMouseDown) {
                                if (typeof entity.Datas.OriginalPos !== 'undefined') {
                                    entity.Datas.Speed = entity.Datas.OriginalSpeed;
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
                            
        				},
            			function(entity, gameTime) {
                            //render
            			}),
                	['MovementUpdater'],
                    ['Speed']);
                    
    entitySystem.RegisterComponent('RotateClockwise',
        new entitySystem.Component(function(entity, gameTime) {
                            //assigned
                            //entity.Datas.ElementToMove.css('width','0em');
                            //entity.Datas.ElementToMove.css("-webkit-transform-origin", "50% 50%" );
            			},
            			function(entity, gameTime) {
                            //removed
        				},
            			function(entity, gameTime) {
                            //update
                            
                            if (typeof entity.Datas.Rotation === 'undefined') {                                
                                entity.Datas.Rotation = 0;
                            }
                            
                            entity.Datas.Rotation += 100 * (gameTime / 1000);
                            
                            if (typeof entity.Datas.ElementToMove !== 'undefined') {
                                entity.Datas.ElementToMove.rotate(entity.Datas.Rotation);
                            }
        				},
            			function(entity, gameTime) {
                            //render
            			}),
                	[],
                    []);
                    
    entitySystem.RegisterComponent('MovementUpdater',
        new entitySystem.Component(function(entity, gameTime) {
            //assigned
        },
        function(entity, gameTime) {
            //removed
        },
        function(entity, gameTime) {
            //update
            
            var rot = entity.Datas.Rotation;

            entity.Datas.Heading.Init(Math.cos(rot), Math.sin(rot)).Normalize();

            entity.Datas.Position.Add(entity.Datas.Heading.Multiply(entity.Datas.Speed).Multiply(gameTime / 1000));
            
            if (typeof entity.Datas.ElementToMove !== 'undefined') {
                var div = entity.Datas.ElementToMove;
                div.css('left', entity.Datas.Position.X);
                div.css('top', entity.Datas.Position.Y);
            }
        },
        function(entity, gameTime) {
            //render
        }),
        [],
        ['Position', 'Speed', 'Heading']);
        
    var toRadians = Math.PI/180;
    entitySystem.RegisterComponent('ImageCanvasRenderer', 
        new entitySystem.Component(function(entity, gameTime) {
            //assigned
        },
        function(entity, gameTime) {
            //removed
        },
        function(entity, gameTime) {
            //update
        },
        function(entity, gameTime) {
            //render
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
        }),
        [],
        ['Position', 'Rotation', 'ImageToRender', 'ContextToRenderOn']);
        
    entitySystem.RegisterComponent('CellAnimationUpdater', 
        new entitySystem.Component(function(entity, gameTime) {
            //assigned
            if (typeof entity.Datas.Animation === 'undefined') {
                entity.Datas.Animation = new CellAnimation(entity.Datas.ImageFile, entity.Datas.CellX, entity.Datas.CellY, entity.Datas.FrameCount, entity.Datas.FramesPerSecond);
            }
            
            entity.Datas.FrameDelta = 0;
            entity.Datas.CurrentFrame = 0;
        },
        function(entity, gameTime) {
            //removed
        },
        function(entity, gameTime) {
            //update
            entity.Datas.Animation.FrameDelta = entity.Datas.FrameDelta;
            entity.Datas.Animation.CurrentFrame = entity.Datas.CurrentFrame;
            
            entity.Datas.Animation.UpdateCell(gameTime);
            if (typeof entity.Datas.Animation.CurrentImage !== 'undefined') {
                entity.Datas.ImageToRender = entity.Datas.Animation.CurrentImage;   
            }
            
            entity.Datas.FrameDelta = entity.Datas.Animation.FrameDelta;
            entity.Datas.CurrentFrame = entity.Datas.Animation.CurrentFrame;
        },
        function(entity, gameTime) {
            //render
        }),
        ['ImageCanvasRenderer'],
        ['ImageFile', 'CellX', 'CellY', 'FrameCount', 'FramesPerSecond']);
    
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
        var animation = new CellAnimation("pokemon_sprites_1_151_by_dragonite14.png", 24, 26, 608, 10,
                                function() { animation.ChangeAnimationBounds(0, 3); });
        
        //var animation = new CellAnimation("rolling_dot.png", 4, 1, 4, 5);
        //var animation = new CellAnimation("swirls.png", 3, 3, 9, 60);
        var createNewElement = (function(x, y) {
                var ent = entitySystem.CreateEntity();
                
                //var newDiv = $('<div id="getsMoved"><img width="3" height="3" src="star.png"></img></div>');
                
                //ent.Datas.ElementToMove = newDiv.appendTo(bodyElem);
                
                ent.Datas.Speed = 1000;//i + 1;
                ent.Datas.Position = new V2(x, y);
                
                //newDiv.css('left', ent.Datas.Position.X);
                //newDiv.css('top', ent.Datas.Position.Y);
                
                ent.Datas.Heading = new V2();
                
                ent.Datas.Rotation = 0;
                
                ent.Datas.ContextToRenderOn = canvasContext;
                ent.Datas.ImageToRender = image;            
                
                ent.Datas.ImageFile = "pokemon_sprites_1_151_by_dragonite14.png";
                ent.Datas.CellX = 24;
                ent.Datas.CellY = 26;
                ent.Datas.FrameCount = 608;
                ent.Datas.FramesPerSecond = 5;
                
                ent.Datas.Animation = animation;
                
                ent.AddComponent('CellAnimationUpdater');
                    
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
            animationEntity.AddComponent('CellAnimationUpdater');
        };
        //random elements to make.
        
        var createMultipleRandomElements = function(amountOfEntitiesToMake) {
            for (i = 0; i < amountOfEntitiesToMake; i++) {
                createNewElement(RandomFromTo(0, docWidth), RandomFromTo(0, docHeight));
            }
        }
        
        createMultipleRandomElements(entitySystem.IsOnTouchDevice ? 250 : 1000);
        
        $(document).ready(function () {
            $(window).keydown(function(args) {
                var char = String.fromCharCode(args.which);
                /*if (typedYet) {
                    $('div[id=getsMoved]').text(function(index, text) {
                        return text + char;  
                    });
                } else {
                    $('div[id=getsMoved]').text(function(index, text) {
                        return char;  
                    });
                    typedYet = true;
                }*/
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
                } else if (char === 'N') {
                    if ((animation.EndFrame + 4) >= animation.Frames.length) {
                        animation.ChangeAnimationBounds(0, 3);
                    } else {
                        animation.ChangeAnimationBounds(animation.StartFrame + 4, animation.EndFrame + 4);   
                    }
                    for (entIndex = 0; entIndex < entitySystem.EntityUpdateList.length; entIndex++) {
                        entitySystem.EntityUpdateList[entIndex].Datas.CurrentFrame = animation.CurrentFrame;
                    }
                } else if (char === 'P') {
                    if ((animation.StartFrame - 4) < 0) {
                        animation.ChangeAnimationBounds(animation.Frames.length - 4, animation.Frames.length - 1);
                    } else {
                        animation.ChangeAnimationBounds(animation.StartFrame - 4, animation.EndFrame - 4);   
                    }
                    for (entIndex = 0; entIndex < entitySystem.EntityUpdateList.length; entIndex++) {
                        entitySystem.EntityUpdateList[entIndex].Datas.CurrentFrame = animation.CurrentFrame;
                    }
                }
            });
        });
        
//        var elementsToMake = 10;
//        var divisor = 0;
//        var maxDivisions = 10;
//        for (divisor = 0; divisor < (maxDivisions - 1); divisor++) {
//            for (i = 0; i < elementsToMake; i++) {
//                createNewElement(docWidth * ((divisor + 1) / maxDivisions), docHeight * (i / elementsToMake));
//            }
//                    
//            for (i = 0; i < elementsToMake; i++) {
//                createNewElement(docWidth * (i / elementsToMake), docHeight * ((divisor + 1) / maxDivisions));
//            }
//        }
    })();
    
    entitySystem.StartUpdating();
});