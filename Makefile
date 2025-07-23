




all : build run

fclean: stop 
	@docker rmi -f trans

re: stop build run

stop:
	@docker rm -f $$(docker ps -aq) || echo "No containers to stop"

build:
	@docker build -t trans ./src
run :
	@docker run -p 3000:3000 trans