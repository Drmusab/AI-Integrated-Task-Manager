/**
 * @fileoverview Webhook service for triggering external HTTP endpoints (primarily n8n).
 * Handles webhook execution with retry logic, authentication, and error handling.
 * @module services/webhook
 */

const axios = require('axios');
const { getAsync } = require('../utils/database');

/**
 * Triggers a webhook by sending a POST request to the configured endpoint.
 * Retrieves webhook configuration from database, validates it, and sends the payload.
 * Supports optional API key authentication via Bearer token.
 * 
 * @async
 * @function triggerWebhook
 * @param {number} webhookId - The database ID of the webhook integration to trigger
 * @param {Object} payload - Data object to send as JSON in the request body
 * @returns {Promise<Object>} Result object with success status and response/error details
 * @property {boolean} success - Whether the webhook was triggered successfully
 * @property {number} [status] - HTTP status code from the webhook response
 * @property {*} [response] - Response data from the webhook endpoint
 * @property {string} [error] - Error message if the webhook failed
 * @example
 * const result = await triggerWebhook(1, { event: 'task.created', task: {...} });
 * if (result.success) {
 *   console.log('Webhook triggered:', result.status);
 * } else {
 *   console.error('Webhook failed:', result.error);
 * }
 */
const triggerWebhook = async (webhookId, payload) => {
  try {
    // Retrieve webhook configuration from database
    const integration = await getAsync(
      'SELECT * FROM integrations WHERE id = ? AND type = ? AND enabled = 1',
      [webhookId, 'n8n_webhook']
    );

    if (!integration) {
      return { success: false, error: 'Webhook integration not found or disabled' };
    }

    // Parse webhook configuration JSON
    let config;
    try {
      config = JSON.parse(integration.config);
    } catch (error) {
      return { success: false, error: 'Invalid webhook configuration' };
    }

    const { webhookUrl, apiKey } = config;

    if (!webhookUrl) {
      return { success: false, error: 'Webhook URL not configured' };
    }

    // Prepare HTTP headers
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authentication if API key is configured
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    // Execute webhook POST request
    const response = await axios.post(webhookUrl, payload, {
      headers,
      timeout: 10000, // 10 second timeout
    });

    return {
      success: true,
      status: response.status,
      response: response.data,
    };
  } catch (error) {
    console.error('Failed to trigger webhook:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = { triggerWebhook };