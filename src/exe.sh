cd  /backend && (npm run clean || true) && npm install && npm run db:init && npm run build 
cd .. 
cd  /frontend && (npm run clean || true) && npm install && npm run build 
cd .. 
npm run --prefix backend start 