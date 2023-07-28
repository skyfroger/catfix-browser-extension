const onLoad = () => {
  console.log("content script loaded!");

  let port = chrome.runtime.connect({ name: chrome.runtime.id });

  let counter = 0;

  // Select the node that will be observed for mutations
  const targetNode = document.querySelector(
    "#app > div > div.gui_menu-bar-position_3U1T0.menu-bar_menu-bar_JcuHF.box_box_2jjDp > div.menu-bar_account-info-group_MeJZP > div:nth-child(1)"
  );

  console.log(targetNode);

  // Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback = (mutationList: any, observer: any) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        counter++;
        if (counter === 3) {
          console.log("Проект сохранён");
          counter = 0;
          port.postMessage({ message: "hi", url: chrome.runtime.id });
        }
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  if (targetNode) observer.observe(targetNode, config);

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.color) {
      console.log("Receive color = " + msg.color);
      document.body.style.backgroundColor = msg.color;
      sendResponse("Change color to " + msg.color);
    } else {
      sendResponse("Color message is none.");
    }
  });
};

if (document.readyState == "loading") {
  // ещё загружается, ждём события
  document.addEventListener("DOMContentLoaded", onLoad);
} else {
  // DOM готов!
  console.log("loaded already");
  setTimeout(onLoad, 5000);
}
