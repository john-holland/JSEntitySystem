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
    
    this.MousePos = new V2();
    
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
    	var requiredData = component.RequiredData;
    	var requiredComponents = component.RequiredComponents;
    	
    	if (!(componentName in entity.Components)) {
    		entity.Components[componentName] = engine.Components[componentName];
    		entity.UpdateComponents.push(engine.Components[componentName]);
    	}
    	
    	for (var key in component.RequiredComponents) {
    		if (typeof key === 'String' && !(key in entity.Components)) {
    			engine.AddComponentWithRequirements(entity, key);
    		}
    	}
    	
    	for (var key in component.RequiredData) {
    		if (typeof key === 'String' && !(key in entity.Datas)) {
    			entity.Datas[key] = component.RequiredData[key];
    		}
    	}
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
    }
    
    this.GameStart = (new Date()).getMilliseconds();
    this.LastUpdateTime = this.GameStart;
    
    this.IntervalUpdateFunc = function() {
        var currentTime = (new Date()).getMilliseconds();
        
        engine.Update(currentTime - engine.LastUpdateTime);
        
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
}

$(function() {
    var entitySystem = new JSEntitySystem(32);
    
    //TODO: This 'TestComponent' should be reworked into a 'FollowMouse' component that takes an element reference in its Datas.
    entitySystem.RegisterComponent('TestComponent',
        new entitySystem.Component(function(entity, gameTime) {
                            //assigned
        				},
            			function(entity, gameTime) {
                            //removed
        				},
            			function(entity, gameTime) {
                            //update
                            if (typeof entity.counter === 'undefined') {
                                entity.counter = 0;
                            }
                            
                            entity.counter++;
                            
                            var div = $('#jsDiv' + entity.Datas.div);
                            var divPos = div.position();
                            
                            //A -> B :: B - A
                            var currentPos = new V2(divPos.left, divPos.top);
                            
                            var toMouse = entitySystem.MousePos
                                                      .Sub(currentPos)
                                                      .Normalize()
                                                      .Multiply(entity.Datas.distanceFromUpperLeft);
                            
                            toMouse = toMouse.Add(currentPos);
                            div.css('left', toMouse.X);
                            div.css('top', toMouse.Y);
                            
        				},
            			function(entity, gameTime) {
                            //render
            			}),
                	[],
                    []);
    
    (function() {
        var i = 0;
        
        for (i = 0; i < 100; i++) {
            (function() {
                var ent = entitySystem.CreateEntity();    
                ent.Datas.distanceFromUpperLeft = (i + 1) / 10;
                
                $('body').append($('<div id="jsDiv' + i + '">a</div>'));
                
                $('#jsDiv' + i).css('position', 'absolute');
                ent.Datas.div = i;
                
                ent.AddComponent('TestComponent');
            })();
        }
    })();
    
    entitySystem.StartUpdating();
});