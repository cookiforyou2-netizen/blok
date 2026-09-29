import type { IndustryPreset } from "./types";

/**
 * Пресет — не факт организации и не готовый пакет.
 * Он только предлагает значения с источником preset и статусом inferred.
 * Состав документов считает applicability. Пользователь может снять любое предложение.
 */
export const PRESETS: IndustryPreset[] = [
  {
    id: "school",
    title: "Школа",
    industry: "Образование",
    activity: "Общее образование",
    professionIds: ["cleaner_office", "janitor", "car_driver", "housing_electrician", "cook"],
    workIds: ["work_cleaning", "work_territory", "work_driving", "work_vehicle_check", "work_electrical_maint", "work_electrical_install", "work_kitchen"],
    gearIds: ["cleaning_agents", "hand_tools", "car", "insulated_tools", "voltage_indicator", "ladder", "drill"],
    conditionIds: ["cond_indoor", "cond_outdoor", "cond_traffic", "cond_hot_kitchen"],
    flags: { food: true, transport: true, electrical: true, height: true, powerTools: true },
  },
  {
    id: "construction",
    title: "Строительство",
    industry: "Строительство",
    activity: "Строительно-монтажные работы",
    professionIds: ["installer", "carpenter", "mason", "electrician", "rebar"],
    workIds: ["work_slinging", "work_moving_parts", "work_metal_prep", "work_manual_loading", "work_electrical_install"],
    gearIds: ["hoist", "hand_tools", "ladder", "angle_grinder"],
    conditionIds: ["cond_height", "cond_outdoor", "cond_indoor"],
    flags: { height: true, hazardousWork: true, production: true, powerTools: true },
  },
  {
    id: "auto_service",
    title: "Автосервис",
    industry: "Ремонт транспорта",
    activity: "Техническое обслуживание автомобилей",
    professionIds: ["auto_mechanic", "auto_locksmith", "car_washer"],
    workIds: ["work_locksmith", "work_vehicle_check", "work_cleaning"],
    gearIds: ["hand_tools", "car", "drill", "angle_grinder", "cleaning_agents"],
    conditionIds: ["cond_indoor"],
    flags: { transport: true, powerTools: true },
  },
  {
    id: "clinic",
    title: "Клиника",
    industry: "Здравоохранение",
    activity: "Медицинская деятельность",
    professionIds: ["cleaner_office", "janitor", "housing_electrician"],
    workIds: ["work_cleaning", "work_territory", "work_electrical_maint"],
    gearIds: ["cleaning_agents", "hand_tools", "insulated_tools", "voltage_indicator"],
    conditionIds: ["cond_indoor", "cond_outdoor"],
    flags: { electrical: true },
  },
  {
    id: "production",
    title: "Производство",
    industry: "Производство",
    activity: "Производство и ремонт",
    professionIds: ["electrogas_welder", "repair_fitter", "loader", "turner"],
    workIds: ["work_manual_arc", "work_metal_prep", "work_weld_clean", "work_locksmith", "work_moving_parts", "work_manual_loading"],
    gearIds: ["welding_machine", "angle_grinder", "hand_tools", "vise", "drill", "hand_truck"],
    conditionIds: ["cond_indoor", "cond_hot_zone"],
    flags: { production: true, powerTools: true, hazardousWork: true },
  },
  {
    id: "office",
    title: "Офис",
    industry: "Офис",
    activity: "Административная деятельность",
    professionIds: ["cleaner_office", "utility_worker", "copy_operator", "courier"],
    workIds: ["work_cleaning", "work_territory", "work_moving_parts", "work_electrical_maint", "work_manual_loading"],
    gearIds: ["hand_tools", "hand_truck", "cleaning_agents"],
    conditionIds: ["cond_indoor", "cond_outdoor", "cond_traffic"],
    flags: {},
  },
  {
    id: "warehouse",
    title: "Склад",
    industry: "Склад",
    activity: "Складская обработка грузов",
    professionIds: ["storekeeper", "loader", "picker", "forklift_driver"],
    workIds: ["work_stacking", "work_manual_loading", "work_vehicle_check"],
    gearIds: ["hand_truck", "forklift"],
    conditionIds: ["cond_indoor", "cond_traffic"],
    flags: { warehouse: true, transport: true },
  },
  {
    id: "food",
    title: "Пищевое производство",
    industry: "Пищевое производство",
    activity: "Производство и приготовление пищи",
    professionIds: ["cook", "baker", "dishwasher", "confectioner"],
    workIds: ["work_kitchen", "work_cleaning"],
    gearIds: ["hand_tools", "cleaning_agents"],
    conditionIds: ["cond_indoor", "cond_hot_kitchen"],
    flags: { food: true },
  },
];

export function presetById(id: string): IndustryPreset | undefined {
  return PRESETS.find((item) => item.id === id);
}
