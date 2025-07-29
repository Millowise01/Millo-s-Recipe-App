@echo off
echo ========================================
echo Millo's Cuisine Explorer - Deployment
echo ========================================

echo.
echo Step 1: Building Docker image...
docker build -t millowise01/millos-cuisine:v1 .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    exit /b 1
)

echo.
echo Step 2: Testing locally...
docker run -d --name millos-test -p 8080:8080 -e API_KEY=secure-api-key-2024 millowise01/millos-cuisine:v1
timeout /t 10 /nobreak > nul

echo Testing health endpoint...
curl -H "X-API-Key: secure-api-key-2024" http://localhost:8080/api/health
if %errorlevel% neq 0 (
    echo ERROR: Health check failed
    docker stop millos-test
    docker rm millos-test
    exit /b 1
)

echo.
echo Step 3: Cleaning up test container...
docker stop millos-test
docker rm millos-test

echo.
echo Step 4: Pushing to Docker Hub...
echo Please run: docker login
echo Then run: docker push millowise01/millos-cuisine:v1

echo.
echo Step 5: Deploy to lab machines...
echo SSH into web-01 and web-02, then run:
echo docker pull millowise01/millos-cuisine:v1
echo docker run -d --name app --restart unless-stopped -p 8080:8080 -e API_KEY=secure-api-key-2024 -e NODE_ENV=production millowise01/millos-cuisine:v1

echo.
echo Step 6: Configure load balancer...
echo Copy haproxy.cfg to lb-01 and reload HAProxy

echo.
echo ========================================
echo Deployment script completed!
echo ========================================