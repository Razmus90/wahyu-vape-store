# Deployment Guide - Wahyu Vape Store

Production deployment guide for VPS.

## Prerequisites

- VPS with root access (Ubuntu 20.04+)
- Domain name
- Supabase project configured

## Step 1: VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx & PM2
sudo apt-get install -y nginx
sudo npm install -g pm2
```

## Step 2: Clone & Build

```bash
cd /var/www
sudo mkdir -p wahyu-vape
sudo chown $USER:$USER wahyu-vape
cd wahyu-vape

git clone your-repo-url .
npm install

# Create production environment
nano .env.local
```

Add production values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
ADMIN_PASSWORD=strong-password-here
JWT_SECRET=random-secret-string-here
MIDTRANS_SERVER_KEY=your-key
```

```bash
npm run build
```

## Step 3: PM2 Process Manager

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'wahyu-vape',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
  }],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 4: Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/wahyu-vape
```

```nginx
upstream app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/webhooks/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wahyu-vape /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: SSL Certificate

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
sudo systemctl enable certbot.timer
```

## Step 6: Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Production Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Supabase project verified
- [ ] SSL certificate installed
- [ ] Nginx configured
- [ ] PM2 with auto-restart
- [ ] Domain DNS configured
- [ ] Firewall enabled
- [ ] Admin password changed from default
- [ ] JWT_SECRET set to random string

## Monitoring

```bash
pm2 status          # Check app status
pm2 logs wahyu-vape # View logs
pm2 restart wahyu-vape  # Restart app
```

## Emergency Recovery

```bash
pm2 restart wahyu-vape
pm2 logs wahyu-vape
```

If database connection fails:
- Verify Supabase credentials in `.env.local`
- Check Supabase project status
- Restart: `pm2 restart wahyu-vape`
