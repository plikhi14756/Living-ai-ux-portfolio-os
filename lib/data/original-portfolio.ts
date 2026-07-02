import type { Study } from "@/lib/types";

const BASE_DATE = "2026-07-01T12:00:00.000Z";

function study(
  input: Omit<
    Study,
    | "analysis_status"
    | "created_at"
    | "public_publish_recommendation"
    | "updated_at"
    | "published_at"
  >
): Study {
  return {
    ...input,
    public_publish_recommendation:
      input.portfolio_score >= 80
        ? "Publish as portfolio highlight"
        : "Publish as portfolio entry",
    analysis_status: "Fallback/manual extraction only",
    created_at: BASE_DATE,
    updated_at: BASE_DATE,
    published_at: BASE_DATE
  };
}

export const ORIGINAL_PORTFOLIO_PDF_URL =
  "/documents/pranav-likhi-ai-ux-portfolio.pdf";

export const ORIGINAL_PORTFOLIO_STUDIES: Study[] = [
  study({
    id: "original-living-ai-ux-portfolio-os",
    platform: "Personal AI workflow project",
    study_title: "Living AI UX Portfolio OS",
    visible_topic: "AI workflow automation for portfolio publishing",
    estimated_duration: "ongoing",
    reward: "portfolio project",
    study_type: "AI workflow and portfolio system",
    approval_status: "completed and approved",
    what_i_did:
      "Designed and built a private AI workflow app plus public portfolio website for turning screenshots, notes, and approved research evidence into public-safe portfolio entries.",
    confidentiality_risk: "low",
    portfolio_classification: "Major portfolio project",
    recommended_section: "AI Workflow Projects",
    portfolio_score: 92,
    safe_public_title: "Living AI UX Portfolio OS",
    safe_public_description:
      "Built a living AI UX portfolio system that analyzes research-study evidence, classifies portfolio value, protects confidential details, supports human approval, publishes approved entries, and regenerates a branded living PDF.",
    case_study_summary:
      "A human-in-the-loop AI workflow project combining protected source intake, OpenAI-assisted analysis, portfolio scoring, confidentiality safeguards, public website publishing, PDF export, Supabase storage, and Vercel-ready deployment.",
    skills_demonstrated: [
      "AI workflow design",
      "Human-in-the-loop approval",
      "Portfolio automation",
      "Confidentiality guardrails",
      "Next.js App Router",
      "TypeScript",
      "Supabase",
      "OpenAI vision analysis",
      "PDF generation",
      "Vercel deployment"
    ],
    linkedin_featured_title: "Living AI UX Portfolio OS",
    linkedin_featured_description:
      "A private AI workflow app and public portfolio website that turns approved AI/UX research evidence into safe portfolio entries and a branded living PDF.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-human-ai-conversation-psychology",
    platform: "University research study",
    study_title: "Human-AI Conversation Psychology Study",
    visible_topic: "Human-AI conversation psychology",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "Voice-based research study",
    approval_status: "completed",
    what_i_did:
      "Participated in a university-led voice-based study comparing conversations with human and AI partners.",
    confidentiality_risk: "low",
    portfolio_classification: "Major portfolio project",
    recommended_section: "Major AI UX Projects",
    portfolio_score: 94,
    safe_public_title: "Human-AI Conversation Psychology Study",
    safe_public_description:
      "Participated in a university-led voice-based study comparing conversations with human and AI partners, reflecting on comfort, social pressure, expectations, and perceived interaction quality.",
    case_study_summary:
      "An academic HCI research participation example focused on social and psychological dynamics around AI systems, including comfort, judgment, social risk, and perceived interaction quality.",
    skills_demonstrated: [
      "Human-AI interaction research",
      "Conversation psychology",
      "Voice-based feedback",
      "Emotional response reflection",
      "HCI research participation"
    ],
    linkedin_featured_title: "Human-AI Conversation Psychology Study",
    linkedin_featured_description:
      "A university-led HCI study exploring comfort, expectations, and perceived quality in human and AI voice conversations.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-ai-decision-making-focus-group",
    platform: "Moderated research panel",
    study_title: "AI Decision-Making Focus Group",
    visible_topic: "Everyday AI use and decision-making",
    estimated_duration: "75 minutes",
    reward: "unknown",
    study_type: "Live moderated focus group",
    approval_status: "completed and approved",
    what_i_did:
      "Participated in a live moderated online focus group on everyday AI use, decision support, trust, and responsible AI adoption.",
    confidentiality_risk: "low",
    portfolio_classification: "Major portfolio project",
    recommended_section: "Major AI UX Projects",
    portfolio_score: 96,
    safe_public_title: "AI Decision-Making Focus Group",
    safe_public_description:
      "Joined a 75-minute moderated online focus group discussing how people use AI for work, learning, productivity, and decision-making, with emphasis on trust and human judgment.",
    case_study_summary:
      "A strong qualitative AI research example involving live group discussion, open-ended responses, responsible AI use, trust, and decision-support perspectives.",
    skills_demonstrated: [
      "Moderated focus groups",
      "Qualitative research participation",
      "Human-AI interaction",
      "AI decision-making analysis",
      "Active listening"
    ],
    linkedin_featured_title: "AI Decision-Making Focus Group",
    linkedin_featured_description:
      "A live qualitative AI research experience focused on responsible AI use, trust, and decision support.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-conversational-ai-assistant-improvement",
    platform: "AI-moderated research study",
    study_title: "Conversational AI Assistant Improvement Interview",
    visible_topic: "Conversational AI assistant improvement",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "AI-moderated interview",
    approval_status: "completed and approved",
    what_i_did:
      "Completed an AI-moderated interview focused on improving a conversational AI assistant experience.",
    confidentiality_risk: "medium",
    portfolio_classification: "Major portfolio project",
    recommended_section: "Voice & Conversational AI",
    portfolio_score: 91,
    safe_public_title: "Conversational AI Assistant Improvement Interview",
    safe_public_description:
      "Provided structured feedback on what would make a conversational AI assistant feel more useful, understandable, trustworthy, and aligned with real user needs.",
    case_study_summary:
      "A conversational AI product research entry centered on feature expectations, trust, response quality, and user confidence.",
    skills_demonstrated: [
      "Conversational AI evaluation",
      "AI assistant product feedback",
      "Human-AI interaction",
      "Feature-suggestion reasoning",
      "User expectation analysis"
    ],
    linkedin_featured_title: "Conversational AI Assistant Improvement Interview",
    linkedin_featured_description:
      "An AI-moderated conversational assistant study focused on trust, usefulness, and feature improvement feedback.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-voice-ai-speech-quality",
    platform: "AI evaluation platforms",
    study_title: "Voice AI, Speech Quality & AI Performance Evaluation Studies",
    visible_topic: "Voice AI and speech quality evaluation",
    estimated_duration: "varied",
    reward: "unknown",
    study_type: "Voice-rating and AI model-output evaluation",
    approval_status: "completed",
    what_i_did:
      "Completed voice-rating research involving short audio samples and structured assessment of AI voice performance.",
    confidentiality_risk: "medium",
    portfolio_classification: "Major portfolio project",
    recommended_section: "Voice & Conversational AI",
    portfolio_score: 90,
    safe_public_title: "Voice AI, Speech Quality & AI Performance Evaluation",
    safe_public_description:
      "Evaluated voice clarity, listening fatigue, human-likeness, timing, emphasis, expressive delivery, role fit, and perceived comfort in AI voice outputs.",
    case_study_summary:
      "A voice UX and AI audio evaluation category connected to speech perception, digital assistants, model-output comparison, and user comfort.",
    skills_demonstrated: [
      "Voice UX evaluation",
      "Speech-quality assessment",
      "AI voice performance evaluation",
      "Model-output comparison",
      "Auditory judgment"
    ],
    linkedin_featured_title: "Voice AI & Speech Quality Evaluation",
    linkedin_featured_description:
      "Voice AI evaluation work focused on clarity, timing, naturalness, listening fatigue, and user comfort.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-ai-assisted-product-ideation",
    platform: "Group UX research study",
    study_title: "AI-Assisted Collaborative Product Ideation Study",
    visible_topic: "Human-AI collaboration and product ideation",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "Live group ideation session",
    approval_status: "completed and approved",
    what_i_did:
      "Participated in a live group ideation study using a provided GenAI tool to brainstorm and refine a web application concept.",
    confidentiality_risk: "medium",
    portfolio_classification: "Major portfolio project",
    recommended_section: "AI Workflow Projects",
    portfolio_score: 89,
    safe_public_title: "AI-Assisted Collaborative Product Ideation Study",
    safe_public_description:
      "Collaborated with other participants using a GenAI tool to develop product ideas, discuss problem fit, refine feature concepts, and communicate user value.",
    case_study_summary:
      "A human-AI collaboration study demonstrating group UX research, product thinking, feature brainstorming, and spoken product communication.",
    skills_demonstrated: [
      "AI-assisted ideation",
      "Human-AI collaboration",
      "Group UX research",
      "Feature brainstorming",
      "Product thinking"
    ],
    linkedin_featured_title: "AI-Assisted Product Ideation Study",
    linkedin_featured_description:
      "A live group research session using GenAI to support product ideation, feature thinking, and collaborative UX discussion.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-ai-slide-deck-workflow",
    platform: "Paid user research study",
    study_title: "AI-Assisted Slide Deck Generation & Presentation Workflow Study",
    visible_topic: "AI productivity and presentation workflow",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "AI productivity UX study",
    approval_status: "completed",
    what_i_did:
      "Completed a paid research study about using AI tools to create work-related presentation slide decks.",
    confidentiality_risk: "low",
    portfolio_classification: "Major portfolio project",
    recommended_section: "AI Workflow Projects",
    portfolio_score: 86,
    safe_public_title: "AI-Assisted Slide Deck & Presentation Workflow Study",
    safe_public_description:
      "Evaluated AI-assisted slide deck creation from a user perspective, including structure, clarity, design polish, editing effort, customization, trust, and confidence in final outputs.",
    case_study_summary:
      "A concrete AI productivity UX entry tied to GenAI work tools, workplace content quality, presentation workflows, and human review burden.",
    skills_demonstrated: [
      "AI productivity tool evaluation",
      "Presentation workflow analysis",
      "GenAI output assessment",
      "Workplace UX feedback",
      "Content quality judgment"
    ],
    linkedin_featured_title: "AI Presentation Workflow UX Study",
    linkedin_featured_description:
      "A GenAI productivity study evaluating AI-assisted slide creation, editing needs, content quality, and user confidence.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-ai-led-product-reaction",
    platform: "AI-led interview studies",
    study_title: "AI-Led Product Reaction & Conversation Interviews",
    visible_topic: "AI-led product reaction interviews",
    estimated_duration: "varied",
    reward: "unknown",
    study_type: "AI-led interview",
    approval_status: "completed",
    what_i_did:
      "Participated in AI-led interviews about product reactions, trust, interest level, and calls-to-action.",
    confidentiality_risk: "medium",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "AI Evaluation Experience",
    portfolio_score: 78,
    safe_public_title: "AI-Led Product Reaction & Conversation Interviews",
    safe_public_description:
      "Responded to AI-led product interview prompts, explaining first impressions, concerns, trust requirements, missing context, and what information would improve confidence.",
    case_study_summary: "",
    skills_demonstrated: [
      "AI product evaluation",
      "Human-AI interaction",
      "Conversation feedback",
      "Trust evaluation",
      "Product judgment"
    ],
    linkedin_featured_title: "AI-Led Product Reaction Interviews",
    linkedin_featured_description:
      "AI-led interview experience focused on product reactions, trust, missing context, and user confidence.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-rubric-candidate-evaluation",
    platform: "University research study",
    study_title: "Rubric-Based Candidate Interview Evaluation Study",
    visible_topic: "Structured evaluation and rubric-based judgment",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "Structured evaluation study",
    approval_status: "completed",
    what_i_did:
      "Evaluated recorded candidate interview responses using structured behavioral rating rubrics and written justification.",
    confidentiality_risk: "low",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "AI Evaluation Experience",
    portfolio_score: 76,
    safe_public_title: "Rubric-Based Candidate Interview Evaluation Study",
    safe_public_description:
      "Listened to recorded interview answers, compared responses against defined criteria, assigned scores, and provided evidence-based written comments.",
    case_study_summary: "",
    skills_demonstrated: [
      "Rubric-based scoring",
      "Structured listening",
      "Evidence-based judgment",
      "Candidate-response evaluation",
      "Written justification"
    ],
    linkedin_featured_title: "Rubric-Based Evaluation Study",
    linkedin_featured_description:
      "A structured evaluation study involving behavioral rating rubrics, evidence-based scoring, and written justification.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-fintech-investment-usability",
    platform: "Recorded usability testing platform",
    study_title: "Fintech Investment Website Comparative Usability Test",
    visible_topic: "Investment product website UX",
    estimated_duration: "long-form recorded study",
    reward: "unknown",
    study_type: "Recorded comparative usability test",
    approval_status: "completed",
    what_i_did:
      "Completed a recorded usability test comparing investment product website experiences from multiple financial institutions.",
    confidentiality_risk: "medium",
    portfolio_classification: "Major portfolio project",
    recommended_section: "Fintech & Banking UX",
    portfolio_score: 88,
    safe_public_title: "Fintech Investment Website Comparative Usability Test",
    safe_public_description:
      "Compared financial product website design, navigation, information clarity, trust signals, product presentation, and user confidence across investment experiences.",
    case_study_summary:
      "A financial services UX entry centered on comparative website analysis, think-aloud feedback, trust, clarity, and investment product comprehension.",
    skills_demonstrated: [
      "Fintech UX evaluation",
      "Comparative website analysis",
      "Trust and clarity assessment",
      "Think-aloud testing",
      "Financial product feedback"
    ],
    linkedin_featured_title: "Fintech Investment Website UX Test",
    linkedin_featured_description:
      "A recorded comparative usability study evaluating investment product websites, trust signals, navigation, and clarity.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-website-app-usability",
    platform: "Userlytics, UserTesting, Prolific partners",
    study_title: "Website & App Usability Testing",
    visible_topic: "Website and mobile app usability",
    estimated_duration: "varied",
    reward: "unknown",
    study_type: "Usability testing",
    approval_status: "completed",
    what_i_did:
      "Completed app and website usability tests involving navigation, user expectations, trust, product clarity, calls-to-action, and task completion.",
    confidentiality_risk: "low",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "Usability Testing & Product Feedback",
    portfolio_score: 74,
    safe_public_title: "Website & App Usability Testing",
    safe_public_description:
      "Used think-aloud feedback to explain what felt clear, confusing, trustworthy, or difficult while moving through digital interfaces and product feedback flows.",
    case_study_summary: "",
    skills_demonstrated: [
      "Usability testing",
      "Think-aloud feedback",
      "Navigation evaluation",
      "Customer experience",
      "Task completion review"
    ],
    linkedin_featured_title: "Website & App Usability Testing",
    linkedin_featured_description:
      "Usability testing experience across apps and websites, focused on navigation, trust, clarity, and task completion.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-multilingual-language-assessment",
    platform: "Language assessment and AI evaluation platforms",
    study_title: "Hindi, Punjabi & Multilingual Language Assessment",
    visible_topic: "Bilingual and multilingual language evaluation",
    estimated_duration: "varied",
    reward: "unknown",
    study_type: "Language assessment",
    approval_status: "completed and approved",
    what_i_did:
      "Completed official Hindi and Punjabi language assessments plus language-quality and multilingual clarity tasks.",
    confidentiality_risk: "low",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "Multilingual Product Evaluation",
    portfolio_score: 82,
    safe_public_title: "Hindi, Punjabi & Multilingual Language Assessment",
    safe_public_description:
      "Completed bilingual and multilingual evaluation work involving fluency, comprehension, naturalness, cultural context, and multilingual AI readiness.",
    case_study_summary: "",
    skills_demonstrated: [
      "Hindi-English evaluation",
      "Punjabi language assessment",
      "Multilingual product feedback",
      "Cultural context",
      "Language quality review"
    ],
    linkedin_featured_title: "Hindi, Punjabi & Multilingual Evaluation",
    linkedin_featured_description:
      "Approved multilingual language assessment work supporting AI language evaluation and localization UX positioning.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-tourism-roi-workflow",
    platform: "AI-moderated interview study",
    study_title: "Tourism Creator Partnership & ROI Workflow Interview",
    visible_topic: "Tourism business workflow and ROI evaluation",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "AI-moderated interview",
    approval_status: "completed and approved",
    what_i_did:
      "Completed an AI-moderated interview about tourism businesses, creator partnership workflows, and ROI measurement.",
    confidentiality_risk: "low",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "Usability Testing & Product Feedback",
    portfolio_score: 70,
    safe_public_title: "Tourism Creator Partnership & ROI Workflow Interview",
    safe_public_description:
      "Used travel services, marketing, and customer experience context to evaluate workflow clarity, business goals, campaign value, and decision-making confidence.",
    case_study_summary: "",
    skills_demonstrated: [
      "AI-moderated interview feedback",
      "Tourism business context",
      "Marketing workflow evaluation",
      "ROI reasoning",
      "Structured spoken feedback"
    ],
    linkedin_featured_title: "Tourism Workflow AI Interview",
    linkedin_featured_description:
      "An AI-moderated study focused on tourism creator partnerships, ROI reasoning, and business workflow clarity.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-mobile-game-playtesting",
    platform: "PlaytestCloud",
    study_title: "Mobile Game Playtesting - Multi-Day Recorded Study",
    visible_topic: "Mobile game UX and playtesting",
    estimated_duration: "multi-day",
    reward: "unknown",
    study_type: "Recorded game playtest",
    approval_status: "completed",
    what_i_did:
      "Completed multi-day iPhone game playtest sessions requiring recorded gameplay, spoken feedback, and post-session surveys.",
    confidentiality_risk: "medium",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "Research Participation Log",
    portfolio_score: 66,
    safe_public_title: "Mobile Game Playtesting - Multi-Day Recorded Study",
    safe_public_description:
      "Evaluated onboarding, motivation, gameplay flow, task clarity, story mode, multiplayer timing, and overall player experience across multi-day sessions.",
    case_study_summary: "",
    skills_demonstrated: [
      "Game playtesting",
      "Mobile UX",
      "Survey feedback",
      "Motivation and engagement analysis",
      "Recorded think-aloud feedback"
    ],
    linkedin_featured_title: "Mobile Game Playtesting Study",
    linkedin_featured_description:
      "A multi-day mobile game UX playtest involving recorded gameplay, spoken feedback, and player experience evaluation.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-strategic-decision-simulation",
    platform: "University-style research study",
    study_title: "Strategic Decision-Making & Coalition Simulation Study",
    visible_topic: "Scenario-based decision-making",
    estimated_duration: "unknown",
    reward: "unknown",
    study_type: "Scenario-based behavioral research",
    approval_status: "completed",
    what_i_did:
      "Completed a scenario study involving role-play as a government minister making alliance and coalition decisions.",
    confidentiality_risk: "low",
    portfolio_classification: "Record only",
    recommended_section: "Research Participation Log",
    portfolio_score: 58,
    safe_public_title: "Strategic Decision-Making & Coalition Simulation Study",
    safe_public_description:
      "Worked through decision scenarios, ranked preferences, and practiced structured reasoning around trade-offs, priorities, and decision confidence.",
    case_study_summary: "",
    skills_demonstrated: [
      "Behavioral decision-making research",
      "Scenario-based judgment",
      "Strategic reasoning",
      "Preference ranking",
      "Decision-support evaluation"
    ],
    linkedin_featured_title: "Strategic Decision-Making Simulation",
    linkedin_featured_description:
      "A scenario-based behavioral research study involving structured decision-making, trade-offs, and preference ranking.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  }),
  study({
    id: "original-research-followups-product-feedback",
    platform: "Research and product feedback platforms",
    study_title: "Research Follow-Ups, Product Feedback & Workplace Studies",
    visible_topic: "Product feedback and workplace research",
    estimated_duration: "short and medium-length",
    reward: "unknown",
    study_type: "Research participation",
    approval_status: "completed",
    what_i_did:
      "Completed short and medium-length paid research tasks involving product opinions, workplace questions, follow-up responses, and website information review.",
    confidentiality_risk: "low",
    portfolio_classification: "Record only",
    recommended_section: "Research Participation Log",
    portfolio_score: 55,
    safe_public_title: "Research Follow-Ups, Product Feedback & Workplace Studies",
    safe_public_description:
      "Provided written explanations, product opinions, decision reasoning, workplace feedback, and follow-up responses across short and medium-length research tasks.",
    case_study_summary: "",
    skills_demonstrated: [
      "Research participation",
      "Product feedback",
      "Written explanation",
      "Decision reasoning",
      "Workplace study feedback"
    ],
    linkedin_featured_title: "Product Feedback & Research Follow-Ups",
    linkedin_featured_description:
      "Short and medium-length research participation entries involving product opinions, workplace feedback, and written reasoning.",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: []
  })
];
