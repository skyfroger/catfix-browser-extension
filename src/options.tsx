import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const Options = () => {
  const [status, setStatus] = useState<string>("");
  const [lang, setLang] = useState<string>("ru");

  useEffect(() => {
    // Restores select box and checkbox state using the preferences
    // stored in chrome.storage.
    chrome.storage.sync.get(
      {
        lang: "ru",
      },
      (items) => {
        setLang(items.lang);
      }
    );
  }, []);

  const saveOptions = () => {
    // Saves options to chrome.storage.sync.
    chrome.storage.sync.set(
      {
        lang: lang,
      },
      () => {
        // Update status to let user know options were saved.
        setStatus("Options saved.");
        const id = setTimeout(() => {
          setStatus("");
        }, 1000);
        return () => clearTimeout(id);
      }
    );
  };

  return (
    <>
      <div>{status}</div>
      <select value={lang} onChange={(event) => setLang(event.target.value)}>
        <option value="ru">Русский</option>
        <option value="be">Беларуская</option>
        <option value="en">English</option>
      </select>
      <button onClick={saveOptions}>Сохранить</button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
