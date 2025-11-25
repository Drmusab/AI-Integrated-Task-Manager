const express = require('express');
const router = express.Router();

const { subscribe, getEventsSince } = require('../services/eventBus');
const { db } = require('../utils/database');

const writeEvent = (res, event) => {
  res.write(`id: ${event.id}\n`);
  res.write(`event: ${event.resource}.${event.action}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
};

router.get('/events', async (req, res) => {
  const { since, lastEventId, limit, events, board_id, priority } = req.query;
  let filteredEvents = getEventsSince({ since, lastEventId, limit });
  
  // Filter by event types if specified
  if (events) {
    const eventTypes = events.split(',').map(e => e.trim());
    filteredEvents = filteredEvents.filter(event => {
      // Event type format in n8n: 'task.created', 'task.updated', etc.
      // Event format in backend: { resource: 'task', action: 'created' }
      const eventType = `${event.resource}.${event.action}`;
      return eventTypes.includes(eventType);
    });
  }
  
  // Filter by board_id if specified
  if (board_id) {
    const boardIdNum = parseInt(board_id, 10);
    
    // Filter asynchronously because we need to lookup column->board mapping for tasks
    const promises = filteredEvents.map(async (event) => {
      // For board events, check the board.id directly
      if (event.resource === 'board' && event.data && event.data.board) {
        return event.data.board.id === boardIdNum;
      }
      
      // For task events, lookup the board through the column
      if (event.resource === 'task' && event.data && event.data.task) {
        try {
          const column = await new Promise((resolve, reject) => {
            db.get(
              'SELECT board_id FROM columns WHERE id = ?',
              [event.data.task.column_id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });
          return column && column.board_id === boardIdNum;
        } catch (error) {
          return false;
        }
      }
      
      // For other event types, check if data.board_id exists
      return event.data && event.data.board_id === boardIdNum;
    });
    
    const results = await Promise.all(promises);
    filteredEvents = filteredEvents.filter((_, index) => results[index]);
  }
  
  // Filter by priority if specified
  if (priority) {
    filteredEvents = filteredEvents.filter(event => 
      event.data && event.data.task && event.data.task.priority === priority
    );
  }
  
  res.json(filteredEvents);
});

router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.flushHeaders();

  const { since, lastEventId, limit } = req.query;
  const headerLastEventId = req.get('last-event-id');
  const backlog = getEventsSince({
    since,
    lastEventId: headerLastEventId || lastEventId,
    limit,
  });

  backlog.forEach((event) => writeEvent(res, event));

  const unsubscribe = subscribe((event) => {
    writeEvent(res, event);
  });

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write('data: {}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

module.exports = router;
