import {
  parseProject,
  grader,
  scanForErrors,
  scanForWarnings,
} from "catfix-utils/dist";
import { Tip } from "catfix-utils/dist/scaners/types";
import { categories, graderResult } from "catfix-utils/dist/graders";

type LocalData = {
  id: number;
  grades: Map<categories, graderResult>;
  errors: Tip[];
  warnings: Tip[];
  lastUpdate: number;
};

chrome.tabs.onActivated.addListener(function (activeInfo) {
  // убираем баджи со значка расширения после переключения вкладки
  chrome.action.setBadgeText({
    text: "",
  });
});

chrome.runtime.onInstalled.addListener(() => {
  // добавляем запрос информации по расписанию
  scheduleRequest();
});

// добавляем "будильник" для периодической проверки проекта
function scheduleRequest() {
  chrome.alarms.create("check", { periodInMinutes: 10 });
}

// alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === "check") {
    // проверка проекта по расписанию
    updateProject();
  }
});

async function updateProject() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const match = (tabs[0]?.url ?? "").match(/\d{4,}/);
  const projectId = match ? Number(match[0]) : undefined;

  // находимся на вкладке с проектом
  if (projectId) {
    try {
      const tokenResp = await fetch(
        `https://trampoline.turbowarp.org/proxy/projects/${projectId}`
      );
      let token;

      if (tokenResp.ok) {
        const tokenData = await tokenResp.json();
        token = `&token=${tokenData.project_token}`;
      }

      // запрос на получение содержимого проекта
      const resp = await fetch(
        `https://projects.scratch.mit.edu/${projectId}/?${Date.now()}${token}`
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

      // выводим в бадж количество ошибок и замечаний
      chrome.action.setBadgeText({
        text: `❗${errors.length}⚠️${warnings.length}`,
      });

      const pr: LocalData = {
        id: projectId,
        grades: grades,
        errors: errors,
        warnings: warnings,
        lastUpdate: Date.now(),
      };

      // сохраняем результат проверки в localStorage
      await chrome.storage.local.set({
        project: pr,
      });

      // отправляем сообщение расширению, когда нужно обновить содержимое
      chrome.runtime.sendMessage({
        message: "updateProject",
        id: projectId,
      });
    } catch (e) {}
  }
}
