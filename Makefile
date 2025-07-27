all: build up

re: down build up

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down