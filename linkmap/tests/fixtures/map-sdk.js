(() => {
  const record = (recordName, fields) => ({recordName, fields: Object.fromEntries(Object.entries(fields).map(([key,value]) => [key,{value}]))});
  const ref = recordName => ({recordName});
  const vertices = btoa(JSON.stringify([{latitude:1,longitude:1},{latitude:1,longitude:2},{latitude:2,longitude:1}]));
  const project = id => ref(id);
  const rows = {
    Project: [record('p1',{name:'Alpha Project'}),record('p2',{name:'Beta Project'})],
    Location: [record('l1',{name:'Entrance',description:'An accessible entrance',project:project('p1'),region:ref('r1'),layer:ref('ly1'),latitude:1.1,longitude:1.1,vertices}),
      record('l2',{name:'Roof',project:project('p1'),region:ref('r1'),layer:ref('ly2'),latitude:1.5,longitude:1.2}),
      record('l3',{name:'Courtyard',project:project('p1'),region:ref('r1'),latitude:1.2,longitude:1.4}),
      record('bad',{name:'Missing Coordinate',project:project('p1')}),
      record('b1',{name:'Beta Place',project:project('p2'),latitude:10,longitude:10})],
    Region: [record('r1',{name:'Building',project:project('p1')})],
    Layer: [record('ly1',{name:'First Floor',level:1,region:ref('r1'),project:project('p1')}),record('ly2',{name:'Roof Level',level:2,region:ref('r1'),project:project('p1')})],
    Item: [record('i1',{name:'Water bottle',project:project('p1')})],
  };
  const zone = {zoneName:'projectZone-web',ownerRecordName:'_defaultOwner'};
  window.__test = {queries:[],delays:{},maps:[],notices:[],rows,lookups:[],mapClicks:0};
  const database = {
    async fetchAllRecordZones(){return {zones:[{zoneID:zone}]};},
    async performQuery(query, options){
      window.__test.queries.push({query,options});
      const projectID = query.filterBy?.[0]?.fieldValue?.value?.recordName;
      if(window.__test.delays[projectID]) await new Promise(resolve => setTimeout(resolve,window.__test.delays[projectID]));
      return {records:query.recordType==='Project'?rows.Project:rows[query.recordType].filter(item=>item.fields.project?.value.recordName===projectID)};
    }
  };
  window.LinkMapAuth = {current:{state:'signed-in'},container:{privateCloudDatabase:database,sharedCloudDatabase:{...database,async fetchAllRecordZones(){return {zones:[]};}}},retry(){}};
  window.__test.auth = state => {window.LinkMapAuth.current={state};window.dispatchEvent(new CustomEvent('linkmap-auth',{detail:{state}}));};
  class Evented {constructor(){this.events={};} addEventListener(type,handler){(this.events[type]??=[]).push(handler);} emit(type,detail={}){for(const fn of this.events[type]||[])fn({type,...detail});}}
  class Coordinate {constructor(latitude,longitude){Object.assign(this,{latitude,longitude});}}
  class Region {constructor(center,span){Object.assign(this,{center,span});}}
  class Map extends Evented {
    constructor(id,options){super();this.element=document.getElementById(id);this.element.addEventListener('click',()=>window.__test.mapClicks++);this.annotations=[];this.overlays=[];this.options=options;this.region=new Region(new Coordinate(1,1),{});window.__test.maps.push(this);}
    addAnnotation(value){this.addAnnotations([value]);}
    addAnnotations(values){this.annotations.push(...values);}
    removeAnnotations(values){this.annotations=this.annotations.filter(value=>!values.includes(value));}
    addOverlay(value){this.addOverlays([value]);}
    addOverlays(values){this.overlays.push(...values);}
    removeOverlays(values){this.overlays=this.overlays.filter(value=>!values.includes(value));}
    showItems(values,options){for(const value of values){if('coordinate'in value&&!this.annotations.includes(value))this.annotations.push(value);}this.lastFit={values,options};}
    setRegionAnimated(region){this.region=region;}
    selectAnnotation(annotation){this.emit('select',{annotation});}
  }
  class Annotation extends Evented {constructor(coordinate,options){super();Object.assign(this,{coordinate},options);}}
  class Overlay {constructor(points,options){Object.assign(this,{points},options);}}
  window.mapkit = {
    addEventListener(){},FeatureVisibility:{Visible:1},Map,Coordinate,CoordinateRegion:Region,
    MapFeatureType:{PointOfInterest:'point-of-interest',Territory:'territory',PhysicalFeature:'physical-feature'},
    MapFeatureAnnotation:class{constructor(name){this.name=name;}},
    PlaceSelectionAccessory:class{constructor(options){this.options=options;}},
    PlaceLookup:class{getPlace(annotation){return new Promise((resolve,reject)=>window.__test.lookups.push({annotation,resolve,reject}));}},
    CoordinateSpan:class{constructor(latitudeDelta,longitudeDelta){Object.assign(this,{latitudeDelta,longitudeDelta});}},
    MarkerAnnotation:Annotation,Annotation,Padding:class{},Style:class{constructor(options){Object.assign(this,options);}},PolygonOverlay:Overlay,PolylineOverlay:Overlay,
    Search:class {
      async autocomplete(query){return {results:[{displayLines:[query,'Test address']}]};}
      async search(query){return {places:[{name:typeof query==='string'?query:query.displayLines[0],formattedAddress:'Test address',coordinate:new Coordinate(3,4)}]};}
    },
    PlaceDetail:class{constructor(container,place){container.textContent='Apple place details: '+place.name;}destroy(){}}
  };
})();
