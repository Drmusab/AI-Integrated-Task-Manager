// Type workaround for n8n-workflow export issues
// Re-declare types that are defined in n8n-workflow but not properly exported

declare module 'n8n-workflow' {
	// Re-export all interfaces
	export interface IExecuteFunctions {
		helpers: any;
		getInputData(): any[];
		getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): any;
		getCredentials(type: string): Promise<any>;
		getNode(): any;
		continueOnFail(): boolean;
		prepareOutputData(outputData: any[]): any;
		constructExecutionMetaData(inputData: any[], options: any): any;
		returnJsonArray(data: any): any[];
		helpers: {
			httpRequest(options: any): Promise<any>;
			returnJsonArray(data: any): any[];
			constructExecutionMetaData(inputData: any[], options: any): any;
		};
	}

	export interface IHookFunctions {
		helpers: any;
		getCredentials(type: string): Promise<any>;
		getNode(): any;
		helpers: {
			httpRequest(options: any): Promise<any>;
		};
	}

	export interface ILoadOptionsFunctions {
		helpers: any;
		getCredentials(type: string): Promise<any>;
		getNode(): any;
		helpers: {
			httpRequest(options: any): Promise<any>;
		};
	}

	export interface IWebhookFunctions {
		helpers: any;
		getCredentials(type: string): Promise<any>;
		getNode(): any;
		helpers: {
			httpRequest(options: any): Promise<any>;
		};
	}

	export interface IPollFunctions {
		helpers: any;
		getNodeParameter(parameterName: string): any;
		getWorkflowStaticData(type: string): any;
		getCredentials(type: string): Promise<any>;
		getNode(): any;
		helpers: {
			httpRequest(options: any): Promise<any>;
			returnJsonArray(data: any): any[];
			constructExecutionMetaData(inputData: any[], options: any): any;
		};
	}

	export interface IHttpRequestOptions {
		method: string;
		url: string;
		body?: any;
		qs?: any;
		headers?: any;
		json?: boolean;
	}

	export interface INodeExecutionData {
		json: any;
		binary?: any;
		pairedItem?: any;
	}

	export interface INodeType {
		description: INodeTypeDescription;
		execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
		poll?(this: IPollFunctions): Promise<INodeExecutionData[][] | null>;
	}

	export interface INodeTypeDescription {
		displayName: string;
		name: string;
		icon?: string | { light: string; dark: string };
		group: string[];
		version: number;
		subtitle?: string;
		description: string;
		defaults: {
			name: string;
		};
		inputs?: string[];
		outputs?: string[];
		credentials?: any[];
		polling?: boolean;
		properties: any[];
	}

	export interface INodePropertyOptions {
		name: string;
		value: string;
		description?: string;
		action?: string;
	}

	// Error classes
	export class NodeApiError extends Error {
		constructor(node: any, error: any);
	}

	export class NodeOperationError extends Error {
		constructor(node: any, message: string);
	}
}
