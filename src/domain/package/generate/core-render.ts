import type { DocumentModule, OrganizationProfile } from "../types";
import { SHARED_REQUISITES } from "../requisites";
import { block, fillTemplate, requirementValues, type GenerateContext, type GeneratedBlock, type GeneratedDocument } from "./template";

const POWER_TOOLS: Array<[string, string]> = [
  ["angle_grinder", "угловая шлифовальная машина (УШМ)"],
  ["drill", "электродрель"],
];

const REVIEW =
  "Нормативное основание этого проекта ещё не проверено специалистом и в текст не включено. Формулировки нужно сверить до утверждения.";

function fallbackContext(reason = ""): GenerateContext {
  return {
    instructions: [],
    professionTitle: (id) => id,
    gearTitle: (id) => id,
    reason,
    formedAt: new Date().toISOString(),
  };
}

function header(values: Record<string, string>, title: string): GeneratedBlock[] {
  return [
    block("right", values["organization.name"] || "не указано", true),
    block("right", values["organization.shortName"] || ""),
    block("right", [values["organization.city"], values["organization.address"]].filter(Boolean).join(", ") || "не указано"),
    block("right", "УТВЕРЖДАЮ", true),
    block("right", values["organization.directorTitle"] || "Руководитель"),
    block("right", values["organization.director"] || "не указано"),
    block("right", values.approvalDate || "не указано"),
    block("heading", title, true),
  ].filter((item) => item.text.trim().length > 0);
}

function signature(values: Record<string, string>): GeneratedBlock[] {
  return [
    block("body", `${values["organization.directorTitle"] || "Руководитель"} ${values["organization.director"] || "не указано"}`),
    block("body", `${values.responsibleTitle || "Ответственный за охрану труда"} ${values.responsiblePerson || "не указано"}`),
    block("body", REVIEW),
  ];
}

function professionTitles(profile: OrganizationProfile, context: GenerateContext): string[] {
  const titles = [
    ...profile.professionIds.map((id) => context.professionTitle(id)),
    ...profile.customProfessions,
    ...profile.positions,
  ];
  return [...new Set(titles.map((item) => item.trim()).filter(Boolean))];
}

function professionBlocks(profile: OrganizationProfile, context: GenerateContext): GeneratedBlock[] {
  const titles = professionTitles(profile, context);
  if (titles.length === 0) return [block("body", "В профиле организации пока нет подтверждённых профессий и должностей.")];
  return titles.map((title, index) => block("body", `${index + 1}. ${title}`));
}

function instructionBlocks(profile: OrganizationProfile, context: GenerateContext): GeneratedBlock[] {
  const lines: string[] = [];
  const covered = new Set<string>();
  for (const item of context.instructions) {
    if (item.professionId) covered.add(item.professionId);
    covered.add(item.professionTitle);
    lines.push(`${item.number}. Инструкция по охране труда: ${item.professionTitle}. Дата сборки: ${item.date}.`);
  }
  for (const id of profile.professionIds) {
    if (covered.has(id)) continue;
    const title = context.professionTitle(id);
    if (covered.has(title)) continue;
    lines.push(`Инструкция по охране труда: ${title}. В конструкторе ещё не собрана, в перечень включена по профилю организации.`);
  }
  for (const title of profile.customProfessions) {
    if (covered.has(title)) continue;
    lines.push(`Инструкция по охране труда: ${title}. В конструкторе ещё не собрана, в перечень включена по профилю организации.`);
  }
  if (lines.length === 0) return [block("body", "Подтверждённых инструкций и профессий пока нет.")];
  return lines.map((line, index) => block("body", `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`));
}

function toolLines(profile: OrganizationProfile, context: GenerateContext): string[] {
  const named = POWER_TOOLS.filter(([id]) => profile.gearIds.includes(id)).map(([id, fallback]) => context.gearTitle(id) || fallback);
  if (profile.flags.powerTools === true && named.length === 0) {
    named.push("электроинструмент подтверждён без отдельного наименования в перечне оборудования");
  }
  return named;
}

function bodyFor(code: string, profile: OrganizationProfile, context: GenerateContext, values: Record<string, string>): GeneratedBlock[] {
  const org = values["organization.name"] || "организации";
  const short = values["organization.shortName"] || org;
  const responsible = values.responsiblePerson || "не указано";
  const responsibleTitle = values.responsibleTitle || "ответственного за охрану труда";
  const city = values["organization.city"] || "";

  if (code === "osh_order_responsible") {
    return [
      block("body", `В целях организации работы по охране труда в ${org}${city ? ` (${city})` : ""}`),
      block("body", "ПРИКАЗЫВАЮ:", true),
      block("body", `1. Возложить обязанности по охране труда на ${responsible}, ${responsibleTitle}.`),
      block("body", `2. ${responsible} обеспечить учёт инструкций по охране труда, проведение вводного инструктажа и инструктажа на рабочем месте, а также доведение требований охраны труда до работников ${short}.`),
      block("body", "3. Контроль исполнения настоящего приказа оставляю за собой."),
    ];
  }

  if (code === "osh_policy_suot") {
    return [
      block("body", "1. Общие положения", true),
      block("body", `Настоящее положение описывает, как в ${org} распределяются обязанности по охране труда, как учитываются инструкции и как работник получает информацию об опасностях своей работы.`),
      block("body", "2. Распределение обязанностей", true),
      block("body", `Руководитель ${values["organization.director"] || ""} организует охрану труда и утверждает локальные документы. ${responsibleTitle} ${responsible} ведёт учёт инструкций, инструктажей и перечень профессий.`),
      block("body", "3. Инструкции и инструктажи", true),
      block("body", "Инструкция собирается по фактической профессии, работам, оборудованию и условиям. Работник знакомится с инструкцией до допуска к самостоятельной работе. Повторное ознакомление проводится при изменении работ или оборудования."),
      block("body", "4. Действия работников", true),
      block("body", "Работник выполняет работу в пределах порученного, применяет выданные средства защиты и сообщает руководителю о неисправности оборудования и об опасности, которую нельзя устранить самостоятельно."),
    ];
  }

  if (code === "osh_order_approve") {
    return [
      block("body", `Для применения в ${org} утвердить инструкции по охране труда согласно перечню.`),
      block("body", "ПРИКАЗЫВАЮ:", true),
      block("body", "1. Утвердить следующие инструкции:"),
      ...instructionBlocks(profile, context),
      block("body", `2. ${responsible} организовать ознакомление работников с инструкциями по их профессиям до начала самостоятельной работы.`),
      block("body", "3. Инструкцию, которая ещё не собрана в конструкторе, ввести в действие после сборки и повторного утверждения."),
    ];
  }

  if (code === "osh_list_instructions") {
    return [
      block("body", `Перечень составлен по профессиям ${org} и по уже собранным инструкциям. Отдельный список профессий для этого документа не заводится.`),
      ...instructionBlocks(profile, context),
    ];
  }

  if (code === "osh_list_positions") {
    return [
      block("body", `Перечень профессий и должностей ${org}, по которым ведутся инструкции и инструктажи.`),
      ...professionBlocks(profile, context),
    ];
  }

  if (code === "osh_program_intro") {
    return [
      block("body", `Программа вводного инструктажа для работников ${org}.`),
      block("body", "Тема 1. Обязанности работника и работодателя в пределах этой организации, порядок обращения к руководителю и к ответственному за охрану труда.", true),
      block("body", "Тема 2. Основные опасности по подтверждённым профессиям, оборудованию и условиям работы. Конкретные меры берутся из инструкции по профессии, а не из общего перечня.", true),
      block("body", "Тема 3. Порядок допуска: инструкция, инструктаж на рабочем месте, исправность инструмента и применение выданных средств защиты.", true),
      block("body", "Тема 4. Действия при неисправности, травме и пожаре: прекратить работу, сообщить руководителю, не приступать снова, пока опасность не снята.", true),
      block("body", `Инструктаж проводит ${responsibleTitle} ${responsible}. Продолжительность и состав тем уточняются по фактическим профессиям организации.`),
    ];
  }

  if (code === "osh_order_training") {
    return [
      block("body", `Для организации обучения и инструктажей в ${org}`),
      block("body", "ПРИКАЗЫВАЮ:", true),
      block("body", `1. Проводить вводный инструктаж по программе организации. Ответственный: ${responsible}, ${responsibleTitle}.`),
      block("body", "2. Первичный инструктаж на рабочем месте проводить по инструкции соответствующей профессии до допуска к самостоятельной работе."),
      block("body", "3. Повторный инструктаж проводить при изменении профессии, работ, оборудования или условий."),
      block("body", "4. Учёт инструктажей вести в журналах организации. Работник, не прошедший инструктаж по своей инструкции, к самостоятельной работе не допускается."),
    ];
  }

  const tools = toolLines(profile, context);
  return [
    block("body", `В ${org} применяются следующие электроинструменты:`),
    ...(tools.length > 0 ? tools.map((title, index) => block("body", `${index + 1}. ${title}`)) : [block("body", "Наименования электроинструмента в профиле не подтверждены.")]),
    block("body", "ПРИКАЗЫВАЮ:", true),
    block("body", "1. Допустить к работе с указанным электроинструментом работников, чья профессия и инструкция учитывают этот инструмент."),
    block("body", "2. Перед работой осмотреть корпус, кабель, вилку и рабочий орган. Неисправный инструмент не применять."),
    block("body", `3. Учёт допуска и ознакомление с инструкцией возложить на ${responsible}, ${responsibleTitle}.`),
    block("body", "4. Если электроинструмент в организации не применяется, настоящий приказ не издаётся."),
  ];
}

const FILENAME: Record<string, string> = {
  osh_order_responsible: "prikaz-obyazannosti-ot",
  osh_policy_suot: "polozhenie-suot",
  osh_order_approve: "prikaz-utverzhdenie-instrukcij",
  osh_list_instructions: "perechen-instrukcij",
  osh_list_positions: "perechen-professij",
  osh_program_intro: "programma-vvodnogo-instruktazha",
  osh_order_training: "prikaz-obuchenie-ot",
  osh_order_power_tools: "prikaz-elektroinstrument",
};

/** Общий сборщик восьми документов. Не проверяет, нужен ли документ организации. */
export function renderCoreDocument(profile: OrganizationProfile, document: DocumentModule, context?: GenerateContext): GeneratedDocument {
  const current = context ?? fallbackContext();
  const values = requirementValues(profile, document.requiredData?.length ? document.requiredData : SHARED_REQUISITES);
  const blocks = [...header(values, document.name), ...bodyFor(document.code, profile, current, values), ...signature(values)];
  const filled = fillTemplate(
    { id: document.templateId || `tpl_${document.code}`, title: document.name, filename: FILENAME[document.code] || document.code, blocks },
    values,
  );
  return {
    ...filled,
    inclusionReason: current.reason,
    formedAt: current.formedAt,
    normativeStatus: "needs_review",
  };
}
