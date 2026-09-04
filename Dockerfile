# =============================================================================
# Imagem de producao do frontend.
#
# O SPA vira arquivos estaticos servidos por nginx. Nada de Node no runtime:
# a imagem final tem so o dist/ e o nginx.
# =============================================================================

# ---------------------------------------------------------------------------
# build: compila o SPA
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# Copiado antes do resto para que uma mudanca em src/ nao invalide o cache
# do npm ci.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O Vite resolve import.meta.env no momento do build, entao a URL da API
# precisa existir aqui - nao adianta injetar no runtime do container.
ARG VITE_API_URL
ARG VITE_APP_NAME=Orchestra
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

RUN npm run build

# ---------------------------------------------------------------------------
# runtime: nginx servindo o dist/
# ---------------------------------------------------------------------------
FROM nginx:1.30-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
