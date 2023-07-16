const browser = chrome;

console.log("final_fate_content_script.js loaded");
let root = document.getElementById("root");
console.assert(root); // can access host document
console.assert(browser.webRequest === undefined); // cannot access most chrome APIs in content scripts

async function sendOnNavigationMessageToSW() {
  let channelLoginName = location.pathname.split("/")[1];
  if (channelLoginName === '') {
    // Ignore the home page (https://www.twitch.tv/).
    return;
  }
  if (channelLoginName === 'popout') {
    // TODO(#5)
    // For now, ignore popout chat.
    return;
  }
  const { ok } = await browser.runtime.sendMessage({
    method: "content/onNavigation",
    channelLoginName: channelLoginName,
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
