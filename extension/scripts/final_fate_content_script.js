const browser = chrome;

console.log("final_fate_content_script.js loaded");
let root = document.getElementById("root");
console.assert(root); // can access host document
console.assert(browser.webRequest === undefined); // cannot access most chrome APIs in content scripts

async function sendOnNavigationMessageToSW() {
  const { ok } = await browser.runtime.sendMessage({
    method: "content/onNavigation",
    channelLoginName: location.pathname.split("/")[1], // TODO(#5): figure out if we're in a popout script or not
  });
  console.assert(ok === true);
}

sendOnNavigationMessageToSW();

// TODO: does this fire when the page is first loaded?  If so, then we don't
// need to send the above message too
navigation.addEventListener("navigationsuccess", (event) => {
  console.log("navigation success", event);
  sendOnNavigationMessageToSW();
});

window.onbeforeunload = () => {
  // TODO: rem,ove tab from `currentTabs` when tab closed
};
