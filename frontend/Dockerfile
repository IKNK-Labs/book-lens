FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json ./
RUN npm install

FROM node:24-alpine AS builder

WORKDIR /app

ARG SERVER_API_URL=http://django:8000
ENV SERVER_API_URL=${SERVER_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner

ARG SERVER_API_URL=http://django:8000
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    SERVER_API_URL=${SERVER_API_URL}

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
