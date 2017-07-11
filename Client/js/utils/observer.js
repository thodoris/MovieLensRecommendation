function observe(object, observerCallback) {
  var observing = true;
  const proxyObject = new Proxy(object, {
    //  get: function (object, property) {
    //     console.info(`Get on property "${property}"`)
    //     return object[property];
    //   },
    set: function (object, property, value) {
      var hadProperty = Reflect.has(object, property);
      var oldValue = hadProperty && Reflect.get(object, property);
      var returnValue = Reflect.set(object, property, value);
      if (observing && hadProperty) {
        observerCallback({ object: proxyObject, type: 'update', name: property, oldValue: oldValue });
      } else if(observing) {
        observerCallback({ object: proxyObject, type: 'add', name: property });
      }
      return returnValue;
    },
    deleteProperty: function (object, property) {
      var hadProperty = Reflect.has(object, property);
      var oldValue = hadProperty && Reflect.get(object, property);
      var returnValue = Reflect.deleteProperty(object, property);
      if (observing && hadProperty) {
        observerCallback({ object: proxyObject, type: 'delete', name: property, oldValue: oldValue });
      }
      return returnValue;
    },
    defineProperty: function (object, property, descriptor) {
      var hadProperty = Reflect.has(object, property);
      var oldValue = hadProperty && Reflect.getOwnPropertyDescriptor(object, property);
      var returnValue = Reflect.defineProperty(object, property, descriptor);
      if (observing && hadProperty) {
        observerCallback({ object: proxyObject, type: 'reconfigure', name: property, oldValue: oldValue });
      } else if(observing) {
        observerCallback({ object: proxyObject, type: 'add', name: property });
      }
      return returnValue;
    },
    preventExtensions: function (object) {
      var returnValue = Reflect.preventExtensions(object);
      if (observing) {
        observerCallback({ object: proxyObject, type: 'preventExtensions' })
      }
      return returnValue;
    },
  });
  return { object: proxyObject, unobserve: function () { observing = false } };
}