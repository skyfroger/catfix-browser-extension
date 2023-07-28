import { parseProject } from "catfix-utils/dist";

function polling() {
  console.log("polling");
  setTimeout(polling, 1000 * 30);
}

chrome.runtime.onConnect.addListener((port) => {
  console.log("connected ", port);

  if (port.name === chrome.runtime.id) {
    port.onMessage.addListener((message, port) => {
      console.log(message);
      chrome.action.setBadgeText({
        text: `❗${6}/⚠️${3}`,
      });
    });
  }
});

polling();
