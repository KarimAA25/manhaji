-- Manhaj schema · 004_seed_manhaj_ip.sql
-- ============================================================================
-- WHAT THIS FILE DOES (plain English)
-- ----------------------------------------------------------------------------
-- Takes the Manhaj IP that currently lives as markdown files
-- (templates/rubric_framework.md, templates/communication_templates.md) and
-- inserts it into the database as actual rows. This way:
--   - Every fresh school setup gets the IP automatically — no manual copy/paste
--   - The IP is versioned with the schema (we know what shipped with v1.0,
--     v1.1, etc.)
--   - Schools can later tune *descriptors* (per the IP rules) and we can see
--     the diff against the Manhaj default
--
-- This migration is RE-RUNNABLE on a fresh school. For an existing school
-- it's a no-op (ON CONFLICT DO NOTHING). For an existing school where you
-- want to refresh the IP to a new version, use a separate migration that
-- bumps the version + re-inserts.
--
-- Triggered by: a tenant onboarding script that calls this against the new
-- school's row. For the demo / pilot, we'll seed it for International School
-- of Oman manually.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- Helper: seed Manhaj IP for a given school
-- (Run as service-role since RLS is on; service role bypasses RLS)
-- ---------------------------------------------------------------------------
create or replace function seed_manhaj_ip(p_school_id uuid) returns void as $$
declare
    v_rubric_id uuid;
begin
    -- ---- RUBRIC FRAMEWORK ---------------------------------------------------
    insert into rubrics (school_id, name, version, is_manhaj_default, description)
    values (
        p_school_id,
        'Manhaj Universal Rubric',
        '1.0',
        true,
        'The 6 universal axes Manhaj uses across every subject. Same scale (1.0-5.0), same axes, every subject — so a parent comparing Math and Art is comparing apples to apples. Descriptors can be tuned per school; axes are locked.'
    )
    on conflict (school_id, name, version) do nothing
    returning id into v_rubric_id;

    -- If conflict (rubric already exists), look it up
    if v_rubric_id is null then
        select id into v_rubric_id from rubrics
            where school_id = p_school_id
              and name = 'Manhaj Universal Rubric'
              and version = '1.0';
    end if;

    -- Insert the 6 axes
    insert into rubric_criteria (rubric_id, axis_code, axis_name_en, axis_name_ar, description_en, description_ar, scale_min, scale_max, display_order) values
        (v_rubric_id, 'analytical',    'Analytical reasoning',  'التفكير التحليلي',     'Decomposing problems, identifying patterns, drawing valid inferences. Strong: solves multi-step problems unprompted, spots edge cases. Weak: skips steps, can''t explain why.',                                              'تفكيك المسائل، تحديد الأنماط، استخلاص استنتاجات صحيحة.', 1.0, 5.0, 1),
        (v_rubric_id, 'creative',      'Creative expression',   'التعبير الإبداعي',    'Generating novel ideas, framing problems in new ways. Strong: proposes a different approach than taught. Weak: reproduces examples verbatim.',                                                                  'توليد أفكار جديدة، صياغة المسائل بطرق مبتكرة.',           1.0, 5.0, 2),
        (v_rubric_id, 'oral',          'Oral communication',    'التواصل الشفهي',      'Speaking with structure, listening actively, defending a position. Strong: leads discussion, rephrases peers. Weak: single-word answers, avoids speaking.',                                                       'التحدث ببنية واضحة، الإصغاء الفعال، الدفاع عن موقف.',      1.0, 5.0, 3),
        (v_rubric_id, 'written',       'Written expression',    'التعبير الكتابي',     'Structure, clarity, grammar, register. Strong: sustained argument across paragraphs, controlled register. Weak: run-ons, mechanical errors blocking meaning.',                                                  'البنية، الوضوح، القواعد، المستوى الملائم.',                 1.0, 5.0, 4),
        (v_rubric_id, 'participation', 'Class participation',    'المشاركة الصفية',     'Engagement: questions asked, peer interaction, focus. Strong: asks clarifying questions, helps peers. Weak: passive, off-task.',                                                                              'المشاركة: طرح الأسئلة، التفاعل مع الزملاء، التركيز.',      1.0, 5.0, 5),
        (v_rubric_id, 'homework',      'Homework consistency',  'الانتظام في الواجبات', 'On-time submission, completeness, evidence of effort. Strong: all on time + complete + revises after feedback. Weak: late or missing, no engagement with feedback.',                                          'التسليم في الوقت، الاكتمال، دليل على الجهد المبذول.',      1.0, 5.0, 6)
    on conflict (rubric_id, axis_code) do nothing;

    -- ---- COMMUNICATION TEMPLATES (the 17-template catalog) -----------------
    -- Each is_manhaj_default = true. Schools can later override the name/tone/
    -- guardrails, but the template_code key stays so analytics roll up.
    insert into comm_templates (
        school_id, template_code, name_en, name_ar, channel, tone, length_cap_words,
        is_manhaj_default, required_slots, guardrails, ai_prompt_en, display_order
    ) values
        (p_school_id, 'absent_today',                 'Absent today',              'غائب اليوم',                    'whatsapp', 'warm',         80, true,
            array['student_name','date','expected_return','teacher_first_name'],
            array['no_severity_assumption','no_unauthorised_absence_implication','no_emojis_default'],
            'You are a teacher writing a brief, warm WhatsApp note to a parent about their child being absent. Use one clear ask and one clear assumption. Sign off with the teacher''s first name.',
            1),
        (p_school_id, 'absent_unauthorised',          'Absent (no note)',          'غياب بلا إذن',                  'both',     'formal',     120, true,
            array['student_name','days_count','teacher_first_name'],
            array['no_accusation','escalation_after_third_attempt'],
            'You are writing a formal but kind follow-up to a parent because their child has been absent without notice. Be matter-of-fact; describe what happened and what we need.',
            2),
        (p_school_id, 'late_arrival_pattern',         'Repeated late arrival',     'تأخر متكرر',                    'whatsapp', 'warm',         80, true,
            array['student_name','late_count','period','teacher_first_name'],
            array['no_lateness_judgment','focus_on_solution'],
            'Friendly WhatsApp message about a pattern of lateness. Curious, not judgemental.',
            3),
        (p_school_id, 'assignment_overdue',           'Assignment overdue',        'واجب متأخر',                    'whatsapp', 'warm',         80, true,
            array['student_name','subject','assignment_title','due_date','teacher_first_name'],
            array['no_grade_threat','offer_help'],
            'Brief WhatsApp note about a missed assignment. Mention the assignment by name, when it was due, and one option to catch up.',
            4),
        (p_school_id, 'assessment_score_concern',     'Score concern',             'تراجع في الدرجة',               'email',    'formal',     180, true,
            array['student_name','subject','score','term_avg','teacher_name'],
            array['no_diagnostic_language','no_peer_comparison_by_name','always_propose_next_step'],
            'Composed email to a parent about a notable score drop. State the score and the term average, then propose one concrete next step.',
            5),
        (p_school_id, 'behaviour_concern_minor',      'Behaviour note (minor)',    'ملاحظة سلوكية بسيطة',           'whatsapp', 'warm',         90, true,
            array['student_name','brief_description','teacher_name'],
            array['describe_action_not_personality','no_anxiety_lazy_gifted','no_emojis_default'],
            'WhatsApp note describing one observable behaviour. Avoid personality labels; describe what happened.',
            6),
        (p_school_id, 'behaviour_concern_escalate',   'Behaviour escalation',      'تصعيد سلوكي',                  'both',     'formal',     180, true,
            array['student_name','summary','head_of_section'],
            array['stick_to_observed_behaviour','request_meeting_not_remedy','flag_for_head_of_section'],
            'Formal email requesting a parent meeting due to a pattern of behaviour concerns. Include the head of section as co-signer.',
            7),
        (p_school_id, 'well_done_milestone',          'Well done · milestone',     'إنجاز مميز',                   'whatsapp', 'celebratory', 80, true,
            array['student_name','axis','subject','teacher_first_name'],
            array['be_specific','no_generic_praise'],
            'Celebratory WhatsApp note about a specific rubric milestone. Name the axis and the subject. One concrete bit of evidence.',
            8),
        (p_school_id, 'well_done_streak',             'Well done · streak',        'استمرارية مميزة',              'whatsapp', 'celebratory', 70, true,
            array['student_name','stat','teacher_first_name'],
            array['be_specific','no_generic_praise'],
            'Short celebratory WhatsApp about a positive streak (attendance or homework).',
            9),
        (p_school_id, 'parent_meeting_request',       'Meeting request',           'طلب اجتماع',                   'both',     'formal',     150, true,
            array['student_name','reason','suggested_slots','teacher_name'],
            array['three_slots_minimum','one_clear_reason'],
            'Professional meeting request. State one clear reason and offer at least three time slots.',
            10),
        (p_school_id, 'parent_meeting_reminder',      'Meeting reminder',          'تذكير بالاجتماع',              'whatsapp', 'warm',         50, true,
            array['meeting_time','location'],
            array['short','one_practical_detail'],
            'Brief 24h reminder of the upcoming meeting. Time + location.',
            11),
        (p_school_id, 'report_card_released',         'Report card released',      'صدور بطاقة التقرير',           'both',     'formal',     120, true,
            array['student_name','term','link'],
            array['always_include_link','mention_reply_for_questions'],
            'Notification that the term report card is available. Include the secure link.',
            12),
        (p_school_id, 'monthly_report_released',      'Monthly report released',   'صدور التقرير الشهري',          'whatsapp', 'warm',         70, true,
            array['student_name','link'],
            array['short','always_include_link'],
            'Brief WhatsApp note that the monthly report is up. One link.',
            13),
        (p_school_id, 'course_selection_invite',      'Course selection invite',   'دعوة لاختيار المواد',          'both',     'formal',     140, true,
            array['student_name','grade','deadline','link'],
            array['clear_deadline','always_include_link','bilingual_link'],
            'Invitation to complete the course-selection form for the upcoming AY. Clearly state the deadline.',
            14),
        (p_school_id, 'course_selection_reminder',    'Course selection reminder', 'تذكير لاختيار المواد',         'whatsapp', 'warm',         70, true,
            array['student_name','deadline'],
            array['short','one_call_to_action'],
            'Brief WhatsApp reminder; deadline 7 days out.',
            15),
        (p_school_id, 'fee_reminder_soft',            'Fee reminder (soft)',       'تذكير لطيف بالرسوم',            'email',    'formal',     160, true,
            array['parent_name','amount','due_date'],
            array['polite','no_threat','offer_contact_for_questions'],
            'Polite fee reminder; offer a contact for questions.',
            16),
        (p_school_id, 'event_invitation',             'Event invitation',          'دعوة لفعالية',                  'whatsapp', 'warm',        100, true,
            array['event','date','location','rsvp_link'],
            array['include_rsvp_link','date_in_local_format'],
            'Friendly event invitation with date, location, and RSVP link.',
            17)
    on conflict (school_id, template_code) do nothing;

    raise notice 'Seeded Manhaj IP for school %', p_school_id;
end;
$$ language plpgsql;

comment on function seed_manhaj_ip(uuid) is
    'Inserts the Manhaj IP rows (rubric framework + 17 comm templates) for a given school. Re-runnable. Should be called by the tenant-onboarding script after creating the schools row.';

-- ---------------------------------------------------------------------------
-- For the pilot: auto-seed International School of Oman
-- (Commented out by default. Uncomment ONLY when the school row exists.)
-- ---------------------------------------------------------------------------
-- INSERT INTO schools (name, country_code, timezone) VALUES
--   ('International School of Oman', 'OM', 'Asia/Muscat')
-- ON CONFLICT DO NOTHING RETURNING id;
--
-- SELECT seed_manhaj_ip(id) FROM schools WHERE name = 'International School of Oman';
