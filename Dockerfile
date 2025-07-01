FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S seccopilot && \
    adduser -S seccopilot -u 1001

USER seccopilot

RUN npm link

ENTRYPOINT ["sec-copilot"]
CMD ["scan", "--demo", "--help"]
