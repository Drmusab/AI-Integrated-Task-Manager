// Type workaround for n8n-workflow export issues
// Re-export types that exist in n8n-workflow but aren't properly exported

// Import the actual types from the esm build to avoid conflicts
import type * as n8nInterfaces from 'n8n-workflow/dist/esm/interfaces';
import type * as n8nErrors from 'n8n-workflow/dist/esm/errors';

declare module 'n8n-workflow' {
	// Re-export interface types
	export type IExecuteFunctions = n8nInterfaces.IExecuteFunctions;
	export type IHookFunctions = n8nInterfaces.IHookFunctions;
	export type ILoadOptionsFunctions = n8nInterfaces.ILoadOptionsFunctions;
	export type IWebhookFunctions = n8nInterfaces.IWebhookFunctions;
	export type IPollFunctions = n8nInterfaces.IPollFunctions;
	export type IHttpRequestOptions = n8nInterfaces.IHttpRequestOptions;
	export type INodeExecutionData = n8nInterfaces.INodeExecutionData;
	export type INodeType = n8nInterfaces.INodeType;
	export type INodeTypeDescription = n8nInterfaces.INodeTypeDescription;
	export type INodePropertyOptions = n8nInterfaces.INodePropertyOptions;

	// Re-export error classes
	export const NodeApiError: typeof n8nErrors.NodeApiError;
	export const NodeOperationError: typeof n8nErrors.NodeOperationError;
}
