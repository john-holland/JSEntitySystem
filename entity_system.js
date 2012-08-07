
function JSEntitySystem() {
    this.NextFreeId = 0;
    var engine = this;
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
      Datas is an associative object for holding data.
    */
    this.Datas = { };
    
    /*
      Entities is an associative object for holding entities.
    */
    this.Entities = { };
    
    /*
      EntityUpdateList is an array used to update the entities for the engine.
    */    
    this.EntityUpdateList = [];
    
    this.Component = function(assigned, removed, update, render) {
    	this.Assigned = assigned;
    	this.Removed = removed;
    	this.Update = update;
    	this.Render = render;
    }
    
    this.RegisterComponent = function(componentName, component, requiredComponents, requiredData) {
    	engine.Components[componentName] = {
    		ComponentName : componentName,
    		Methods : component,
    		RequiredComponents : requiredComponents,
    		RequiredData : requiredData
    	};
    }
    
    this.AddComponent = function(entity, componentName) {
    	var component = engine.Components[componentName];
    	var requiredData = component.RequiredData;
    	var requiredComponents = component.RequiredComponent;
    	
    	if (!(componentName in entity.Components)) {
    		entity.Components[componentName] = engine.Components[componentName];
    		entity.UpdateComponents.push(engine.Components[componentName]);
    	}
    	
    	for (var key in component.RequiredComponents) {
    		if (!(key in entity.Components)) {
    			engine.AddComponent(entity, key);
    		}
    	}
    	
    	for (var key in component.RequiredData) {
    		if (!(key in entity.Datas)) {
    			entity.Datas[key] = component.RequiredData[key];
    		}
    	}
    }
    
    //May have to make a CreateEntity function.
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
    	
        this.AddComponent = function(componentName) {
    		if (!(componentName in this.components)) {
    			//recursively add components here.
    			//make sure to add each components required data here as well.
    			engine.AddComponent(this, componentName);
    		}
    	};
        
        this.RemoveComponent = function(componentName) {
            if (componentName in this.Components) {
                delete this.Components[componentName];
            }
        };
    	
    	this.Update = function(gameTime) {
    		var i = 0;
    		for (i = 0; i < this.UpdateComponents.length; i++) {
    			this.UpdateComponents[i].Update(self, gameTime);
    		}
    	};
    	
    	engine.Entities[this.Id] = this;
        engine.EntityUpdateList.push(this);
    }
    
    this.RemoveEntity = function(entityId) {
        var entityToRemove = engine.Entities[entityId];
        
        if (entityToRemove === null) {
            return;
        }
        
        var indexOfEntity = engine.EntityUpdateList.indexOf(entityToRemove);
        
        if (indexOfEntity !=== -1) {
            engine.EntityUpdateList.splice(indexOfEntity, 1);
        }
        
        delete engine.Entities[entityId];
    }
    
    this.Update(gameTime) {
        var i;
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
        
        engine.UpdateIntervalKey = setInterval(engine.IntervalUpdateFunc);
    }
    
    this.StopUpdating = function() {
        if (typeof engine.UpdateIntervalKey !== 'undefined') {
            clearInterval(engine.UpdateIntervalKey);
            delete engine.UpdateIntervalKey;
        }
    }
}

var entitySystem = new JSEntitySystem();

entitySystem.RegisterComponent('TestComponent',
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
        			}),
            	[],
                []);

entitySystem.StartUpdating();

var ent = new entitySystem.Entity();