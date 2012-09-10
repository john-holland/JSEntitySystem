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
function JSEntitySystem(updateIntervalMilliseconds, canvasContext, fillColor) {
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
      This array keeps track of touch positions in a multitouch environment
      MousePos will still be set, but this will be viable if IsOnTouchDevice === true;
    */
    this.TouchPositions = [];
    
    /*
      Currently, the engine uses HTML elements to render, so we don't really need this call to be made.
      When we switch over to canvas rendering, this should be switched to true, 
      and really
      TODO: Elements should have individual ShouldRender bools.
    */
    this.ShouldRender = true;
    
    this.IsMouseDown = false;
    
    //Initialization logic takes place wrapped in a function so that it doesn't interfere with the engine object, unless explicitly meant to.
    (function() {
        /*
          The jQuery callback used for the mouse movement callback and grab the latest mouse coordinates.
        */
        $("#myCanvas").ready(function() {
            var canvasElem = $("#myCanvas");
           canvasElem.mousemove(function(e) {
              engine.MousePos.X = e.pageX;
              engine.MousePos.Y = e.pageY;
           });
           
           canvasElem.mousedown(function() {
               engine.IsMouseDown = true;
           });
           
           canvasElem.mouseup(function() {
               engine.IsMouseDown = false;
           });
        });
           
        if ('ontouchstart' in document.documentElement) {
            engine.IsOnTouchDevice = true;
        } else {
            engine.IsOnTouchDevice = false;
        }
        
        //helped out: http://www.codeproject.com/Articles/355230/HTML-5-Canvas-A-Simple-Paint-Program-Touch-and-Mou
        if (engine.IsOnTouchDevice) {
            //we're on a touch device.
            var canvasElement = $("#myCanvas")[0];
            var updateEngineMousePosFromEventArgs = function(args) {
                engine.MousePos.X = args.targetTouches[0].pageX;
                engine.MousePos.Y = args.targetTouches[0].pageY;
                                
                engine.TouchPositions = [];
                
                var i = 0;
                for (i = 0; i < args.targetTouches.length; i++) {
                    engine.TouchPositions.push(new V2(args.targetTouches[i].pageX, args.targetTouches[i].pageY));
                }
            };
            canvasElement.addEventListener('touchstart', function (args) {
                engine.IsMouseDown = true;
                updateEngineMousePosFromEventArgs(args);
            }, false);
            canvasElement.addEventListener('touchmove', function (args) {
                engine.IsMouseDown = true;
                updateEngineMousePosFromEventArgs(args);
                args.preventDefault();
            }, false);
            canvasElement.addEventListener('touchend', function (args) {
                engine.IsMouseDown = false;
                updateEngineMousePosFromEventArgs(args);
            }, false);
        }
    })();
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
        
        var docHeight = $(document).height();
        var docWidth = $(document).width();
        canvasContext.fillStyle = fillColor;
        canvasContext.fillRect(0,0,docWidth,docHeight);
        
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
            $('#fps').text("FPS: " + engine.FrameCountThisSecond);
            engine.FrameCountThisSecond = 0;
            
            $('#entityCount').text((engine.IsOnTouchDevice ? "Mobile!" : "") + "Entity Count: " + engine.EntityUpdateList.length);
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