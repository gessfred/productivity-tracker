FROM alpine
RUN apk add --update nodejs npm
RUN npm install --global serve
WORKDIR /app
COPY ./package.json /app
RUN npm install
COPY ./src ./src
COPY ./public/ ./public/
RUN NODE_OPTIONS=--openssl-legacy-provider REACT_APP_API_URL="https://keylogg.gessfred.xyz/api" npm run build
RUN ls build/static && echo 'Build output [OK]'
RUN rm -rf node_modules/
COPY ./serve.sh .
RUN chmod u+wrx serve.sh
ENTRYPOINT ["./serve.sh"]
ENV HTTP_PORT 8080
EXPOSE 8080