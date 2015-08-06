/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

var App = require('app');

App.serviceMapper = App.QuickDataMapper.create({
  model: App.Service,
  config: {
    id: 'ServiceInfo.service_name',
    service_name: 'ServiceInfo.service_name',
    work_status: 'ServiceInfo.state',
    passive_state: 'ServiceInfo.passive_state'
  },
  initialAppLoad: false,
  map: function (json) {
    console.time("App.serviceMapper execution time");
    var self = this;
    json.items.forEach(function (service) {
      var cachedService = App.cache['services'].findProperty('ServiceInfo.service_name', service.ServiceInfo.service_name);
      if (cachedService) {
        // restore service workStatus
        App.Service.find(cachedService.ServiceInfo.service_name).set('workStatus', service.ServiceInfo.state);
        cachedService.ServiceInfo.state = service.ServiceInfo.state;
        cachedService.ServiceInfo.passive_state = service.ServiceInfo.maintenance_state;
      } else {
        var serviceData = {
          ServiceInfo: {
            service_name: service.ServiceInfo.service_name,
            state: service.ServiceInfo.state,
            passive_state: service.ServiceInfo.maintenance_state
          },
          host_components: [],
          components: []
        };
        App.cache['services'].push(serviceData);
      }
    });

    if (!this.get('initialAppLoad')) {
      var parsedCacheServices = App.cache['services'].map(function(item){
        App.serviceMetricsMapper.mapExtendedModel(item);
        return self.parseIt(item, self.get('config'));
      });
      App.store.loadMany(this.get('model'), parsedCacheServices);
      App.store.commit();
      this.set('initialAppLoad', true);
    }
    console.timeEnd("App.serviceMapper execution time");
  }
});
