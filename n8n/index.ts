import { KanbanApp } from './nodes/KanbanApp/KanbanApp.node';
import { KanbanAppTrigger } from './nodes/KanbanApp/KanbanAppTrigger.node';
import { KanbanAppApi } from './credentials/KanbanAppApi.credentials';

export const nodes = [KanbanApp, KanbanAppTrigger];
export const credentials = [KanbanAppApi];

