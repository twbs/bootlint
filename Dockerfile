# Written against Docker v1.0.0
FROM node:0.10
MAINTAINER Chris Rebert <code@rebertia.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app

CMD [ "npm", "start" ]

EXPOSE 7070
