#!/bin/bash

rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm ci

npm run build

cp -r /root/aptis-web-fe/build/* /var/www/react-app/