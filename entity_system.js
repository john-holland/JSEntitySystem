/*
  A simple entity system with an entity centric component / data model.
  
  TODO: 
    -Need to find a dependency injection system for components.
    -Need to think through data factories, probably should something like:
        JSEntitySystem.Datas holds a collection of primitive values, object values or functions.
        When a Component gets added, the system should look at the Datas collection for the value it should provide.
        If the system sees the Datas["requestedData"] in question is a primitive or object, it simply copies that in.
        If the system sees the Datas["requestedData"] in question is a function however, it should call that function.
        This adds the edge case of having to get around the need to put a function into Datas["requestedData"],
        this however can be surpassed by wrapping the function you would like in the Datas collection in another function:
            Datas["requestedData"] = function() { return function() { return "ouch, syntax heavy :("; }};
        I could make a factory function to act as a wrapper:
            Datas["requestedData"] = engine.DataFunction(function() { return "slightly better? I don't know really." });
        This could then be checked against by:
            var isDataFunction = (Datas["requestedData"].constructor === JSEntitySystem.DataFunction);
        Then retrieved:
            return Datas["requestedData"].wrappedFunction;
*/
function JSEntitySystem(updateIntervalMilliseconds) {
    /*
      This is the next free Id ready to be assigned to an entity.
    */
    this.NextFreeId = 0;
    
    /*
      The interval to use for the setInterval function.
    */
    this.UpdateIntervalMilliseconds = updateIntervalMilliseconds;
    
    /*
      The variable used to hold the scope of the JSEntitySystem function.
    */
    var engine = this;
    
    /*
      The MousePos is the current V2 of the mouse.
    */
    this.MousePos = new V2();
    
    /*
      Currently, the engine uses HTML elements to render, so we don't really need this call to be made.
      When we switch over to canvas rendering, this should be switched to true, 
      and really
      TODO: Elements should have individual ShouldRender bools.
    */
    this.ShouldRender = false;
    
    /*
      The jQuery callback used for the mouse movement callback and grab the latest mouse coordinates.
    */
    $(document).ready(function() {
       $(document).mousemove(function(e) {
          engine.MousePos.X = e.pageX;
          engine.MousePos.Y = e.pageY;
       })}); 
    
    /*
    The component metadata collection.
    keyed on the componentName, toLowered
    Component["name"] =    {
        ComponentName : "name",
    	Methods : {
    		Assigned : method,
    		Removed : method,
    		Update : method,
    		Render : method
    	},
    	RequiredComponents : array of strings,
    	RequiredData : array of data names
    }
    */
    this.Components = { };
    
    /*
      Datas is a map for holding data.
    */
    this.Datas = { };
    
    /*
      Entities is a map for holding entities.
    */
    this.Entities = { };
    
    /*
      EntityUpdateList is an array used to update the entities for the engine.
    */    
    this.EntityUpdateList = [];
    
    /*
      The factory for the Component methods.
    */
    this.Component = function(assigned, removed, update, render) {
    	this.Assigned = assigned;
    	this.Removed = removed;
    	this.Update = update;
    	this.Render = render;
    }
    
    /*
      Registers a Component by name in the Components map.
    */
    this.RegisterComponent = function(componentName, component, requiredComponents, requiredData) {
    	engine.Components[componentName] = {
    		ComponentName : componentName,
    		Methods : component,
    		RequiredComponents : requiredComponents,
    		RequiredData : requiredData
    	};
    }
    
    /*
      Adds a component to the entity passed in.
    */
    this.AddComponentWithRequirements = function(entity, componentName) {
    	var component = engine.Components[componentName];
    	
    	if (!(componentName in entity.Components)) {
    		entity.Components[componentName] = engine.Components[componentName];
    		entity.UpdateComponents.push(engine.Components[componentName]);
    	}
    	
        var i = 0;
    	for (; i < component.RequiredComponents.length; i++) {
    		if (!(component.RequiredComponents[i] in entity.Components)) {
    			engine.AddComponentWithRequirements(entity, component.RequiredComponents[i]);
    		}
    	}
    	
        i = 0;
        for (; i < component.RequiredData.length; i++) {
    		if (!(component.RequiredData[i] in entity.Datas)) {
                //TODO: Implement required data factory. See TODO at top of class.
        		  throw new Error("Entity does not have data: " + component.RequiredData[i] + ", required by component: " + componentName);
    		}
    	}
        
        engine.Components[componentName].Methods.Assigned(entity, engine.LastUpdateTime);
    }
    
    /*
      The Entity factory method used by the engine to make new entities.
    */
    this.Entity = function(idToUse) {
        var self = this;
        
        if (typeof idToUse == 'number') {
            if (engine.Entities.Any(function(ent) { ent.Id == idToUse })) {
                throw new Error("Tried to create an entity with an explicity Id that already existed! Entity in question: " + idToUse);
                return;
            }
            
            this.Id = idToUse;
        } else {
            engine.NextFreeId = engine.NextFreeId + 1;
            this.Id = engine.NextFreeId;    
        }
        
    	this.Datas = {
    	};
    	this.Components = {
    	};
        
    	this.UpdateComponents = [];
    	
        //Adds a component and any dependencies.
        this.AddComponent = function(componentName) {
    		if (!(componentName in self.Components)) {
    			//recursively add components here.
    			//make sure to add each components required data here as well.
    			engine.AddComponentWithRequirements(self, componentName);
    		}
    	};
        
        this.RemoveComponent = function(componentName) {
            if (componentName in self.Components) {
                self.Components[componentName].Methods.RemoveComponent(self, engine.LastUpdateTime);
                delete self.Components[componentName];
            }
        };
    	
    	this.Update = function(gameTime) {
    		var i = 0;
    		for (i = 0; i < self.UpdateComponents.length; i++) {
    			self.UpdateComponents[i].Methods.Update(self, gameTime);
    		}
    	};
        
        this.Render = function(gameTime) {
            var i = 0;
            for (i = 0; i < self.UpdateComponents.length; i++) {
                self.UpdateComponents[i].Methods.Render(self, gameTime);
            }
        }
    	
    	engine.Entities[this.Id] = this;
        engine.EntityUpdateList.push(this);
    }
    
    this.CreateEntity = function(idToUse) {
        return new engine.Entity(idToUse);
    }
    
    this.RemoveEntity = function(entityId) {
        var entityToRemove = engine.Entities[entityId];
        
        if (entityToRemove === null) {
            return;
        }
        
        var indexOfEntity = engine.EntityUpdateList.indexOf(entityToRemove);
        
        if (indexOfEntity !== -1) {
            engine.EntityUpdateList.splice(indexOfEntity, 1);
        }
        
        delete engine.Entities[entityId];
    }
    
    this.Update = function(gameTime) {
        var i = 0;
        for(i = 0; i < engine.EntityUpdateList.length; i++) {
            engine.EntityUpdateList[i].Update(gameTime);
        }
        
        if (!engine.ShouldRender) {
            return;
        }
        
        for (i = 0; i < engine.EntityUpdateList.length; i++) {
            engine.EntityUpdateList[i].Render(gameTime);
        }
    }
    
    this.GameStart = (new Date()).getMilliseconds();
    this.LastUpdateTime = this.GameStart;
    
    this.FrameCountThisSecond = 0;
    this.LastSecondTime = 0;
    
    this.IntervalUpdateFunc = function() {
        var currentTime = (new Date()).getMilliseconds();
        var updateDelta = currentTime - engine.LastUpdateTime;

        
        //TODO: HACK: This sometimes comes out as a value ~-361 which... is wrong.
        //As far as I know, javascript isn't capable of time travel...
        if (updateDelta < 0) {
            updateDelta = engine.UpdateIntervalMilliseconds;
        }
        
        engine.LastSecondTime += updateDelta;
        
        if (engine.LastSecondTime > 1000) {
            engine.LastSecondTime -= 1000;
            $('#diagDiv').text("FPS: " + engine.FrameCountThisSecond);
            engine.FrameCountThisSecond = 0;
        }
        
        engine.FrameCountThisSecond++;
        
        engine.Update(updateDelta);
        
        engine.LastUpdateTime = currentTime;
    }
    
    this.StartUpdating = function() {
        engine.StopUpdating();
        
        engine.UpdateIntervalKey = setInterval(engine.IntervalUpdateFunc, engine.UpdateIntervalMilliseconds);
    }
    
    this.StopUpdating = function() {
        if (typeof engine.UpdateIntervalKey !== 'undefined') {
            clearInterval(engine.UpdateIntervalKey);
            delete engine.UpdateIntervalKey;
        }
    }
    
    /*
      Data should be passed in as json objects.
    */
    this.AddData = function(dataName, data) {
        engine.Datas[dataName] = data;
    }
}

$(function() {
    var entitySystem = new JSEntitySystem(16);
    
    //TODO: This 'TestComponent' should be reworked into a 'FollowMouse' component that takes an element reference in its Datas.
    entitySystem.RegisterComponent('FollowMouse',
        new entitySystem.Component(function(entity, gameTime) {
                            //assigned
                            entity.Datas.ElementToMove.css('position', 'absolute');
                            entity.Datas.ElementToMove.css('width','2em');
                            
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
        				},
            			function(entity, gameTime) {
                            //removed
        				},
            			function(entity, gameTime) {
                            //update
                            
                            var div = entity.Datas.ElementToMove;
                            var divPos = div.position();
                            
                            //A -> B :: B - A
                            var currentPos = entity.Datas.Position.Init(divPos.left, divPos.top);
                            var toMouse = entity.Datas.ToMouse.InitFromV2(entitySystem.MousePos)
                                                              .Sub(currentPos);
                            var speedModifier = 1;
                            var lengthToMouse = toMouse.Length();
                            
                            var sensingDistance = 400;
                            
                            if (lengthToMouse < 20) {
                                entity.Datas.Speed = 0.1;
                            } else if (lengthToMouse < sensingDistance) {
                                entity.Datas.Speed = entity.Datas.OriginalSpeed * ((lengthToMouse / sensingDistance) - 0.5);
                            } else {
                                if (typeof entity.Datas.OriginalPos !== 'undefined') {
                                    entity.Datas.Speed = entity.Datas.OriginalSpeed;
                                    toMouse = entity.Datas.ToMouse.InitFromV2(entity.Datas.OriginalPos)
                                                                  .Sub(currentPos);
                                                                  
                                    if (toMouse.Length() < 40) {
                                        entity.Datas.Speed = 0;
                                        entity.Datas.Position.InitFromV2(entity.Datas.OriginalPos);
                                        return;
                                    }
                                } else {
                                    entity.Datas.Speed = 0;
                                }
                            }
                            
                            //toMouse.Normalize()
                            //       .Multiply(entity.Datas.Speed * (gameTime / 1000) * 5 * speedModifier);// * (5 * (Math.sin(entity.Datas.Counter) + 0.7)));
                            entity.Datas.Rotation = Math.atan2(toMouse.Y, toMouse.X);
                            //var rotation = Math.atan2(toMouse.Y, toMouse.X);
                            
                            //toMouse.Add(currentPos);
                            
                            
                            //div.css({ WebkitTransform: 'rotate(' + rotation + 'rad)'});
        				},
            			function(entity, gameTime) {
                            //render
            			}),
                	['MovementUpdater'],
                    ['Speed', 'ElementToMove']);
                    
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
                            
                            entity.Datas.ElementToMove.rotate(entity.Datas.Rotation);
        				},
            			function(entity, gameTime) {
                            //render
            			}),
                	[],
                    ['ElementToMove']);
                    
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
            
            var div = entity.Datas.ElementToMove;
            div.css('left', entity.Datas.Position.X);
            div.css('top', entity.Datas.Position.Y);
        },
        function(entity, gameTime) {
            //render
        }),
        [],
        ['Position', 'Speed', 'Heading', 'ElementToMove']);
    
    (function() {
        var typedYet = false;
        $(document).ready(function () {
            $(window).keydown(function(args) {
                if (typedYet) {
                    $('div[id=getsMoved]').text(function(index, text) {
                        return text + String.fromCharCode(args.which);  
                    });
                } else {
                    $('div[id=getsMoved]').text(function(index, text) {
                        return String.fromCharCode(args.which);  
                    });
                    typedYet = true;
                }
                
            });
        })
        
        var docHeight = $(document).height();
        var docWidth = $(document).width();
        var bodyElem = $('body');
        var createNewElement = (function(x, y) {
                var ent = entitySystem.CreateEntity();
                
                var newDiv = $('<div id="getsMoved"><img width="3" height="3" src="star.png"></img></div>');
                
                ent.Datas.ElementToMove = newDiv.appendTo(bodyElem);
                
                ent.Datas.Speed = 1000;//i + 1;
                ent.Datas.Position = new V2(x, y);
                
                newDiv.css('left', ent.Datas.Position.X);
                newDiv.css('top', ent.Datas.Position.Y);
                
                ent.Datas.Heading = new V2();
                
                ent.AddComponent('FollowMouse');
                
                ent.Datas.Rotation = 0;
            });
        var i = 0;
        
        //random elements to make.
        for (i = 0; i < 10; i++) {
            createNewElement(RandomFromTo(0, docWidth), RandomFromTo(0, docHeight));
        }
        
        var elementsToMake = 100;
        for (i = 0; i < elementsToMake; i++) {
            createNewElement(docWidth / 2, docHeight * (i / elementsToMake));
        }
        
        for (i = 0; i < elementsToMake; i++) {
            createNewElement(docWidth * (i / elementsToMake), docHeight / 2);
        }
    })();
    
    entitySystem.StartUpdating();
});