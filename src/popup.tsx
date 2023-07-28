import React, { useEffect, useState } from "react";
import { WarningFilled, BugFilled } from "@ant-design/icons";
import { createRoot } from "react-dom/client";
import "./i18n/config";

import {
  parseProject,
  grader,
  scanForErrors,
  scanForWarnings,
} from "catfix-utils/dist";
import { Tip } from "catfix-utils/dist/scaners/types";
import { useTranslation } from "react-i18next";
import { Button, Card, Tabs } from "antd";
import TipsList from "./components/TipsList";

const Popup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentURL, setCurrentURL] = useState<number>();
  const [warnings, setWarnings] = useState<Tip[]>([]);
  const [errors, setErrors] = useState<Tip[]>([]);

  const { t } = useTranslation();

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // todo вставить проверку url (должны находиться на странице проекта или в редакторе)
      const match = (tabs[0].url ?? "").match(/\d{4,}/);
      const projectId = match ? Number(match[0]) : 0;

      setIsLoading(true);

      setCurrentURL(projectId);
      getProject(projectId);
    });

    async function getProject(id: number) {
      const localData = await chrome.storage.local.get(["project"]);
      console.log("Предыдущий запрос", localData);

      try {
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
          project: {
            id: id,
            grades: grades,
            errors: errors,
            warnings: warnings,
          },
        });
        setWarnings(warnings);
        setErrors(errors);
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <div
      style={{
        width: "520px",
        height: "450px",
        maxHeight: "450px",
        overflowY: "scroll",
      }}
    >
      <Card
        title="Результат"
        extra={
          <Button loading={isLoading} type="primary">
            Проверить
          </Button>
        }
      >
        <Tabs tabPosition={"top"}>
          <Tabs.TabPane
            tab={
              <span style={{ color: "#FF6D60" }}>
                <BugFilled />
                {errors.length}
              </span>
            }
            key={"error"}
          >
            <TipsList tips={errors} />
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span style={{ color: "#F7D060" }}>
                <WarningFilled />
                {warnings.length}
              </span>
            }
            key={"warnings"}
          >
            <TipsList tips={warnings} />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
