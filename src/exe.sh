#!/bin/bash
cd /backend && rm -rf out && npm install && npm run db:init && npm run build 
cd /frontend && rm -rf out dist && npm install && npm run build 
cd /backend && npm run start &
cd /frontend && npx vite --host 0.0.0.0
