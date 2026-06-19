#!/bin/bash
set -e

echo "Updating system..."
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-pip python3-venv nginx git curl

echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

echo "Cloning repository..."
cd /home/ubuntu
if [ -d "pivotly" ]; then
    rm -rf pivotly
fi
git clone https://github.com/rominkevadiya/pivotly.git pivotly
cd pivotly

echo "Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "Running Database Migrations..."
alembic upgrade head

echo "Setting up Frontend..."
cd ../frontend
npm install
# Set API URL for build so it routes through Nginx proxy
echo "VITE_API_BASE_URL=/api/v1" > .env.production
npm run build

echo "Configuring Nginx..."
sudo bash -c "cat > /etc/nginx/sites-available/default << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /home/ubuntu/pivotly/frontend/dist;
    index index.html;
    server_name _;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF"

sudo systemctl restart nginx

echo "Setting up systemd service for FastAPI..."
sudo bash -c "cat > /etc/systemd/system/pivotly.service << 'SYSTEMD_EOF'
[Unit]
Description=Gunicorn instance to serve Pivotly FastAPI
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/pivotly/backend
Environment=\"PATH=/home/ubuntu/pivotly/backend/venv/bin\"
EnvironmentFile=/home/ubuntu/pivotly/backend/.env
ExecStart=/home/ubuntu/pivotly/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF"

sudo systemctl daemon-reload
sudo systemctl start pivotly
sudo systemctl enable pivotly

echo "Deployment complete!"
