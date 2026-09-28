import { meta } from "./meta";
import type { CategoryId, Profession } from "./types";

const DAY = "2026-09-26";

interface Seed {
  id: string;
  title: string;
  category: CategoryId;
  aliases?: string[];
  depth?: "full" | "catalog";
  summary: string;
  workerRequirements?: string[];
  admission?: string[];
  hygiene?: string[];
  extras?: string[];
  suggestedWorkIds?: string[];
  suggestedGearIds?: string[];
  suggestedConditionIds?: string[];
  workRest?: string;
}

function prof(seed: Seed): Profession {
  return {
    meta: meta({ id: seed.id, title: seed.title }),
    category: seed.category,
    aliases: seed.aliases ?? [],
    depth: seed.depth ?? "catalog",
    summary: seed.summary,
    workerRequirements: seed.workerRequirements ?? [],
    admission: seed.admission ?? [],
    hygiene: seed.hygiene ?? [],
    extras: seed.extras ?? [],
    suggestedWorkIds: seed.suggestedWorkIds ?? [],
    suggestedGearIds: seed.suggestedGearIds ?? [],
    suggestedConditionIds: seed.suggestedConditionIds ?? [],
    workRest: seed.workRest,
  };
}

const sharedAdmission = [
  "К работе допускают работника, прошедшего обучение по охране труда, оказанию первой помощи, применению СИЗ, стажировку и проверку знаний в объёме, который установлен для этой работы. Конкретный порядок обучения перед утверждением инструкции сверить с действующими правилами.",
  "Обязательные медицинские осмотры проходят, если они предусмотрены для данного вида работ. Факт годности не заменяется названием профессии.",
  "Работник выполняет только порученную работу, для которой его допустили, и применяет выданные СИЗ.",
];

const sharedHygiene = [
  "Мыть руки до еды и после работы с металлами, маслами и химическими средствами. Пищу не хранить на рабочем месте.",
  "Спецодежду не уносить домой, если на объекте есть место для её хранения. Загрязнённую одежду сдать, а не продолжать работу в прожжённой или промасленной.",
];

export const professions: Profession[] = [
  prof({
    id: "electrogas_welder",
    title: "Электрогазосварщик",
    category: "metal",
    depth: "full",
    aliases: ["сварщик", "электрогазосварщик"],
    summary:
      "Полная модель. Базовые работы не включаются все сразу: дуговая сварка, полуавтомат, газовая резка, УШМ и высота подключаются только после подтверждения.",
    workerRequirements: [
      "Работник знает устройство закреплённого за ним сварочного оборудования в объёме руководства по эксплуатации и умеет прекратить сварку.",
      "К огневым работам не допускают без оформления, которое установлено на объекте для этого места.",
    ],
    admission: sharedAdmission,
    hygiene: sharedHygiene,
    extras: [
      "Два работника с одним наименованием должности могут иметь разные инструкции: состав определяют фактические работы, а не только название должности.",
    ],
    suggestedWorkIds: ["work_manual_arc", "work_metal_prep", "work_weld_clean"],
    suggestedGearIds: ["welding_machine", "angle_grinder", "hand_tools"],
    suggestedConditionIds: ["cond_indoor", "cond_hot_zone"],
  }),
  prof({
    id: "repair_fitter",
    title: "Слесарь-ремонтник",
    category: "repair",
    depth: "full",
    aliases: ["слесарь", "ремонтник"],
    summary: "Полная модель. Модули УШМ, дрели и ручного инструмента общие со сварщиком и электромонтёром.",
    workerRequirements: [
      "Работник умеет остановить ремонтируемый агрегат и не начинает разборку до исключения пуска и сброса давления.",
    ],
    admission: sharedAdmission,
    hygiene: sharedHygiene,
    extras: [],
    suggestedWorkIds: ["work_locksmith", "work_metal_prep", "work_moving_parts"],
    suggestedGearIds: ["hand_tools", "vise", "angle_grinder", "drill"],
    suggestedConditionIds: ["cond_indoor"],
  }),
  prof({
    id: "electrician",
    title: "Электромонтёр по ремонту и обслуживанию электрооборудования",
    category: "energy",
    depth: "full",
    aliases: ["электромонтёр", "электрик"],
    summary:
      "Полная модель. УШМ подключается тем же модулем, что у сварщика и слесаря, только если работник её подтвердил. Действующая установка — отдельное условие.",
    workerRequirements: [
      "Группа по электробезопасности должна соответствовать порученной работе. Номер группы в инструкцию не подставляется автоматически.",
    ],
    admission: sharedAdmission,
    hygiene: sharedHygiene,
    extras: ["Плакаты, замки и ограждения электроустановки работник не снимает без указания допускающего."],
    suggestedWorkIds: ["work_electrical_maint", "work_electrical_install"],
    suggestedGearIds: ["insulated_tools", "voltage_indicator", "hand_tools", "angle_grinder", "drill"],
    suggestedConditionIds: ["cond_indoor"],
  }),
  prof({
    id: "car_driver",
    title: "Водитель автомобиля",
    category: "transport",
    depth: "full",
    aliases: ["водитель", "шофёр"],
    summary: "Полная модель. Режим труда и отдыха не заполняется выдуманными часами: его берут из правил, действующих для этого водителя.",
    workerRequirements: [
      "Водитель имеет право управления транспортным средством соответствующей категории и проходит предрейсовые мероприятия, если они установлены для перевозки.",
    ],
    admission: sharedAdmission,
    hygiene: sharedHygiene,
    extras: [],
    workRest:
      "Режим труда и отдыха водителя устанавливают правилами внутреннего трудового распорядка с учётом особенностей регулирования труда водителей. Конкретные нормы времени управления и перерывов перед утверждением инструкции требуют проверки по действующим актам. В текст не подставлены часы и километры.",
    suggestedWorkIds: ["work_driving", "work_vehicle_check"],
    suggestedGearIds: ["car", "hand_tools"],
    suggestedConditionIds: ["cond_traffic", "cond_outdoor"],
  }),
  prof({
    id: "loader",
    title: "Грузчик",
    category: "warehouse",
    depth: "full",
    aliases: ["грузчик"],
    summary: "Полная модель. Подъёмные механизмы и погрузчик не включаются, пока их не отметили.",
    workerRequirements: [
      "Работник не поднимает груз неизвестной массы в одиночку и не работает под поднятым грузом.",
    ],
    admission: sharedAdmission,
    hygiene: sharedHygiene,
    extras: ["Нормы предельной массы груза зависят от работника и условий. Число в инструкцию не подставляется без проверки."],
    suggestedWorkIds: ["work_manual_loading", "work_stacking", "work_moving_parts"],
    suggestedGearIds: ["hand_truck"],
    suggestedConditionIds: ["cond_indoor"],
  }),
  ...catalogRows(),
];

function catalogRows(): Profession[] {
  const rows: [string, string, CategoryId, string, string[], string[], string[]][] = [
    ["arc_welder", "Электросварщик ручной сварки", "metal", "Карточка связана с теми же сварочными модулями. Газ и УШМ не включены, пока их не подтвердят.", ["work_manual_arc", "work_metal_prep", "work_weld_clean"], ["welding_machine", "hand_tools"], ["cond_indoor", "cond_hot_zone"]],
    ["gas_cutter", "Газорезчик", "metal", "Резка и баллоны — отдельные модули. УШМ предлагается только для зачистки.", ["work_gas_cutting", "work_metal_prep", "work_weld_clean"], ["gas_cylinder", "angle_grinder", "hand_tools"], ["cond_hot_zone"]],
    ["plumber_fitter", "Слесарь-сантехник", "repair", "Модуль трубопроводов общий с сантехником. Сварочный аппарат не предлагается.", ["work_pipe_work", "work_locksmith"], ["hand_tools", "drill"], ["cond_indoor"]],
    ["electrician_installer", "Электромонтажник", "energy", "Монтаж без автоматического включения действующей установки.", ["work_electrical_install"], ["insulated_tools", "voltage_indicator", "hand_tools", "drill"], ["cond_indoor"]],
    ["turner", "Токарь", "metal", "Отраслевой пакет станка ещё не загружен. Доступны общие слесарные и ручные модули.", ["work_locksmith", "work_metal_prep"], ["hand_tools", "vise"], ["cond_indoor"]],
    ["miller", "Фрезеровщик", "metal", "Пакет фрезерного станка не загружен. Можно собрать инструкцию из общих модулей после подтверждения работ.", ["work_metal_prep"], ["hand_tools"], ["cond_indoor"]],
    ["machine_operator", "Станочник широкого профиля", "metal", "Карточка каталога. Конкретный станок добавляют отдельным модулем, не текстом «соблюдать безопасность».", [], ["hand_tools"], ["cond_indoor"]],
    ["cnc_operator", "Оператор станков с ЧПУ", "metal", "Пакет ЧПУ не загружен. Ограждения и зона захвата появятся отдельным модулем станка.", [], ["hand_tools"], ["cond_indoor"]],
    ["installer", "Монтажник стальных и железобетонных конструкций", "construction", "Высота и строповка предлагаются, но включаются только по отметке.", ["work_slinging", "work_moving_parts"], ["hoist", "hand_tools", "ladder"], ["cond_height", "cond_outdoor"]],
    ["carpenter", "Плотник", "construction", "Режущий ручной инструмент и высота — по факту работ.", ["work_metal_prep"], ["hand_tools", "ladder"], ["cond_outdoor"]],
    ["joiner", "Столяр", "construction", "Станочный пакет деревообработки не загружен.", ["work_metal_prep"], ["hand_tools"], ["cond_indoor"]],
    ["painter", "Маляр", "construction", "Пакет окрасочных работ не загружен. Химический модуль можно подтвердить вручную.", [], ["cleaning_agents", "ladder"], ["cond_indoor"]],
    ["plasterer", "Штукатур", "construction", "Пакет штукатурных работ не загружен.", [], ["hand_tools", "ladder"], ["cond_indoor"]],
    ["mason", "Каменщик", "construction", "Пакет каменных работ не загружен. Высота не включается сама.", [], ["hand_tools", "ladder"], ["cond_outdoor"]],
    ["concrete_worker", "Бетонщик", "construction", "Пакет бетонных работ не загружен.", ["work_manual_loading"], ["hand_tools"], ["cond_outdoor"]],
    ["rebar", "Арматурщик", "construction", "Вязка и резка арматуры получат отдельный пакет. Пока доступны общие модули.", ["work_metal_prep", "work_moving_parts"], ["hand_tools", "angle_grinder"], ["cond_outdoor"]],
    ["roofer", "Кровельщик", "construction", "Высота предлагается и требует подтверждения.", [], ["hand_tools", "ladder"], ["cond_height", "cond_outdoor"]],
    ["forklift_driver", "Водитель погрузчика", "transport", "Модуль погрузчика один на все профессии склада и транспорта.", ["work_vehicle_check"], ["forklift"], ["cond_indoor", "cond_traffic"]],
    ["tractor_driver", "Тракторист", "transport", "Общий модуль самоходной машины. Сельскохозяйственный пакет подключится отдельно.", ["work_vehicle_check"], ["self_propelled"], ["cond_outdoor"]],
    ["excavator_operator", "Машинист экскаватора", "transport", "Тот же модуль самоходной машины, что у тракториста и бульдозериста.", ["work_vehicle_check"], ["self_propelled"], ["cond_outdoor", "cond_traffic"]],
    ["crane_operator", "Машинист крана автомобильного", "transport", "Управление краном как профессия машиниста ещё ждёт отдельный пакет. Строповка и грузоподъём уже в библиотеке.", ["work_slinging"], ["hoist", "car"], ["cond_outdoor"]],
    ["slinger", "Стропальщик", "transport", "Модуль строповки общий с монтажником и такелажником.", ["work_slinging", "work_moving_parts"], ["hoist", "hand_tools"], ["cond_outdoor"]],
    ["bus_driver", "Водитель автобуса", "transport", "Базовый модуль автомобиля. Перевозка пассажиров потребует отдельного пакета, часы смены не выдуманы.", ["work_driving", "work_vehicle_check"], ["car"], ["cond_traffic"]],
    ["bulldozer_operator", "Машинист бульдозера", "transport", "Общий модуль самоходной машины.", ["work_vehicle_check"], ["self_propelled"], ["cond_outdoor"]],
    ["dump_driver", "Водитель самосвала", "transport", "Базовый автомобиль. Кузов самосвала — будущий пакет, не копия текста легкового водителя.", ["work_driving", "work_vehicle_check", "work_manual_loading"], ["car"], ["cond_traffic", "cond_outdoor"]],
    ["storekeeper", "Кладовщик", "warehouse", "Складские модули общие с комплектовщиком и грузчиком.", ["work_stacking", "work_manual_loading"], ["hand_truck"], ["cond_indoor"]],
    ["picker", "Комплектовщик", "warehouse", "Те же складские модули, без погрузочной техники, пока её не отметили.", ["work_stacking"], ["hand_truck"], ["cond_indoor"]],
    ["handyman", "Разнорабочий", "office", "Профессия не задаёт инструкцию. Работы отмечают по факту смены.", ["work_manual_loading", "work_territory"], ["hand_tools", "hand_truck"], ["cond_outdoor"]],
    ["cleaner_prod", "Уборщик производственных помещений", "cleaning", "Модуль уборки общий со служебными помещениями. Химия — отдельное подтверждение.", ["work_cleaning"], ["cleaning_agents"], ["cond_indoor"]],
    ["cleaner_office", "Уборщик служебных помещений", "cleaning", "Тот же модуль уборки, что у производственных помещений.", ["work_cleaning"], ["cleaning_agents"], ["cond_indoor"]],
    ["janitor", "Дворник", "housing", "Модуль уборки территории общий с уборщиком территории.", ["work_territory"], ["hand_tools"], ["cond_outdoor", "cond_traffic"]],
    ["boiler_operator", "Оператор котельной", "energy", "Модуль котла. Газовые баллоны не подставляются, если котёл питается иначе.", ["work_boiler_ops"], [], ["cond_indoor", "cond_explosive"]],
    ["plumber", "Сантехник", "housing", "Тот же модуль трубопроводов, что у слесаря-сантехника.", ["work_pipe_work"], ["hand_tools", "drill"], ["cond_indoor"]],
    ["mechanic", "Механик", "repair", "Общие ремонтные модули. Станок и автомобиль добавляют отдельно.", ["work_locksmith"], ["hand_tools", "vise", "drill"], ["cond_indoor"]],
    ["auto_mechanic", "Автомеханик", "repair", "Осмотр автомобиля и слесарные работы. Пост с ямой — будущий пакет.", ["work_locksmith", "work_vehicle_check"], ["hand_tools", "car", "drill"], ["cond_indoor"]],
    ["battery_tech", "Аккумуляторщик", "repair", "Пакет аккумуляторной не загружен. Химический модуль можно подтвердить.", ["work_locksmith"], ["cleaning_agents", "hand_tools"], ["cond_indoor"]],
    ["assembly_fitter", "Слесарь механосборочных работ", "metal", "Сборочные операции опираются на слесарный модуль.", ["work_locksmith", "work_moving_parts"], ["hand_tools", "vise", "drill"], ["cond_indoor"]],
    ["toolmaker", "Слесарь-инструментальщик", "metal", "Пакет заточного станка не загружен.", ["work_locksmith"], ["hand_tools", "vise", "angle_grinder"], ["cond_indoor"]],
    ["grinder_worker", "Шлифовщик", "metal", "Станок шлифовки не загружен. Ручная УШМ — только по отметке.", [], ["angle_grinder", "hand_tools"], ["cond_indoor"]],
    ["blacksmith", "Кузнец", "metal", "Пакет кузнечных работ не загружен. Пока действует горячий процесс металла, не зона сварки.", ["work_metal_prep"], ["hand_tools"], ["cond_hot_metal"]],
    ["tinsmith", "Жестянщик", "metal", "Общие модули металла и ручного инструмента.", ["work_metal_prep", "work_weld_clean"], ["hand_tools", "drill", "angle_grinder"], ["cond_indoor"]],
    ["foundry", "Литейщик", "manufacturing", "Пакет литейного производства не загружен. Пока действует горячий процесс металла, не зона сварки.", [], ["hand_tools"], ["cond_hot_metal", "cond_indoor"]],
    ["heat_treat", "Термист", "manufacturing", "Пакет термической обработки не загружен. Пока действует подготовка металла и горячий процесс, не зона сварки.", ["work_metal_prep"], ["hand_tools"], ["cond_hot_metal", "cond_indoor"]],
    ["galvanic", "Гальваник", "manufacturing", "Пакет гальваники не загружен. Химию подтверждают отдельно.", [], ["cleaning_agents"], ["cond_indoor"]],
    ["press_operator", "Прессовщик", "manufacturing", "Пакет пресса не загружен.", ["work_moving_parts"], ["hand_tools"], ["cond_indoor"]],
    ["stamp_operator", "Штамповщик", "manufacturing", "Пакет штампа не загружен.", ["work_moving_parts"], ["hand_tools"], ["cond_indoor"]],
    ["qc_inspector", "Контролёр ОТК", "manufacturing", "Осмотр изделий. Станочные опасности не копируются из профессии станочника.", [], ["hand_tools"], ["cond_indoor"]],
    ["assembler", "Сборщик изделий", "manufacturing", "Сборка без автоматического набора всех инструментов цеха.", ["work_locksmith", "work_moving_parts"], ["hand_tools", "drill"], ["cond_indoor"]],
    ["line_operator", "Оператор производственной линии", "manufacturing", "Пакет конкретной линии не загружен. Пока действует общее перемещение деталей.", ["work_moving_parts"], ["hand_truck"], ["cond_indoor"]],
    ["tiler", "Облицовщик-плиточник", "construction", "Пакет плиточных работ не загружен.", [], ["hand_tools", "angle_grinder"], ["cond_indoor"]],
    ["insulator", "Изолировщик", "construction", "Пакет изоляционных работ не загружен.", [], ["hand_tools", "ladder"], ["cond_height"]],
    ["glazier", "Стекольщик", "construction", "Пакет стекольных работ не загружен. Порез закрывает общий ручной модуль после подтверждения.", [], ["hand_tools", "ladder"], ["cond_height"]],
    ["road_worker", "Дорожный рабочий", "construction", "Зона движения транспорта предлагается отдельно от самой профессии.", ["work_territory", "work_manual_loading"], ["hand_tools"], ["cond_traffic", "cond_outdoor"]],
    ["vent_installer", "Монтажник систем вентиляции", "construction", "Высота и ручной инструмент — по факту.", ["work_moving_parts"], ["hand_tools", "drill", "ladder"], ["cond_height", "cond_indoor"]],
    ["stacker_driver", "Водитель штабелёра", "warehouse", "До отдельного пакета штабелёра можно опереться на модуль погрузчика только если техника совпадает. По умолчанию он не включён.", ["work_stacking"], ["hand_truck"], ["cond_indoor"]],
    ["receiver", "Приёмщик товаров", "warehouse", "Складские модули без обязательной погрузки.", ["work_stacking", "work_manual_loading"], ["hand_truck"], ["cond_indoor"]],
    ["packer", "Упаковщик", "warehouse", "Комплектация и ручное перемещение.", ["work_stacking", "work_moving_parts"], ["hand_tools"], ["cond_indoor"]],
    ["marker", "Маркировщик", "warehouse", "Карточка каталога без отдельного химического пакета маркировки.", ["work_stacking"], [], ["cond_indoor"]],
    ["housing_worker", "Рабочий по комплексному обслуживанию зданий", "housing", "Набор работ смешанный: территория, инструмент, возможно высота. Ничего не включено молча.", ["work_territory", "work_pipe_work"], ["hand_tools", "ladder"], ["cond_outdoor"]],
    ["treatment_operator", "Оператор очистных сооружений", "housing", "Замкнутые ёмкости не включаются, пока их не отметили.", ["work_cleaning"], ["cleaning_agents"], ["cond_indoor"]],
    ["low_voltage", "Монтажник слаботочных систем", "housing", "Электромонтажный модуль. Силовую установку не добавлять без условия.", ["work_electrical_install"], ["hand_tools", "drill", "ladder"], ["cond_indoor", "cond_height"]],
    ["lift_operator", "Лифтёр", "housing", "Пакет лифта не загружен. Пока действует обслуживание электрооборудования.", ["work_electrical_maint"], ["hand_tools", "insulated_tools"], ["cond_indoor"]],
    ["car_washer", "Мойщик автомобилей", "cleaning", "Химия и скользкий пол — через общие модули.", ["work_cleaning", "work_vehicle_check"], ["cleaning_agents", "car"], ["cond_indoor"]],
    ["scrubber_operator", "Оператор поломоечной машины", "cleaning", "Модуль уборки. Отдельная машина получит свой пакет, чтобы не копировать текст УШМ.", ["work_cleaning"], ["cleaning_agents"], ["cond_indoor"]],
    ["yard_cleaner", "Уборщик территории", "cleaning", "Тот же модуль, что у дворника.", ["work_territory"], ["hand_tools"], ["cond_outdoor", "cond_traffic"]],
    ["cook", "Повар", "food", "Кухонный модуль общий с пекарем и кондитером. Горячий цех — не зона сварки.", ["work_kitchen"], ["hand_tools"], ["cond_indoor", "cond_hot_kitchen"]],
    ["confectioner", "Кондитер", "food", "Тот же кухонный модуль и горячий цех, не зона сварки.", ["work_kitchen"], ["hand_tools"], ["cond_indoor", "cond_hot_kitchen"]],
    ["baker", "Пекарь", "food", "Тот же кухонный модуль и горячий цех. Печь как отдельное оборудование — будущий пакет.", ["work_kitchen"], [], ["cond_indoor", "cond_hot_kitchen"]],
    ["food_line", "Оператор линии пищевого производства", "food", "Линия не загружена. Нож, горячая поверхность и горячий цех — через общие модули.", ["work_kitchen"], [], ["cond_indoor", "cond_hot_kitchen"]],
    ["butcher", "Обвальщик мяса", "food", "Пакет обвалки не загружен. Режущий риск и горячий цех закрывают общие модули.", ["work_kitchen"], ["hand_tools"], ["cond_indoor", "cond_hot_kitchen"]],
    ["dishwasher", "Мойщик посуды", "food", "Кухня, горячий цех и химия.", ["work_kitchen", "work_cleaning"], ["cleaning_agents"], ["cond_indoor", "cond_hot_kitchen"]],
    ["agri_tractor", "Тракторист-машинист сельскохозяйственного производства", "agriculture", "Общий модуль самоходной машины, не отдельная копия текста.", ["work_vehicle_check"], ["self_propelled"], ["cond_outdoor"]],
    ["livestock", "Животновод", "agriculture", "Пакет животноводства не загружен.", ["work_manual_loading"], [], ["cond_indoor"]],
    ["milking", "Оператор машинного доения", "agriculture", "Пакет доильного оборудования не загружен. Пока действует уборка помещений.", ["work_cleaning"], ["cleaning_agents"], ["cond_indoor"]],
    ["field_worker", "Полевод", "agriculture", "Ручные полевые работы без автоматического трактора.", ["work_manual_loading", "work_territory"], ["hand_tools"], ["cond_outdoor"]],
    ["agri_fitter", "Слесарь по ремонту сельскохозяйственных машин", "agriculture", "Слесарный модуль плюс самоходная машина, если её ремонтируют.", ["work_locksmith", "work_vehicle_check"], ["hand_tools", "drill", "angle_grinder", "self_propelled"], ["cond_indoor"]],
    ["greenhouse", "Рабочий теплицы", "agriculture", "Карточка каталога.", ["work_manual_loading"], ["hand_tools"], ["cond_indoor"]],
    ["courier", "Курьер", "office", "Дорожный модуль не равен профессии водителя. Отметьте, если есть автомобиль.", ["work_manual_loading"], [], ["cond_traffic", "cond_outdoor"]],
    ["utility_worker", "Рабочий хозяйственной службы", "office", "Смешанные хозяйственные работы подтверждают по факту.", ["work_cleaning", "work_territory", "work_moving_parts"], ["hand_tools", "hand_truck"], ["cond_indoor"]],
    ["cloakroom", "Гардеробщик", "office", "Карточка каталога. Пока действует уборка помещений без химии.", ["work_cleaning"], [], ["cond_indoor"]],
    ["copy_operator", "Оператор копировально-множительной техники", "office", "Пакет оргтехники не загружен. Пока действует обслуживание электрооборудования.", ["work_electrical_maint"], ["hand_tools"], ["cond_indoor"]],
    ["watchman", "Вахтёр", "office", "Карточка каталога. Обход территории можно подтвердить отдельным модулем.", ["work_territory"], [], ["cond_outdoor"]],
    ["kipa", "Слесарь по КИПиА", "repair", "Электротехнические модули без чужих сварочных требований.", ["work_electrical_maint", "work_locksmith"], ["insulated_tools", "voltage_indicator", "hand_tools"], ["cond_indoor"]],
    ["adjuster", "Наладчик станков и манипуляторов", "equipment", "Пакет наладки станка не загружен.", ["work_locksmith"], ["hand_tools"], ["cond_indoor"]],
    ["auto_locksmith", "Слесарь по ремонту автомобилей", "repair", "Общие модули с автомехаником, текст не скопирован отдельной инструкцией.", ["work_locksmith", "work_vehicle_check"], ["hand_tools", "drill", "angle_grinder", "car"], ["cond_indoor"]],
    ["line_electrician", "Электромонтёр линейных сооружений", "energy", "Высота и действующая установка только по отметке.", ["work_electrical_maint"], ["insulated_tools", "voltage_indicator", "ladder"], ["cond_outdoor", "cond_height"]],
    ["heat_point", "Оператор теплового пункта", "energy", "Модуль трубопроводов и давление. Котёл не добавляется сам.", ["work_pipe_work"], ["hand_tools"], ["cond_indoor"]],
    ["housing_electrician", "Электромонтёр ЖКХ", "housing", "Те же электромодули, что у электромонтёра, без копирования текста.", ["work_electrical_maint", "work_electrical_install"], ["insulated_tools", "voltage_indicator", "hand_tools"], ["cond_indoor"]],
    ["metal_painter", "Маляр по металлу", "manufacturing", "Пакет окраски не загружен.", ["work_metal_prep"], ["cleaning_agents"], ["cond_indoor"]],
    ["rigger", "Такелажник", "warehouse", "Строповка та же, что у стропальщика.", ["work_slinging", "work_moving_parts"], ["hoist", "hand_tools"], ["cond_indoor"]],
    ["mixer_operator", "Машинист бетоносмесителя", "construction", "Пакет смесителя не загружен.", ["work_manual_loading"], [], ["cond_outdoor"]],
    ["compressor_operator", "Оператор компрессорной установки", "energy", "Пакет компрессора не загружен. Давление можно отразить через трубопроводы, если это соответствует факту.", ["work_pipe_work"], [], ["cond_indoor"]],
    ["pump_operator", "Машинист насосных установок", "housing", "Модуль трубопроводов.", ["work_pipe_work"], ["hand_tools"], ["cond_indoor"]],
    ["wood_machinist", "Станочник деревообрабатывающих станков", "manufacturing", "Пакет деревообрабатывающего станка не загружен.", [], ["hand_tools"], ["cond_indoor"]],
    ["lab_worker", "Лаборант производственной лаборатории", "manufacturing", "Пакет лаборатории не загружен. Химию подтверждают отдельно.", [], ["cleaning_agents"], ["cond_indoor"]],
  ];

  return rows.map((row) => {
    const [id, title, category, summary, works, gears, conds] = row;
    return prof({
      id,
      title,
      category: category as CategoryId,
      summary,
      suggestedWorkIds: works,
      suggestedGearIds: gears,
      suggestedConditionIds: conds,
      admission: sharedAdmission,
      hygiene: sharedHygiene,
      extras: ["Карточка подготовлена к отраслевому пакету. Факты берутся только из подтверждённых модулей библиотеки."],
      workerRequirements: [
        "Требования допуска — общие для карточки каталога. Особые условия профессии добавляют отдельным верифицированным модулем, а не свободным текстом модели.",
      ],
    });
  });
}

export const PROFESSION_COUNT = professions.length;
export const CATALOG_BUILT = DAY;
