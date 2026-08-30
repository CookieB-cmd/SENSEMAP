export interface SearchBias{lat:number;lng:number}
export interface ExternalSearchPlace{id:string;source:'osm';sourceType:'node'|'way'|'relation';sourceId:string;name:string;category:string|null;address:string|null;lat:number;lng:number}
export interface DiscoveryBounds{south:number;west:number;north:number;east:number}
