@echo off
echo Installing dependencies...
npm install

echo Setting environment variables...
set API_KEY=secure-api-key-2024
set PORT=8080
set NODE_ENV=development

echo Starting the server...
npm start