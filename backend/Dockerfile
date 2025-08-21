# Multi-stage build for Spring Boot (Gradle)

FROM gradle:8.7-jdk17-alpine AS build
WORKDIR /app

# Copy Gradle wrapper and project files
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY src src

RUN chmod +x gradlew || true
RUN ./gradlew bootJar --no-daemon


FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Copy the built jar
COPY --from=build /app/build/libs/*.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]


