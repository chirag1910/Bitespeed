## Render endpoint

[https://bitespeed-3gvw.onrender.com/](https://bitespeed-3gvw.onrender.com/)

## Endpoints

### 1. GET /

A simple health check endpoint that returns a "Hello, World!" message.

**Response:**

```json
{
    "message": "Hello, World!"
}
```

### 2. POST /identify

Identifies and consolidates contact information based on email and phoneNumber.

**Request:**

-   Method: POST
-   Content-Type: application/json
-   Body:

```json
{
    "email": "example@example.com",
    "phoneNumber": "1234567890"
}
```

Both fields are optional, but at least one must be provided.

## Setup & Running Locally

1. Install dependencies:

```
npm install
```

2. Start the server:

```
node index.js
```
