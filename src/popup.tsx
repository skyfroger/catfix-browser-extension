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
import Moment from "react-moment";
import "moment/locale/ru";

// ключ по которому хранится проект в localStorage
const PROJECT_KEY: string = "project";

// тип данных, хранящихся в localStorage
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
    lastUpdate: Date.now(),
  });

  const { t, i18n } = useTranslation();

  /**
   * Запрос на получение проекта
   * @param id идентификатор проекта
   */
  async function getProject(id: number) {
    // получаем проект из localStorage
    const localData: { [key: string]: LocalData } =
      await chrome.storage.local.get([PROJECT_KEY]);

    if (
      Object.keys(localData).length !== 0 &&
      localData[PROJECT_KEY].id === id
    ) {
      // берём информацию из localStorage
      setProject({
        ...localData[PROJECT_KEY],
      });
    } else {
      // берём информацию из сети
      setIsLoading(true);
      loadFromNet(id);
    }
  }

  /**
   * Загрузка проекта по сети
   * @param id идентификатор проекта
   */
  async function loadFromNet(id: number) {
    try {
      const tokenResp = await fetch(
        `https://trampoline.turbowarp.org/proxy/projects/${id}`
      );
      let token;

      if (tokenResp.ok) {
        const tokenData = await tokenResp.json();
        token = `&token=${tokenData.project_token}`;
      }

      // запрос на получение содержимого проекта
      const resp = await fetch(
        `https://projects.scratch.mit.edu/${id}/?${Date.now()}${token}`
      );

      // получаем JSON с проектом
      const projectJSON = await resp.json();
      // парсим проект
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
        lastUpdate: Date.now(),
      };

      // сохраняем результат оценивания и проверки в localStorage
      await chrome.storage.local.set({
        project: pr,
      });

      // сохраняем результаты в state
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
    setIsLoading(true);
    // загрузка проекта по сети
    loadFromNet(projectId);
  };

  useEffect(() => {
    // задаём язык для даты последней проверки проекта
    Moment.globalLocale = i18n.language;

    // очищаем содержимое бэджа
    chrome.action.setBadgeText({
      text: "",
    });

    /*
    Ждём от фонового скрипта сообщение updateProject.
    Когда сообщение получено, обновляем интерфейс
     */
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      if (request.message === "updateProject") {
        getProject(request.id);
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const match = (tabs[0].url ?? "").match(/\d{4,}/);
      const projectId = match ? Number(match[0]) : 0;

      // сохраняем id проекта в state
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
        title={t("ui.title")}
        extra={
          <Button onClick={handleCheck} loading={isLoading} type="primary">
            {t("ui.checkButton")}
          </Button>
        }
      >
        <div>
          <span>
            {t("ui.lastCheck")}
            <Moment fromNow={true} date={project.lastUpdate} />
          </span>
        </div>
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
