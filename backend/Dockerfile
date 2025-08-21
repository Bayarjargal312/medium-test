# Multi-stage build for Spring Boot (Gradle)

FROM gradle:8.7-jdk17-alpine AS build
WORKDIR /app

# Copy only what's needed for Gradle build (no wrapper required)
COPY build.gradle settings.gradle ./
COPY src src

RUN gradle --version && gradle bootJar --no-daemon


FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Ensure CA certificates are present for TLS (required for MongoDB Atlas)
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Copy the built jar
COPY --from=build /app/build/libs/*.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]


