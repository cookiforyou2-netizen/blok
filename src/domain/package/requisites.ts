import type { DataRequirement } from "./types";

/** Общие реквизиты пакета. Спрашиваются один раз и читаются всеми генераторами. */
export const SHARED_REQUISITES: DataRequirement[] = [
  { id: "organization.name", label: "Полное название организации", field: "name", key: "value" },
  { id: "organization.shortName", label: "Сокращённое название", field: "short_name", key: "value" },
  { id: "organization.city", label: "Город", field: "city", key: "value" },
  { id: "organization.address", label: "Адрес", field: "address", key: "value" },
  { id: "organization.director", label: "ФИО руководителя", field: "director", key: "value" },
  { id: "organization.directorTitle", label: "Должность руководителя", field: "director_title", key: "value" },
  { id: "responsiblePerson", label: "Ответственное лицо за охрану труда", field: "responsible", key: "value" },
  { id: "responsibleTitle", label: "Должность ответственного", field: "responsible_title", key: "value" },
  { id: "approvalDate", label: "Дата", field: "approval_date", key: "value" },
];
