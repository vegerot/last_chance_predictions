console.log("final_fate_service_worker.js loaded");
console.assert(typeof document === "undefined") // cannot access host document in service worker
console.assert(typeof chrome.webRequest !== undefined) // can access most chrome APIs in service workers

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	console.log(msg.yourMom)
	console.assert(msg.yourMom === "heyFromTwitch.tv")
	sendResponse({msgFromSW: "hi from SW"})
})

// MUST CLICK ON EXTENSION ICON TO ACTIVATE LISTENER
chrome.webRequest.onCompleted.addListener(
	(...args) => {
		console.log(...args)
	},
	{urls: ["https://*.twitch.tv/*"]},
	["responseHeaders"] //this might break things?? https://developer.chrome.com/docs/extensions/reference/webRequest/#:~:text=If%20you%20really%20need%20to%20modify%20headers%20in%20a%20way%20to%20violate%20the%20CORS%20protocol%2C%20you%20need%20to%20specify%20%27extraHeaders%27%20in%20opt_extraInfoSpec
)

