all: build up

re: down build up

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

fclean: down
	rm -rf data/db/database.sqlite
	docker system prune -af

reset-db:
	rm -rf data/db/database.sqlite
	@echo "Database reset! Run 'make' to recreate it."