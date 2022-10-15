FROM ubuntu:20.04

WORKDIR /app/

ARG DEBIAN_FRONTEND=noninteractive
ARG JAVA_VERSION=9
ARG JAVA_RELEASE=JDK

ENV JAVA_HOME=/usr

RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm
RUN npm install npm@latest -g && \
    npm install n -g && \
    n latest

RUN bash -c ' \
    set -euxo pipefail && \
    apt-get update && \
    pkg="openjdk-$JAVA_VERSION"; \
    if [ "$JAVA_RELEASE" = "JDK" ]; then \
    pkg="$pkg-jdk-headless"; \
    else \
    pkg="$pkg-jre-headless"; \
    fi; \
    apt-get install -y --no-install-recommends wget unzip "$pkg" && \
    apt-get clean && \
    apt-get update \
    apt install python3'

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.

RUN npm install --only=production

ENV LISTEN_PORT=4445

EXPOSE 4445

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup.
CMD [ "npm", "start" ]