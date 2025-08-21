# Full-Stack Boilerplate (Spring Boot + MongoDB + React)

## Backend (Spring Boot + Gradle + MongoDB)

- Location: `backend`
- Requirements: Java 17+, MongoDB running locally or a MongoDB Atlas URI

Configure MongoDB connection in `backend/src/main/resources/application.properties`:

```
spring.data.mongodb.uri=${MONGODB_URI:mongodb://localhost:27017/medium_boilerplate}
server.port=${PORT:8080}
```

Run backend:

```
cd backend
./gradlew bootRun   # on Linux/Mac
gradlew.bat bootRun # on Windows
```

API Endpoints:
- GET `/api/users`
- GET `/api/users/{id}`
- POST `/api/users`  (body: `{ name, email }`)
- PUT `/api/users/{id}` (body: `{ name, email }`)
- DELETE `/api/users/{id}`

## Frontend (React + Vite)

- Location: `frontend`
- Dev server proxies `/api` to `http://localhost:8080`

Install and run:

```
cd frontend
npm install
npm run dev
```

Open the app at the URL shown by Vite (typically `http://localhost:5173`)

## Project Structure

```
backend/   # Spring Boot app (Gradle)
frontend/  # React app (Vite)
```


