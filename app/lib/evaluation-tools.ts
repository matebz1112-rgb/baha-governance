export type EvaluationTool = {
  slug: string;
  title: string;
  audience: string;
  year: number;
  fileUrl: string;
  sourceFile: string;
};

export const evaluationTools: EvaluationTool[] = [
  {
    slug: "small-associations-2025",
    title: "تقييم الجمعيات الصغيرة 2025",
    audience: "الجمعيات الصغيرة",
    year: 2025,
    fileUrl: "/evaluation-tools/small-associations-2025.md",
    sourceFile: "تقييم_الجمعيات_الصغيرة_2025.md"
  },
  {
    slug: "medium-associations-2025",
    title: "تقييم الجمعيات المتوسطة 2025",
    audience: "الجمعيات المتوسطة",
    year: 2025,
    fileUrl: "/evaluation-tools/medium-associations-2025.md",
    sourceFile: "تقييم_الجمعيات_المتوسطة_2025.md"
  }
];

export type ParsedEvaluationQuestion = {
  id: string;
  standard: string;
  number: string;
  question: string;
  maxScore: number;
  evidence: string;
};

function cleanCell(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function isSeparatorRow(line: string) {
  return /^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim());
}

function parseMarkdownRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cleanCell);
}

function toNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized || normalized.includes("#")) return 0;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function loadEvaluationToolQuestions(tool: EvaluationTool): Promise<ParsedEvaluationQuestion[]> {
  const response = await fetch(tool.fileUrl);
  const markdown = await response.text();
  const lines = markdown.split(/\r?\n/);
  const questions: ParsedEvaluationQuestion[] = [];
  let currentStandard = "عام";

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      currentStandard = cleanCell(heading[1]);
      continue;
    }

    if (!line.trim().startsWith("|") || isSeparatorRow(line)) continue;

    const cells = parseMarkdownRow(line);
    const questionIndex = cells.findIndex((cell) => cell.startsWith("هل ") || cell.includes(" هل "));
    if (questionIndex === -1) continue;

    const question = cells[questionIndex];
    const scoreCell = cells
      .slice(questionIndex + 1)
      .find((cell) => /^\d+([.,]\d+)?$/.test(cell.trim()));
    const maxScore = toNumber(scoreCell ?? "0");
    if (!maxScore) continue;

    const number = cells
      .slice(0, questionIndex)
      .reverse()
      .find((cell) => /^\d+$/.test(cell.trim())) ?? String(questions.length + 1);
    const evidence = cells
      .slice(questionIndex + 1)
      .find((cell) => cell.length > 10 && !/^\d+([.,]\d+)?$/.test(cell.trim())) ?? "";

    questions.push({
      id: `${tool.slug}-${questions.length + 1}`,
      standard: currentStandard,
      number,
      question,
      maxScore,
      evidence
    });
  }

  return questions;
}
