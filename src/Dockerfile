FROM node:latest

COPY ./backend /backend
COPY ./frontend /frontend
COPY ./exe.sh /exe.sh
RUN chmod +x /exe.sh
RUN chmod 777 ./backend ./frontend

CMD ["sh", "/exe.sh"]
