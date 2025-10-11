import { Page } from "../Page";

class MatchmakingPage implements Page {

	title: string = "Tournament";
	data: any;

	constructor() {
  }

  async render(): Promise<void> {
	const app = document.getElementById("app");
	if (app) {
	  app.innerHTML = `
		<h1>Matchmaking Page</h1>
		<p>Welcome to the Matchmaking Page!</p>
	  `;
	}
  }

  async onPreLoad(): Promise<void> {
	console.log("Matchmaking Page preloaded");
  }

  async onLoad(): Promise<void> {
	console.log("Matchmaking Page loaded");
  }

  async onUnload(): Promise<void> {
	console.log("Matchmaking Page unloaded");
  }

}

const MATCHMAKING_PAGE = new MatchmakingPage();

export { MATCHMAKING_PAGE };