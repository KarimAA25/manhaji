# Manhaj Communication Templates — proprietary IP

Pre-built parent-comm message templates. AI-drafted from the situation context, teacher-edited in one tap on the Manhaj teacher PWA, sent via WhatsApp or email. Schools do not write these — we ship the catalog. Schools can tune the salutation/sign-off style ("Best regards, the ISO team" vs "Warm regards, Modern Hills Academy") and that's it.

## Template catalog (V1)

| Template | Trigger | Channel | Required slots |
|---|---|---|---|
| `absent_today` | Student marked absent in AM register, no parent note received | WhatsApp | student_name, date, expected_return |
| `absent_unauthorised` | Absent + no parent note 24h after `absent_today` | WhatsApp + email | student_name, days_count |
| `late_arrival_pattern` | 3 lates in 2 weeks | WhatsApp | student_name, late_count, period |
| `assignment_overdue` | Assignment past due, not submitted | WhatsApp | student_name, subject, assignment_title, due_date |
| `assessment_score_concern` | Score drop > 15% vs term average | Email | student_name, subject, score, term_avg, teacher_name |
| `behaviour_concern_minor` | 1st behaviour flag in a week | WhatsApp | student_name, brief_description, teacher_name |
| `behaviour_concern_escalate` | 3+ behaviour flags in a week | Email + meeting request | student_name, summary, head_of_section |
| `well_done_milestone` | Reached a rubric axis 4.5+ for first time | WhatsApp | student_name, axis, subject |
| `well_done_streak` | 4 weeks of full attendance + 90%+ homework | WhatsApp | student_name, stat |
| `parent_meeting_request` | Teacher-initiated meeting | WhatsApp + email | student_name, reason, suggested_slots |
| `parent_meeting_reminder` | 24h before scheduled meeting | WhatsApp | meeting_time, location |
| `report_card_released` | Term report card published | WhatsApp + email | student_name, term, link |
| `monthly_report_released` | Monthly report published | WhatsApp | student_name, link |
| `course_selection_invite` | Course selection window opens | WhatsApp + email | student_name, grade, deadline, link |
| `course_selection_reminder` | 7 days before deadline, not submitted | WhatsApp | student_name, deadline |
| `fee_reminder_soft` | Fee due in 14 days, not paid | Email | parent_name, amount, due_date |
| `event_invitation` | School event open to parents | WhatsApp | event, date, location, rsvp_link |

## Template anatomy

Every template has:
1. **AI prompt** — the system prompt that generates the message, given the slot values + school context
2. **Tone profile** — formal / warm / urgent / celebratory
3. **Length cap** — WhatsApp templates max 90 words, email max 180 words
4. **Slot defaults** — when a slot is empty, what to do (skip the sentence, use placeholder, etc.)
5. **Localisation pair** — EN + AR versions; identical meaning enforced by Manhaj's glossary
6. **Guardrails** — what the AI is forbidden from adding (e.g. no diagnostic language in `behaviour_concern_*`)

## Example: `absent_today` (WhatsApp, EN + AR)

### Slot inputs
```
student_name: "Layla"
date: "Tuesday 8 May"
expected_return: "Wednesday 9 May"
school_signoff: "International School of Oman"
teacher_first_name: "Ms Sandra"
```

### EN output (Manhaj-drafted, teacher previews and taps Send)
```
Hi — Ms Sandra here from ISO. Just letting you know Layla was marked absent
from registration this morning (Tuesday 8 May). If she's home unwell, please
WhatsApp back so we can update her record. Otherwise we'll expect her back
Wednesday 9 May. Hope she's okay.
```

### AR output (parallel, from same canonical source)
```
مرحباً، أنا الست ساندرا من مدرسة عُمان الدولية. أحيطكم علماً بأن ليلى مسجلة
غائبة هذا الصباح (الثلاثاء 8 مايو). إذا كانت في البيت بسبب المرض، يرجى
الرد على هذه الرسالة لتحديث سجلها. وإلا فنتوقع عودتها يوم الأربعاء 9 مايو.
نتمنى لها السلامة.
```

### Tone profile
- Warm, not anxious
- Use first name for child, formal title for teacher
- One clear ask, one clear assumption
- Sign-off is the teacher's name, not "the school"

### Length cap
- WhatsApp: ≤ 80 words (this draft = 53 words ✓)

### Slot defaults
- `expected_return` empty → omit final sentence
- `teacher_first_name` empty → use "the office"

### Guardrails
- Never assume severity ("hope she's not too sick")
- Never imply unauthorised absence on first message
- No emojis (school policy default; overridable per tenant)

## Workflow on the teacher PWA

1. Trigger fires (cron or event-based)
2. Manhaj generates EN + AR drafts in the teacher's "Drafts" inbox
3. Teacher taps in, sees a side-by-side preview (the message + a one-line "why I'm sending this")
4. One-tap actions: **Send** · **Edit** · **Discard** · **Snooze 24h**
5. If teacher edits, the diff is logged so Manhaj can learn the teacher's voice over time
6. After 3 drafts of the same template approved without edits, Manhaj prompts: "Auto-send next time?" — opt-in, never automatic

## Why this catalog will close the school's mind

- **Day-1 working comms** without the school writing a single line of copy
- **One voice across teachers** — the school sounds coherent even as individual teachers send dozens of messages a week
- **Audit trail** — every message has a Manhaj traceability code, every edit is logged, every send has a named human approver. Schools can answer "who sent that to my parent?" instantly.
- **Bilingual without translation roulette** — parents get faithful AR; teachers don't translate manually; meaning doesn't drift between EN and AR
- **Time saved** — average school sends ~30 individual parent messages per teacher per week. At 90 seconds saved per message (drafting → editing), that's 45 min/week/teacher = 30+ hours/week across a typical staff. That's the headline number for the school.
