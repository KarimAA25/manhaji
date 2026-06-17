/**
 * Deterministic homework question generator (demo — no LLM calls).
 *
 * Generates subject-specific question templates with topic-token substitution.
 * Output is deterministic for the same (section_id, subject, topic, difficulty, count, extraPrompt)
 * inputs, making the demo repeatable.
 *
 * Difficulty rules:
 *   easy   → MCQ-heavy   (60% MCQ, 40% short)
 *   medium → mixed       (20% MCQ, 60% short, 20% essay)
 *   hard   → essay-heavy (20% short, 80% essay)
 */

export type QuestionType = "mcq" | "short" | "essay";

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
};

export type GenerateInput = {
  section_id:   string;
  subject:      string;
  topic:        string;
  difficulty:   "easy" | "medium" | "hard";
  count:        number;
  extraPrompt?: string;
};

// ---- Template banks per subject ----------------------------------------

const TEMPLATES: Record<string, { mcq: string[]; short: string[]; essay: string[] }> = {
  History: {
    mcq: [
      "Which of the following was the primary cause of {topic}?",
      "In the context of {topic}, which figure played the most decisive role?",
      "Which year did {topic} reach its turning point?",
      "Which document or agreement most directly resulted from {topic}?",
    ],
    short: [
      "Explain the main causes of {topic} in 3–4 sentences.",
      "Compare and contrast {topic} with one event from the same era.",
      "Describe two consequences of {topic} for ordinary people at the time.",
      "Why is {topic} considered a turning point in history?",
      "Identify two groups that were affected differently by {topic} and explain why.",
    ],
    essay: [
      "Imagine you are a witness to {topic}. Write a 200-word diary entry describing what you see, hear, and feel.",
      "To what extent was {topic} the inevitable result of long-term social and political pressures? Argue using evidence.",
      "Evaluate the significance of {topic} for future generations. Use at least two specific examples.",
      "How did {topic} change the balance of power in the region? Write a structured essay with introduction, body, and conclusion.",
    ],
  },

  Geography: {
    mcq: [
      "Which geographical feature most influenced {topic}?",
      "Which country was most directly affected by {topic}?",
      "What term best describes the process seen in {topic}?",
    ],
    short: [
      "Describe two ways {topic} has affected population distribution.",
      "Explain how climate patterns relate to {topic}.",
      "Identify the human and physical factors that contributed to {topic}.",
      "Using a labelled diagram, explain the process of {topic}.",
    ],
    essay: [
      "Evaluate the environmental impact of {topic}. Use case-study evidence.",
      "To what extent is {topic} a global or local problem? Justify your answer.",
      "How do economic inequalities shape our response to {topic}?",
    ],
  },

  Maths: {
    mcq: [
      "Which of the following correctly simplifies an expression derived from {topic}?",
      "A problem involving {topic} gives a result of 48. Which method applies?",
      "In {topic}, what is the first step when solving for x?",
    ],
    short: [
      "Solve the following problem related to {topic}. Show all working.",
      "Explain the relationship between {topic} and real-world measurement.",
      "Prove the formula used in {topic} using two different methods.",
      "Find the area of a shape defined by the constraints of {topic}.",
    ],
    essay: [
      "Explain how the concept of {topic} connects to at least two other areas of mathematics.",
      "Design a real-world word problem based on {topic}, then solve it fully.",
      "Reflect on a common misconception students have about {topic} and explain how you would correct it.",
    ],
  },

  English: {
    mcq: [
      "Which literary device is most prominent in the passage about {topic}?",
      "In the text about {topic}, the author's tone is best described as:",
      "Which word is closest in meaning to the key term in the {topic} passage?",
    ],
    short: [
      "Write a paragraph analysing the use of imagery in the section about {topic}.",
      "Identify three examples of foreshadowing in the passage about {topic}.",
      "How does the author's choice of narrator affect the reader's understanding of {topic}?",
      "Summarise the main argument in the {topic} text in your own words.",
    ],
    essay: [
      "Explore how the writer uses language to create tension in the section about {topic}.",
      "Compare the presentation of {topic} in two texts. Use quotations and technical vocabulary.",
      "Write a 300-word creative response from the perspective of a character experiencing {topic}.",
      "Analyse the structural choices the author makes in presenting {topic}.",
    ],
  },

  Science: {
    mcq: [
      "Which variable is the independent variable in an experiment about {topic}?",
      "What is the correct unit for measuring the key quantity in {topic}?",
      "Which safety precaution is most important when working with {topic}?",
    ],
    short: [
      "Describe the method you would use to investigate {topic} in a lab setting.",
      "Explain the scientific principle behind {topic} using a diagram.",
      "What would happen if you changed one variable in the {topic} experiment?",
      "Identify potential sources of error in an experiment about {topic}.",
    ],
    essay: [
      "Design a full investigation plan to test a hypothesis related to {topic}. Include hypothesis, method, results table, and analysis.",
      "Evaluate the real-world applications of our understanding of {topic}.",
      "Explain how {topic} challenges or confirms the theory of [a relevant scientific principle].",
    ],
  },

  Arabic: {
    mcq: [
      "ما المرادف الأنسب لكلمة ذات الصلة بـ {topic}؟",
      "أيّ الجمل التالية تعبّر عن مفهوم {topic} بشكل صحيح؟",
    ],
    short: [
      "اكتب فقرة قصيرة تشرح فيها مفهوم {topic} بأسلوبك الخاص.",
      "استخرج من نص {topic} ثلاث كلمات من حقل دلالي واحد.",
      "ما رأيك في أهمية {topic}؟ عبّر عن رأيك في ثلاثة أسطر.",
    ],
    essay: [
      "اكتب مقالة من ثلاثة فقرات عن تأثير {topic} على حياتنا اليومية.",
      "ناقش أهمية {topic} في سياق ثقافي واجتماعي.",
    ],
  },

  MUN: {
    mcq: [
      "Which UN body has primary jurisdiction over issues like {topic}?",
      "In MUN procedure, what follows a 'motion to open the speaker's list' about {topic}?",
    ],
    short: [
      "Write a 3-sentence opening statement representing your country's position on {topic}.",
      "List two resolutions the UN has previously passed on {topic}.",
      "What does your country's foreign policy suggest about {topic}?",
    ],
    essay: [
      "Draft a 250-word position paper on {topic}, following standard MUN format.",
      "Argue for a specific course of UN action regarding {topic}. Use resolution language.",
    ],
  },
};

const GENERIC = {
  mcq: [
    "Which of the following best describes {topic}?",
    "What is the most important concept in {topic}?",
    "Which term applies to the main idea of {topic}?",
  ],
  short: [
    "Explain {topic} in 3–4 sentences using your own words.",
    "Give two examples that illustrate the concept of {topic}.",
    "Compare {topic} to another concept you have studied this term.",
    "Why is {topic} important in this subject area?",
  ],
  essay: [
    "Write a structured 300-word essay analysing {topic}.",
    "Evaluate the significance of {topic} using specific examples from your studies.",
    "Reflect on how {topic} connects to wider themes in this course.",
  ],
};

// ---- Difficulty → type distribution ------------------------------------

function buildTypeSequence(count: number, difficulty: GenerateInput["difficulty"]): QuestionType[] {
  // Deterministic: fill positions in a repeating pattern
  const patterns: Record<GenerateInput["difficulty"], QuestionType[]> = {
    easy:   ["mcq",   "mcq",   "mcq",   "short", "short"],
    medium: ["mcq",   "short", "short", "short", "essay"],
    hard:   ["short", "essay", "essay", "essay", "essay"],
  };
  const pattern = patterns[difficulty];
  const result: QuestionType[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pattern[i % pattern.length]);
  }
  return result;
}

// ---- Simple hash for deterministic index selection --------------------

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---- Public API -------------------------------------------------------

export function generateHomework(input: GenerateInput): { questions: Question[] } {
  const { section_id, subject, topic, difficulty, count, extraPrompt = "" } = input;
  const safeTopic = topic.trim() || "today's lesson";

  // Pick template bank — normalise subject to first word for loose matching
  const subjectKey = Object.keys(TEMPLATES).find(k =>
    subject.toLowerCase().startsWith(k.toLowerCase())
  );
  const bank = subjectKey ? TEMPLATES[subjectKey] : GENERIC;

  const typeSeq = buildTypeSequence(count, difficulty);
  const seed    = strHash(`${section_id}|${subject}|${safeTopic}|${difficulty}|${count}|${extraPrompt}`);

  const questions: Question[] = typeSeq.map((type, idx) => {
    const pool    = bank[type];
    const pickIdx = (seed + idx * 7) % pool.length;
    const template = pool[pickIdx];
    const text = template.replace(/\{topic\}/g, safeTopic);
    return {
      id:   `q${idx + 1}`,
      text,
      type,
    };
  });

  return { questions };
}
