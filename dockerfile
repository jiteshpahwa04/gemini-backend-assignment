# Dockerfile
FROM node:18-alpine

# (optional) bash is handy for the migration script
RUN apk add --no-cache bash

WORKDIR /usr/src/app

# 1. Install deps
COPY package.json package-lock.json ./
RUN npm install

# 2. Copy your Prisma schema (which lives in src/prisma/)
COPY src/prisma ./prisma

# 3. Generate the client, pointing at the schema you just copied
RUN npx prisma generate --schema=./prisma/schema.prisma

# 4. Copy the rest of your source
COPY . .

EXPOSE 3000

# 5. Run migrations then start your app
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && npm run dev"]