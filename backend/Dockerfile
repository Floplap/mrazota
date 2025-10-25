FROM node:18-slim

WORKDIR /usr/src/app

# install dependencies
COPY package*.json ./
RUN npm ci --production --silent

# copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
