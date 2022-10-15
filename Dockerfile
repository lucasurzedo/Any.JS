FROM ubuntu:20.04

WORKDIR /app/

ARG DEBIAN_FRONTEND=noninteractive

ENV JAVA_HOME=/usr


RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm

RUN apt-get install wget -y && apt-get install curl -y

RUN npm install npm@latest -g && \
    npm install n -g && \
    n 14.17.3

RUN apt install openjdk-8-jdk -y && apt install python3 -y

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