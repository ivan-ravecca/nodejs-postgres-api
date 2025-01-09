# Node.js Postgres API

This project is a Node.js API that interacts with a PostgreSQL database for the sole purpose to be connected with other UI project (https://github.com/ivan-ravecca/ticketmaster) as a test.

## Prerequisites

- Node.js (v14 or higher)
- (dockerized) PostgreSQL

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/nodejs-postgres-api.git
    cd nodejs-postgres-api
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add the following:
    ```env
    DB_HOST=your_db_host
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    DB_PORT=your_db_port
    ```

## Usage

1. Start the server:
    ```sh
    npm start
    ```

2. The API will be available at `http://localhost:3000`.

## API Endpoints

- `GET /events` - Retrieve all events
- `GET /events/:id` - Retrieve a single iteevent by ID
- `POST /events` - Create a new event
- `PUT /events/:id` - Update an event by ID
- `DELETE /events/:id` - Delete an event by ID

## DB structure

```
CREATE TABLE public.events (
    id integer NOT NULL,
    notes text,
    "timestamp" bigint NOT NULL,
    event json NOT NULL,
    eventid character varying(50) NOT NULL
);

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);
```