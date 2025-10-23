import { GlobalState, Page } from "../main";
import { HOME_PAGE } from "./HomePage";

class ClassicGameResult implements Page {
	title: string = "Game Result";
	result: any;
	constructor(result: any) {
		this.result = result;
	}

	async render(): Promise<void> {
		const app = document.getElementById("app") as HTMLElement;
		app.innerHTML = `
			<h1>${this.title}</h1>
			<p>Thanks for playing!</p>
			<button id="go-home">Go to Home</button>
		`;
	}
	async onLoad(): Promise<void> {
		const button = document.getElementById("go-home") as HTMLButtonElement;
		button.addEventListener("click", () => {
			GlobalState.setPage(HOME_PAGE);
		});
	}
	async onUnload(): Promise<void> {
		
	}
	async onPreLoad(): Promise<void> {
		console.log("Game Result:", this.result);
	}
}

const CLASSIC_GAME_PAGE_RESULT = (result : any) => new ClassicGameResult(result);

export { CLASSIC_GAME_PAGE_RESULT, ClassicGameResult };