export type NoiseLevel='quiet'|'moderate'|'loud'
export type LightingLevel='soft'|'normal'|'strong'
export type CrowdLevel='few'|'some'|'busy'
export interface SensoryPreferences{preferLowNoise:boolean;avoidStrongLighting:boolean;crowdsAcceptable:boolean;needSeating:boolean;preferQuietArea:boolean;needStepFree:boolean}
export interface PlaceFilters{category?:string;maxNoise?:NoiseLevel;maxCrowding?:CrowdLevel;lighting?:LightingLevel;needsSeating?:boolean;needsQuietArea?:boolean;needsStepFree?:boolean;needsToilet?:boolean}
export interface SensoryProfile{noise:NoiseLevel|null;lighting:LightingLevel|null;crowding:CrowdLevel|null;seating:boolean|null;quietArea:boolean|null;stepFree:boolean|null;toilet?:boolean|null}
export interface ParsedNeedQuery{filters:PlaceFilters;unmatchedText:string;recognizedTerms:string[]}
export interface FitResult{percent:number|null;kind:'strong'|'good'|'mixed'|'insufficient';reasons:string[];knownCriteria:number;requestedCriteria:number}
