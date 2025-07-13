//import * as Babylon from "babylonjs"

//const canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;

//const engine: Babylon.Engine = new Babylon.Engine(canvas, true, {}, true);
//
//const scene = new Babylon.Scene(engine);
//
//const camera = new Babylon.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 4, 10, Babylon.Vector3.Zero(), scene, true);
//
//camera.setTarget(Babylon.Vector3.Zero());
//camera.attachControl(canvas);
//
//const light = new Babylon.PointLight("light", new Babylon.Vector3(1, 2, 2), scene);
//
//const box = Babylon.MeshBuilder.CreateBox("box", {}, scene);
//
//engine.runRenderLoop(() => { scene.render(); })

export function login()
{
    const email = document.getElementById("email") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;
    fetch("http://192.168.1.123:3000/api/auth/sign-in", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: email.value,
            password: password.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success == true)
        {
            console.log("Login Success!");
            console.log("Cookie: " + data.Cookie);
        }
        else
            console.log("Login Failed: " + data.message);
    });
}
