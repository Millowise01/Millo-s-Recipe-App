# Deployment Guide for Millo's Cuisine Explorer

This guide provides instructions for deploying the Millo's Cuisine Explorer application to web servers and configuring a load balancer.

## Part 1: Deploying to Web Servers

### Prerequisites

- Access to two web servers (Web01 and Web02)
- SSH access to both servers
- Web servers with Apache or Nginx installed
- Basic knowledge of Linux commands

### Deployment Steps

#### Step 1: Prepare the Application for Deployment

1. Ensure all files are properly organized in your local repository
2. Make sure there are no hardcoded paths or environment-specific configurations

#### Step 2: Deploy to Web01

1. Connect to Web01 via SSH:
   ```bash

   ssh username@web01-server-ip
   ```bash

2. Navigate to the web server's document root:

   ```bash
   cd /var/www/html/
   ```

3. Create a directory for the application:
   sudo mkdir millos-cuisine

4. Set appropriate permissions:
   sudo chown -R $USER:$USER /var/www/html/millos-cuisine

5. Upload the application files using SCP from your local machine:
   scp -r /path/to/local/Millo-s-Recipe-App/* username@web01-server-ip:/var/www/html/millos-cuisine/

6. Configure the web server (Apache example):
   sudo nano /etc/apache2/sites-available/millos-cuisine.conf

   Add the following configuration:
   ```
   <VirtualHost *:80>
       ServerName web01.example.com
       DocumentRoot /var/www/html/millos-cuisine
       
       <Directory /var/www/html/millos-cuisine>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog ${APACHE_LOG_DIR}/millos-cuisine-error.log
       CustomLog ${APACHE_LOG_DIR}/millos-cuisine-access.log combined
   </VirtualHost>
   ```

7. Enable the site and restart Apache:
   ```
   sudo a2ensite millos-cuisine.conf
   sudo systemctl restart apache2
   ```

#### Step 3: Deploy to Web02

Repeat the same steps as for Web01, but connect to Web02 instead:

1. Connect to Web02 via SSH:
   ```
   ssh username@web02-server-ip
   ```

2. Follow steps 2-7 from the Web01 deployment process.

## Part 2: Configuring the Load Balancer

### Prerequisites
- Access to the load balancer server (Lb01)
- Nginx installed on the load balancer (recommended for its load balancing capabilities)

### Configuration Steps

1. Connect to Lb01 via SSH:
   ```
   ssh username@lb01-server-ip
   ```

2. Install Nginx if not already installed:
   ```
   sudo apt update
   sudo apt install nginx
   ```

3. Configure Nginx as a load balancer:
   ```
   sudo nano /etc/nginx/sites-available/millos-cuisine-lb
   ```

   Add the following configuration:
   ```
   upstream millos_backend {
       server web01-server-ip:80;
       server web02-server-ip:80;
   }

   server {
       listen 80;
       server_name millos-cuisine.example.com;

       location / {
           proxy_pass http://millos_backend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. Create a symbolic link to enable the site:
   ```
   sudo ln -s /etc/nginx/sites-available/millos-cuisine-lb /etc/nginx/sites-enabled/
   ```

5. Test the Nginx configuration:
   ```
   sudo nginx -t
   ```

6. If the test is successful, restart Nginx:
   ```
   sudo systemctl restart nginx
   ```

## Part 3: Testing the Deployment

1. Test each web server individually:
   - Open a browser and navigate to `http://web01-server-ip`
   - Open a browser and navigate to `http://web02-server-ip`
   - Verify that the application loads correctly on both servers

2. Test the load balancer:
   - Open a browser and navigate to `http://millos-cuisine.example.com` (or the IP address of Lb01)
   - Verify that the application loads correctly
   - Try refreshing the page multiple times to ensure requests are being distributed between Web01 and Web02

3. Verify load balancing is working:
   - You can check the access logs on both web servers to confirm that requests are being distributed:
     ```
     sudo tail -f /var/log/apache2/millos-cuisine-access.log
     ```

## Troubleshooting

### Common Issues and Solutions

1. **Web server not serving the application:**
   - Check file permissions
   - Verify the virtual host configuration
   - Check Apache/Nginx error logs

2. **Load balancer not distributing traffic:**
   - Verify that both web servers are running
   - Check Nginx configuration for typos
   - Ensure firewall rules allow traffic between load balancer and web servers

3. **Application errors after deployment:**
   - Check browser console for JavaScript errors
   - Verify that all paths in the application are relative, not absolute
   - Ensure all required files were properly uploaded

## Security Considerations

1. **HTTPS Configuration:**
   For a production environment, configure HTTPS using Let's Encrypt:
   ```
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d millos-cuisine.example.com
   ```

2. **Firewall Configuration:**
   Configure firewall rules to only allow necessary traffic:
   ```
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   ```

3. **Regular Updates:**
   Keep all systems updated with security patches:

   ```
   sudo apt update
   sudo apt upgrade
   ```