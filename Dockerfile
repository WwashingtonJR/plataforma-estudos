FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
COPY src ./src
COPY fatecanos-academy ./fatecanos-academy
RUN mvn --batch-mode --no-transfer-progress -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build --chown=10001:10001 /build/target/plataforma-estudos-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
