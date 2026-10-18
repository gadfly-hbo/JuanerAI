import type {ResearchGateway} from '../../packages/ports/deep-research.ts';
import type {ResearchProcess} from './process.mjs';
export function createResearchGateway(options:{process:ResearchProcess;programRoot:string}):ResearchGateway;
