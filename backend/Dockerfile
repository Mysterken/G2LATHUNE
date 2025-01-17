# # syntax=docker/dockerfile:1.4

# # if you're doing anything beyond your local machine, please pin this to a specific version at https://hub.docker.com/_/node/
# FROM node:lts AS development

# # set our node environment, either development or production
# # defaults to production, compose overrides this to development on build and run
# ARG NODE_ENV=production
# ENV NODE_ENV $NODE_ENV

# WORKDIR /code

# # default to port 80 for node, and 9229 and 9230 (tests) for debug
# ARG PORT=80
# ENV PORT $PORT
# EXPOSE $PORT 9229 9230

# COPY package.json /code/package.json
# COPY package-lock.json /code/package-lock.json
# RUN npm ci

# # check every 30s to ensure this service returns HTTP 200
# HEALTHCHECK --interval=30s \
#   CMD node healthcheck.js

# # copy in our source code last, as it changes the most
# COPY . /code

# # if you want to use npm start instead, then use `docker run --init in production`
# # so that signals are passed properly. Note the code in index.js is needed to catch Docker signals
# # using node here is still more graceful stopping then npm with --init afaik
# # I still can't come up with a good production way to run with npm and graceful shutdown
# CMD [ "node", "src/index.js" ]

# FROM development as dev-envs
# RUN <<EOF
# apt-get update
# apt-get install -y --no-install-recommends git
# EOF

# RUN <<EOF
# useradd -s /bin/bash -m vscode
# groupadd docker
# usermod -aG docker vscode
# EOF
# # install Docker tools (cli, buildx, compose)
# COPY --from=gloursdocker/docker / /


# syntax=docker/dockerfile:1.4

# Utilisez une version spécifique de Node.js (par exemple, Node.js LTS)
FROM node:lts AS development

# Définir l'environnement par défaut (development ou production)
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Définir le répertoire de travail
WORKDIR /code

# Définir le port par défaut
ARG PORT=80
ENV PORT=$PORT
EXPOSE $PORT 9229 9230

# Copier les fichiers package.json et package-lock.json et installer les dépendances
COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN npm ci

# Ajouter un healthcheck (pour vérifier si l'application est active)
HEALTHCHECK --interval=30s CMD node healthcheck.js

# Copier tout le code source
COPY . /code

# Lancer l'application avec Node.js
CMD [ "node", "src/index.js" ]

# Étape supplémentaire pour ajouter des outils de développement
FROM development AS dev-envs
RUN apt-get update && apt-get install -y --no-install-recommends git

# Créer un utilisateur pour vscode et ajouter au groupe Docker
RUN useradd -s /bin/bash -m vscode && \
    groupadd docker && \
    usermod -aG docker vscode

# Copier les outils Docker depuis une image existante
COPY --from=gloursdocker/docker / /

COPY . /code
WORKDIR /code/src
