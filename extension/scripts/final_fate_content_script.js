console.log("final_fate_content_script.js loaded");
let root = document.getElementById("root")
console.assert(root) // can access host document
console.assert(chrome.webRequest === undefined) // cannot access most chrome APIs in content scripts

async function sendMessageToSW() {
	const {msgFromSW} = await chrome.runtime.sendMessage({yourMom: "heyFromTwitch.tv"})
	console.log(msgFromSW)
	console.assert(msgFromSW === "hi from SW")
}

sendMessageToSW() 
