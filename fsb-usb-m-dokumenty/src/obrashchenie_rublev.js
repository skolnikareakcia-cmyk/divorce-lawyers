// Обращение УСБ-М в Генеральную прокуратуру РО о лишении статуса неприкосновенности
// (RP, проект «Россия Онлайн»). Оформление — по шаблонам УСБ-М (герб, шапка разрядкой, М.П. с печатью).
// Запуск: node obrashchenie_rublev.js -> ../Obrashchenie_GP_Rublev.docx
// Фактические сведения — в объекте F; пустые поля выводятся линией с подсказкой курсивом.

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, Footer, PageNumber, TabStopType, Tab, ImageRun, VerticalAlign,
} = require("docx");

const OUT = path.join(__dirname, "..", "Obrashchenie_GP_Rublev.docx");
const FONT = "Times New Roman";
const CW = 9356; // 11906 - 1700 - 850
const SZ = 24; // 12 pt, как в шаблонах
const L = AlignmentType.LEFT, CE = AlignmentType.CENTER, J = AlignmentType.JUSTIFIED, RI = AlignmentType.RIGHT;

// ---------------------------------------------------------------- факты (заполняются по данным УСБ-М)
const F = {
  number: "",            // номер по приказу № 5: 011 + шесть знаков, присваивает канцелярия
  date: "«____» сентября 2026 г.",
  gpNumber: "",          // порядковый номер обращения в Генпрокуратуру
  applicantPassport: "",
  email: "",
  phone: "",
  mandate: "",           // поручение руководителя ССКБ: дата, номер, ссылка
  rublevPosition: "",    // должность, ведомство
  rublevBasis: "",       // часть ст. 1.1 закона о неприкосновенности
  rublevPassport: "",
  facts: [],             // абзацы описания деяния
  evidence: [],          // [материал, ссылка, тайм-коды]
  caseReport: "",        // отчёт о делопроизводстве: номер, ссылка
  chiefName: "",         // руководитель ССКБ, И.О. Фамилия
};

// ---------------------------------------------------------------- разметка
function R(text, base = {}) {
  const out = [];
  for (const part of String(text).split(/(\*\*[\s\S]*?\*\*)/)) {
    if (!part) continue;
    const bold = part.length >= 4 && part.startsWith("**") && part.endsWith("**");
    const t = bold ? part.slice(2, -2) : part;
    t.split("\t").forEach((seg, i) => {
      if (i > 0) out.push(new TextRun({ ...base, children: [new Tab()] }));
      if (seg) out.push(new TextRun({ ...base, text: seg, bold: bold || base.bold }));
    });
  }
  return out;
}
function P(text, o = {}) {
  return new Paragraph({
    alignment: o.align ?? J,
    indent: { left: o.left ?? 0, firstLine: o.noIndent ? 0 : 709 },
    spacing: { before: o.before ?? 0, after: o.after ?? 80, line: o.line ?? 252 },
    keepNext: !!o.keepNext, keepLines: true, tabStops: o.tabStops,
    children: R(text, { size: o.size ?? SZ, bold: o.bold, italics: o.italics, characterSpacing: o.spacing }),
  });
}
// подсказка под пустым полем — как в шаблонах УСБ-М
const HINT = (text) => P(text, { noIndent: true, italics: true, size: 16, after: 80 });
const BLANK = (n = 1) => Array.from({ length: n }, () => P("_".repeat(76), { noIndent: true, after: 40 }));
const val = (v, blank = "____________________") => (v ? v : blank);
const H = (text) => P(text, { noIndent: true, align: CE, bold: true, before: 200, after: 120, keepNext: true });
const LI = (items, o = {}) => items.map((t, i) => P(`${i + 1}. ${t}`, { after: 60, ...o }));

function table(widths, header, rows) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const borders = { top: b, bottom: b, left: b, right: b };
  const cell = (t, w, bold) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [new Paragraph({ alignment: bold ? CE : L, children: R(t, { size: 20, bold }) })],
  });
  return new Table({
    width: { size: widths.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, widths[i], false)) })),
    ],
  });
}

// ---------------------------------------------------------------- шапка по шаблону УСБ-М
const header = [
  new Paragraph({
    alignment: CE, spacing: { after: 60 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(__dirname, "emblem.png")), transformation: { width: 42, height: 82 }, altText: { title: "Эмблема ФСБ", description: "Эмблема ФСБ", name: "emblem" } })],
  }),
  P("ФЕДЕРАЛЬНАЯ СЛУЖБА БЕЗОПАСНОСТИ", { noIndent: true, align: CE, bold: true, after: 0, spacing: 20 }),
  P("РОССИЙСКОЙ ФЕДЕРАЦИИ", { noIndent: true, align: CE, bold: true, after: 0, spacing: 20 }),
  P("Управление собственной безопасности по городу Москва", { noIndent: true, align: CE, size: 20, after: 0 }),
  P("г. Москва, ул. Большая Лубянка, д. 27", { noIndent: true, align: CE, size: 20, after: 200 }),
];

// ---------------------------------------------------------------- подпись + М.П. с печатью
function signBlock(roleLines, name) {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const borders = { top: none, bottom: none, left: none, right: none };
  const left = [
    ...roleLines.map((l) => new Paragraph({ spacing: { after: 0 }, children: R(l, { size: SZ }) })),
    new Paragraph({ spacing: { before: 200, after: 0 }, children: R(`_______________ / ${name}`, { size: SZ }) }),
    new Paragraph({
      tabStops: [{ type: TabStopType.LEFT, position: 500 }, { type: TabStopType.LEFT, position: 2200 }],
      children: R("\tподпись\tИ.О. Фамилия", { size: 16, italics: true }),
    }),
  ];
  const right = [
    new Paragraph({ alignment: CE, children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(__dirname, "seal.png")), transformation: { width: 130, height: 130 }, altText: { title: "Печать", description: "Печать ФСБ", name: "seal" } })] }),
    new Paragraph({ alignment: CE, children: R("М.П.", { size: SZ }) }),
  ];
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [5600, CW - 5600],
    rows: [new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: 5600, type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.CENTER, children: left }),
      new TableCell({ width: { size: CW - 5600, type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.CENTER, children: right }),
    ] })],
  });
}

// ---------------------------------------------------------------- текст обращения
const evidenceRows = F.evidence.length
  ? F.evidence.map((e, i) => [String(i + 1), ...e])
  : [["1", "", "", ""], ["2", "", "", ""], ["3", "", "", ""]];
evidenceRows.push([String(evidenceRows.length + 1), "Отчёт о делопроизводстве УСБ-М" + (F.caseReport ? ` ${F.caseReport}` : ""), "", "Подтверждает, что проверка ведётся уполномоченными лицами"]);

const body = [
  ...header,
  P("О Б Р А Щ Е Н И Е", { noIndent: true, align: CE, bold: true, size: 30, after: 0, spacing: 40 }),
  P(`в Генеральную прокуратуру РО № ${val(F.gpNumber, "____")}`, { noIndent: true, align: CE, after: 0 }),
  P("о приостановлении статуса неприкосновенности и проведении расследования", { noIndent: true, align: CE, after: 160 }),
  P(`${F.date}\t№ 011 ${val(F.number, "______")}`, { noIndent: true, align: L, tabStops: [{ type: TabStopType.RIGHT, position: CW }], after: 0 }),
  P("г. Москва", { noIndent: true, align: CE, after: 200 }),

  P("**Кому:** Генеральному прокурору РО Н. Саркисяну", { noIndent: true, after: 40 }),
  P(`**От:** майора ФСБ Гумирова Сергея К., оперуполномоченного Управления собственной безопасности по городу Москва (УСБ-М), служебное удостоверение № 34330, паспорт ${val(F.applicantPassport, "серия ____ № ______")}`, { noIndent: true, after: 160 }),

  P("Я, майор ФСБ Гумиров Сергей К., действуя от имени Управления собственной безопасности по городу Москва в пределах его компетенции (ч. 1 ст. 7, п. «а» ст. 9, п. «у» ст. 10 ФЗ «О Федеральной службе безопасности»), обращаюсь в Генеральную прокуратуру РО в связи с выявлением признаков преступления, предусмотренного ч. 1 ст. 15.6 Уголовного кодекса РО (халатность), в действиях (бездействии) должностного лица, обладающего статусом неприкосновенности:"),
  P(`**генерал-полковника Рублева Владислава**, ${val(F.rublevPosition, "_______________________________")}, служебное удостоверение № 1320, паспорт ${val(F.rublevPassport, "серия ____ № ______")}.`, { after: 0 }),
  ...(F.rublevPosition ? [] : [HINT("должность, наименование государственного органа")]),
  P("К настоящему обращению прикладываю необходимую документацию и даю необходимые пояснения. Настоящим заверяю, что все показания, пояснения и документация являются подлинными.", { before: 80 }),

  H("I. ПРИЛОЖЕНИЯ К ОБРАЩЕНИЮ"),
  ...LI([
    "Ксерокопия документов, удостоверяющих личность: служебное удостоверение ФСБ № 34330, паспорт — ____________________.",
    `Электронная почта: ${val(F.email)}.`,
    `Номер телефона: ${val(F.phone)}.`,
    "Место нахождения: г. Москва, ул. Большая Лубянка, д. 27 (здание ФСБ РО).",
    `Документ о полномочиях: поручение руководителя ССКБ УСБ-М ${val(F.mandate, "от «____» __________ 2026 г. № 011 ______")}.`,
    "Доказательные материалы — в таблице ниже. Для видеозаписей длиннее 2 минут указаны тайм-коды начала и окончания каждого эпизода.",
    "Подробное описание деяния — раздел II.",
  ]),
  table([550, 3000, 2100, CW - 5650], ["№", "Материал", "Ссылка", "Тайм-коды и что зафиксировано"], evidenceRows),
  P("Материалы получены в ходе проверки, проводимой УСБ-М, что подтверждается отчётом о делопроизводстве. В соответствии с Регламентом подачи обращений в прокуратуру срок 48 часов на данное обращение не распространяется.", { before: 120 }),

  H("II. ОПИСАНИЕ ДЕЯНИЯ"),
  ...(F.facts.length
    ? F.facts.map((t) => P(t))
    : [
      HINT("Излагаются: основание статуса неприкосновенности (часть ст. 1.1); обязанность, которую должностное лицо было обязано исполнить, и каким актом она установлена; дата, время, место; в чём выразилось неисполнение или ненадлежащее исполнение; какие права, интересы или ущерб последовали; почему последствия наступили именно из-за этого; каким материалом подтверждается каждый факт."),
      ...BLANK(8),
    ]),

  H("III. ПРАВОВОЕ ОБОСНОВАНИЕ"),
  ...LI([
    "Изложенные обстоятельства содержат признаки преступления, предусмотренного ч. 1 ст. 15.6 Уголовного кодекса РО: неисполнение или ненадлежащее исполнение должностным лицом своих обязанностей вследствие недобросовестного или небрежного отношения к службе, повлёкшее существенное нарушение прав и законных интересов граждан или организаций либо охраняемых законом интересов общества или государства. Преступление относится к категории тяжких (ч. 4 ст. 2.2 Уголовного кодекса РО).",
    `Рублев Владислав обладает статусом неприкосновенности (${val(F.rublevBasis, "ч. ____")} ст. 1.1 ФЗ «О статусе неприкосновенности должностных лиц») и не может быть привлечён к уголовной ответственности до приостановления либо ограничения этого статуса (ст. 2.3 указанного закона). Статус снимается ордером Генеральной прокуратуры РО (ст. 3.1, 3.5 указанного закона).`,
    "Расследование в отношении неприкосновенного лица вправе проводить только Генеральный прокурор, его заместители, Советник Правительства при Генеральном прокуроре РО, а также прокуроры и сотрудники Следственного комитета РО при наличии ордера о разрешении проведения следствия (ст. 3.3 указанного закона). Поэтому УСБ-М передаёт собранные материалы в Генеральную прокуратуру РО (п. «а» ст. 9, ст. 18 ФЗ «О Федеральной службе безопасности»).",
    "Основаниями для начала расследования и возбуждения уголовного дела являются материалы, переданные государственным органом, и сведения, полученные в ходе оперативно-розыскных мероприятий (пункт 4 раздела 1.1, пункты 4 и 5 раздела 11.1 Процессуального кодекса).",
    "УСБ-М вину не устанавливает. Настоящее обращение содержит сведения о признаках преступления; вопрос о виновности решается в установленном законом порядке (раздел 6.4 Процессуального кодекса).",
  ]),

  H("IV. ТРЕБОВАНИЯ"),
  P("На основании изложенного прошу Генеральную прокуратуру РО:", { keepNext: true }),
  ...LI([
    "Выдать ордер о приостановлении (лишении) статуса неприкосновенности в отношении генерал-полковника Рублева Владислава, служебное удостоверение № 1320 (ст. 3.1, 3.5 ФЗ «О статусе неприкосновенности должностных лиц»).",
    "Провести расследование по признакам преступления, предусмотренного ч. 1 ст. 15.6 Уголовного кодекса РО, либо выдать ордер о разрешении проведения следствия (ст. 3.3 указанного закона), и принять процессуальное решение.",
    "Рассмотреть вопрос об отстранении Рублева Владислава от исполнения должностных обязанностей на период расследования (ст. 2.4 указанного закона).",
    "При ознакомлении с материалами не раскрывать сведения о конфиденциальных источниках и методах оперативно-розыскной деятельности (пункты 2 и 3 раздела 11.4 Процессуального кодекса).",
    "Уведомить УСБ-М о принятом решении. УСБ-М готово обеспечить оперативное сопровождение расследования по поручению Генеральной прокуратуры РО.",
  ]),
  P(`Дата подачи: ${F.date}`, { noIndent: true, before: 160, after: 120 }),

  signBlock(["Оперуполномоченный УСБ-М", "майор ФСБ"], "С.К. Гумиров"),
  P("СОГЛАСОВАНО:", { noIndent: true, before: 120, after: 0 }),
  P("Руководитель ССКБ УСБ-М", { noIndent: true, after: 0 }),
  P(`_______________ / ${val(F.chiefName, "____________________")}`, { noIndent: true, before: 160, after: 0 }),
  new Paragraph({
    tabStops: [{ type: TabStopType.LEFT, position: 500 }, { type: TabStopType.LEFT, position: 2200 }],
    spacing: { after: 200 }, children: R("\tподпись\tИ.О. Фамилия", { size: 16, italics: true }),
  }),
  P("Копия настоящего обращения направлена в канцелярию УСБ-М в порядке приказа от 31.08.2026 № 12", { noIndent: true, size: 20, after: 0 }),
  P("«____» ______________ 20____ г. в ____ час. ____ мин.", { noIndent: true, size: 20 }),
];

const doc = new Document({
  creator: "УСБ-М",
  title: "Обращение в Генеральную прокуратуру РО — Рублев В.",
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, bottom: 700, left: 1700, right: 850, footer: 400 } } },
    footers: {
      default: new Footer({ children: [
        new Paragraph({ alignment: CE, spacing: { after: 0 }, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })] }),
        new Paragraph({ alignment: CE, children: [new TextRun({ text: "Документ не имеет юридической силы, создан для проекта «Россия Онлайн» и не порождает правовых последствий.", size: 14, italics: true, color: "7F7F7F" })] }),
      ] }),
    },
    children: body,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("saved", OUT); });
