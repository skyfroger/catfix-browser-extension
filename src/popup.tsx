import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import parse from "html-react-parser";
import "./i18n/config";

import {
  parseProject,
  grader,
  scanForErrors,
  scanForWarnings,
} from "catfix-utils/dist";
import { Tip } from "catfix-utils/dist/scaners/types";
import { useTranslation } from "react-i18next";

const Popup = () => {
  const [currentURL, setCurrentURL] = useState<number>();
  const [warnings, setWarnings] = useState<Tip[]>([]);

  const { t } = useTranslation();

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const match = (tabs[0].url ?? "").match(/\d{4,}/);
      const projectId = match ? Number(match[0]) : 0;

      setCurrentURL(projectId);
      getProject(projectId);
    });

    async function getProject(id: number) {
      const localData = await chrome.storage.local.get(["project"]);
      console.log("Предыдущий запрос", localData);

      const tokenResp = await fetch(
        `https://trampoline.turbowarp.org/proxy/projects/${id}`
      );
      let token;
      let projectName = null;
      let projectAuthor = "-";

      if (tokenResp.ok) {
        const tokenData = await tokenResp.json();
        token = `&token=${tokenData.project_token}`;
        projectName = tokenData.title; // получаем название проекта
        projectAuthor = tokenData.author.username; // получаем имя пользователя
      }

      const resp = await fetch(
        `https://projects.scratch.mit.edu/${id}/?${Date.now()}${token}`
      );

      const projectJSON = await resp.json();

      const parsedProject = parseProject(projectJSON);

      const grades = grader(parsedProject);
      const errors = scanForErrors(parsedProject, projectJSON);
      const warnings = scanForWarnings(parsedProject, projectJSON);

      console.log(parsedProject);
      console.log(grades);
      console.log(errors, warnings);
      await chrome.storage.local.set({
        project: { id: id, grades: grades, errors: errors, warnings: warnings },
      });
      setWarnings(warnings);
    }
  }, []);

  return (
    <div style={{ width: "500px", height: "400px" }}>
      <ul>
        {warnings.map((item, index) => (
          <li key={index}>{parse(t(item.message, item.payload))}</li>
        ))}
      </ul>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
