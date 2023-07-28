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
import { categories, graderResult } from "catfix-utils/dist/graders";
import { useTranslation } from "react-i18next";
import { Button, Card, Tabs } from "antd";
import TipsList from "./components/TipsList";

const PROJECT_KEY: string = "project";

type LocalData = {
  id: number;
  grades: Map<categories, graderResult>;
  errors: Tip[];
  warnings: Tip[];
  lastUpdate: number;
};

const Popup = () => {
  const [projectId, setProjectId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<LocalData>({
    id: 0,
    grades: new Map(),
    errors: [],
    warnings: [],
    lastUpdate: new Date().getTime(),
  });

  const { t } = useTranslation();

  /**
   * Запрос на получение проекта
   * @param id идентификатор проекта
   */
  async function getProject(id: number) {
    const localData: { [key: string]: LocalData } =
      await chrome.storage.local.get([PROJECT_KEY]);

    if (
      Object.keys(localData).length !== 0 &&
      localData[PROJECT_KEY].id === id
    ) {
      console.log("Загрузка из localStorage");
      setProject({
        ...localData[PROJECT_KEY],
      });
    } else {
      console.log("Загрузка из сети");
      setIsLoading(true);
      loadFromNet(id);
    }
  }

  async function loadFromNet(id: number) {
    console.log("Функция loadFromNet", id);
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

      // запрос на получение содержимого проекта
      const resp = await fetch(
        `https://projects.scratch.mit.edu/${id}/?${Date.now()}${token}`
      );

      // получаем JSON с проектом
      const projectJSON = await resp.json();

      const parsedProject = parseProject(projectJSON);

      // получаем оценки
      const grades = grader(parsedProject);
      // получаем список ошибок
      const errors = scanForErrors(parsedProject, projectJSON);
      // получаем список замечаний
      const warnings = scanForWarnings(parsedProject, projectJSON);

      const pr: LocalData = {
        id: id,
        grades: grades,
        errors: errors,
        warnings: warnings,
        lastUpdate: new Date().getTime(),
      };

      await chrome.storage.local.set({
        project: pr,
      });

      setProject({ ...pr });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Проверка проекта по клику на кнопку
   */
  const handleCheck = () => {
    async function load() {
      loadFromNet(projectId);
    }

    setIsLoading(true);
    load();
  };

  useEffect(() => {
    console.log("useEffect - начало");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // todo вставить проверку url (должны находиться на странице проекта или в редакторе)
      const match = (tabs[0].url ?? "").match(/\d{4,}/);
      const projectId = match ? Number(match[0]) : 0;

      // сохраняем id проекта в стейт
      setProjectId(projectId);
      // запрашиваем информацию о проекте
      getProject(projectId);
    });
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
          <Button onClick={handleCheck} loading={isLoading} type="primary">
            Проверить
          </Button>
        }
      >
        <Tabs tabPosition={"top"}>
          <Tabs.TabPane
            tab={
              <span style={{ color: "#FF6D60" }}>
                <BugFilled />
                {project.errors.length}
              </span>
            }
            key={"error"}
          >
            <TipsList tips={project.errors} />
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span style={{ color: "#F7D060" }}>
                <WarningFilled />
                {project.warnings.length}
              </span>
            }
            key={"warnings"}
          >
            <TipsList tips={project.warnings} />
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
