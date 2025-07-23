cd  /backend && npm run clean && npm install && npm run build
cd ..
cd  /frontend && npm run clean && npm install && npm run build
cd ..
npm run --prefix backend start