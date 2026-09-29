import type { DocTemplate } from "./template";

export const orderResponsibleTemplate: DocTemplate = {
  id: "tpl_osh_order_responsible",
  title: "Приказ о возложении обязанностей по охране труда",
  filename: "prikaz-obyazannosti-ot",
  blocks: [
    { kind: "right", text: "{{organization.name}}", bold: true },
    { kind: "right", text: "{{organization.address}}" },
    { kind: "right", text: "ПРИКАЗ", bold: true },
    { kind: "right", text: "{{approvalDate}}" },
    { kind: "heading", text: "О возложении обязанностей по охране труда", bold: true },
    { kind: "body", text: "В целях организации работы по охране труда в {{organization.name}}" },
    { kind: "body", text: "ПРИКАЗЫВАЮ:", bold: true },
    { kind: "body", text: "1. Возложить обязанности по охране труда на {{responsiblePerson}}" },
    {
      kind: "body",
      text: "2. {{responsiblePerson}} обеспечить учёт инструкций по охране труда, проведение инструктажей и доведение требований охраны труда до работников.",
    },
    { kind: "body", text: "3. Контроль исполнения настоящего приказа оставляю за собой." },
    { kind: "body", text: "Руководитель {{organization.director}}" },
    {
      kind: "body",
      text: "Проект документа собран по профилю организации. Нормативное основание и формулировки требуют проверки специалистом по охране труда.",
    },
  ],
};
