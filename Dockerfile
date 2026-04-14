# Etapa 1: Dependencias y Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar configuración de node
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (necesarias para compilar)
RUN npm install

# Copiar el código fuente
COPY . .

# Generar Prisma Client y el build de NestJS
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npm run prisma:generate
RUN npm run build

# Etapa 2: Producción
FROM node:22-alpine

WORKDIR /app

# Copiar los package.json y prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Generar Prisma Client indispensable en producción
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npx prisma generate

# Copiar de la etapa de builder los archivos compilados
COPY --from=builder /app/dist ./dist

EXPOSE 5000

# Comando para arrancar en producción
CMD ["npm", "run", "start:prod"]
