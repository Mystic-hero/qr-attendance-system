# Step 1: Build the application
FROM maven:3.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the backend files specifically
COPY backend/pom.xml backend/
COPY backend/src backend/src

# Build the JAR
RUN mvn -f backend/pom.xml clean package -DskipTests

# Step 2: Run the application
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/backend/target/*.jar app.jar

# Expose the port (Render will override this, but it's good practice)
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
