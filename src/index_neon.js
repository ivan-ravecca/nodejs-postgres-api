require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
// const { APIGatewayProxyHandler } = require('aws-lambda');
const { body, validationResult } = require('express-validator');

const sanitizeInput = (input) => {
  return input.replace(/['";\-]/g, '');
};

const getEvents = async () => {
  const result = await sql`SELECT * FROM events ORDER BY id ASC`;
  return result;
};

const createEvent = async (eventId, notes, event, timestamp) => {
  const result =
    await sql`INSERT INTO events (eventId, notes, event, timestamp) VALUES (${eventId}, ${notes}, ${event}, ${timestamp}) RETURNING *`;
  return result[0];
};

const updateEvent = async (id, notes, timestamp, event) => {
  const result =
    await sql`UPDATE events SET notes = ${notes}, timestamp = ${timestamp}, event = ${event} WHERE eventid = ${id} RETURNING *`;
  return result[0];
};

const deleteEvent = async (id) => {
  const result =
    await sql`DELETE FROM events WHERE eventid = ${id} RETURNING *`;
  return result[0] || null;
};

const getEventById = async (eventId) => {
  const result = await sql`SELECT * FROM events WHERE eventid = ${eventId}`;
  return result[0];
};

exports.handler = async (event) => {
  const { httpMethod, path, body: requestBody, pathParameters } = event;
  let response;

  if (body) {
    for (const key in body) {
      if (typeof body[key] === 'string') {
        body[key] = sanitizeInput(body[key]); // very simple sanitization process, should apply to other fields as well
      }
    }
  }
  try {
    switch (httpMethod) {
      case 'GET':
        if (path === '/events') {
          const events = await getEvents();
          response = {
            statusCode: 200,
            body: JSON.stringify(events),
          };
        } else if (path.startsWith('/events/') && pathParameters) {
          const eventId = path.split('/')[2];
          const event = await getEventById(eventId);
          if (event) {
            response = {
              statusCode: 200,
              body: JSON.stringify(event),
            };
          } else {
            response = {
              statusCode: 404,
              body: JSON.stringify({ error: 'Event not found' }),
            };
          }
        }
        break;

      case 'POST':
        const postBody = JSON.parse(requestBody);
        const postErrors = validationResult(postBody);
        if (!postErrors.isEmpty()) {
          response = {
            statusCode: 400,
            body: JSON.stringify({ errors: postErrors.array() }),
          };
        } else {
          const { eventId, notes, event, timestamp } = postBody;
          if (!eventId || !event || !timestamp) {
            response = {
              statusCode: 400,
              body: JSON.stringify({
                error: 'eventId, event, and timestamp are required',
              }),
            };
            return response;
          }
          const newEvent = await createEvent(eventId, notes, event, timestamp);
          response = {
            statusCode: 201,
            body: JSON.stringify(newEvent),
          };
        }
        break;

      case 'PUT':
        const putBody = JSON.parse(requestBody);
        const putErrors = validationResult(putBody);
        if (!putErrors.isEmpty()) {
          response = {
            statusCode: 400,
            body: JSON.stringify({ errors: putErrors.array() }),
          };
        } else {
          const eventId = path.split('/')[2];
          const { notes, timestamp, event } = putBody;
          if (!eventId || !event || !timestamp) {
            response = {
              statusCode: 400,
              body: JSON.stringify({
                error: 'eventId, event, and timestamp are required',
              }),
            };
            return response;
          }
          const updatedEvent = await updateEvent(
            eventId,
            notes,
            timestamp,
            event,
          );
          if (updatedEvent) {
            response = {
              statusCode: 204,
              body: JSON.stringify({}),
            };
          } else {
            response = {
              statusCode: 404,
              body: JSON.stringify({ error: 'Event not found' }),
            };
          }
        }
        break;

      case 'DELETE':
        const eventId = path.split('/')[2];
        const deletedEvent = await deleteEvent(eventId);
        if (deletedEvent) {
          response = {
            statusCode: 204,
            body: JSON.stringify({}),
          };
        } else {
          response = {
            statusCode: 404,
            body: JSON.stringify({ error: 'Event not found' }),
          };
        }
        break;

      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
        break;
    }
  } catch (error) {
    response = {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }

  return response;
};
