-- Supabase Starter Seed Data for Shivansh Dhakad's Portfolio
-- Fully aligned with confirmed resume data and verified project attributes.

-- 1. Profile
insert into public.profile (id, full_name, headline, intro, bio, email) values
  (1, 'Shivansh Dhakad', 'Student focusing on Machine Learning and AI development',
   'Computer Science (AI & ML) student with hands-on experience building machine learning, deep learning, computer vision, and retrieval-augmented generation applications.',
   'Undergraduate computer science engineer specializing in Artificial Intelligence & Machine Learning at LNCT Bhopal. I focus on developing full-stack ML solutions—from raw dataset engineering and neural network modeling to production API deployment. My work spans satellite SAR image processing, clinical risk prediction, multilingual translation, and autonomous AI agents.',
   'shivanshdhakad.dev@gmail.com')
on conflict (id) do update set
  full_name = excluded.full_name,
  headline = excluded.headline,
  intro = excluded.intro,
  bio = excluded.bio,
  email = excluded.email;

-- 2. Social Links
insert into public.social_links (label, url, sort_order, visible) values
  ('GitHub', 'https://github.com/shivansh-dhakad', 1, true),
  ('LinkedIn', 'https://linkedin.com/in/shivansh-dhakad-007679294', 2, true)
on conflict do nothing;

-- 3. Education (No Class XII percentage or phone number per strict requirements)
insert into public.education (institute, degree, start_year, end_year, sort_order, visible) values
  ('Lakshmi Narain College of Technology (LNCT), Bhopal',
   'B.Tech in Computer Science & Engineering (Artificial Intelligence and Machine Learning)',
   2024, 2028, 1, true)
on conflict do nothing;

-- 4. Skill Categories (6 Confirmed Domains)
insert into public.skill_categories (id, name, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Programming', 1),
  ('11111111-1111-1111-1111-111111111102', 'Data Analysis', 2),
  ('11111111-1111-1111-1111-111111111103', 'Machine Learning', 3),
  ('11111111-1111-1111-1111-111111111104', 'Deep Learning', 4),
  ('11111111-1111-1111-1111-111111111105', 'Generative AI', 5),
  ('11111111-1111-1111-1111-111111111106', 'Web Development and Backend', 6)
on conflict (id) do nothing;

-- 5. Skills (domains are assigned in skill_domains below; a skill may have several)
insert into public.skills (name, sort_order) values
  ('Python', 1), ('C++', 2), ('Java', 3), ('JavaScript', 4), ('TypeScript', 5), ('SQL', 6),
  ('Pandas', 7), ('NumPy', 8), ('Matplotlib', 9), ('Seaborn', 10),
  ('Scikit-Learn', 11), ('XGBoost', 12),
  ('PyTorch', 13), ('TensorFlow', 14), ('CNNs', 15), ('Computer Vision', 16), ('OpenCV', 17),
  ('Large Language Models', 18), ('RAG', 19), ('LangChain', 20), ('Hugging Face', 21),
  ('React', 22), ('FastAPI', 23), ('Flask', 24), ('Supabase', 25),
  ('HTML', 26), ('CSS', 27)
on conflict (name) do nothing;

insert into public.skill_domains (skill_id, category_id)
select s.id, c.id
from (values
  ('Python', 'Programming'), ('C++', 'Programming'), ('Java', 'Programming'),
  ('JavaScript', 'Programming'), ('TypeScript', 'Programming'), ('SQL', 'Programming'),
  ('HTML', 'Programming'), ('CSS', 'Programming'),
  ('Pandas', 'Data Analysis'), ('NumPy', 'Data Analysis'), ('Matplotlib', 'Data Analysis'), ('Seaborn', 'Data Analysis'),
  ('Scikit-Learn', 'Machine Learning'), ('XGBoost', 'Machine Learning'),
  ('PyTorch', 'Deep Learning'), ('TensorFlow', 'Deep Learning'), ('CNNs', 'Deep Learning'),
  ('Computer Vision', 'Deep Learning'), ('OpenCV', 'Deep Learning'),
  ('Large Language Models', 'Generative AI'), ('RAG', 'Generative AI'),
  ('LangChain', 'Generative AI'), ('Hugging Face', 'Generative AI'),
  ('React', 'Web Development and Backend'), ('FastAPI', 'Web Development and Backend'),
  ('Flask', 'Web Development and Backend'), ('Supabase', 'Web Development and Backend'),
  -- shared skills: also belong to Web Development and Backend
  ('HTML', 'Web Development and Backend'), ('CSS', 'Web Development and Backend'),
  ('JavaScript', 'Web Development and Backend'), ('TypeScript', 'Web Development and Backend')
) as m(skill, domain)
join public.skills s on s.name = m.skill
join public.skill_categories c on c.name = m.domain
on conflict do nothing;

-- 6. Nine Confirmed Projects (5 Featured First, Set to 'published' for visitor visibility)
insert into public.projects (id, slug, title, tagline, featured, sort_order, state, status, repo_url) values
  ('22222222-2222-2222-2222-222222222201', 'varunadrishti', 'VarunaDrishti',
   'Satellite SAR oil spill detection & automated maritime vessel identification system',
   true, 1, 'published', 'live', 'https://github.com/shivansh-dhakad/oil-spill-detection-and-vessel-identification'),

  ('22222222-2222-2222-2222-222222222202', 'lumina', 'LUMINA',
   'Multimodal AI platform uniting vision perception with conversational RAG intelligence',
   true, 2, 'published', 'live', null),

  ('22222222-2222-2222-2222-222222222203', 'krishimitra', 'KrishiMitra',
   'AI-driven precision agriculture advisor with real-time crop disease diagnosis',
   true, 3, 'published', 'live', null),

  ('22222222-2222-2222-2222-222222222204', 'cardioshield-ai', 'CardioShield AI',
   'Clinical biomarker cardiovascular risk assessment & early stratification model',
   true, 4, 'published', 'live', null),

  ('22222222-2222-2222-2222-222222222205', 'english-hindi-translator', 'English-Hindi translator',
   'Neural machine translation and linguistic transformation model for English-to-Hindi text',
   true, 5, 'published', 'completed', 'https://github.com/shivansh-dhakad/English---hindi-translator'),

  ('22222222-2222-2222-2222-222222222206', 'resqgrid', 'ResQGrid',
   'Disaster response coordination and emergency resource grid mapping platform',
   false, 6, 'published', 'completed', 'https://github.com/shivansh-dhakad/ResQGrid'),

  ('22222222-2222-2222-2222-222222222207', 'data-analysis-ml-website', 'Data analysis and ML website',
   'Interactive web platform for automated exploratory data analysis, visualization & ML training',
   false, 7, 'published', 'completed', 'https://github.com/shivansh-dhakad/Data-analysis-and-ML-website'),

  ('22222222-2222-2222-2222-222222222208', 'nibandhai', 'NibandhAI',
   'AI-assisted essay structuring, semantic coherence analysis & bilingual writing engine',
   false, 8, 'published', 'completed', 'https://github.com/shivansh-dhakad/NibandhAI'),

  ('22222222-2222-2222-2222-222222222209', 'mobile-price-prediction', 'Mobile price prediction',
   'Hardware specification-based mobile phone price bracket classification & regression pipeline',
   false, 9, 'published', 'completed', 'https://github.com/shivansh-dhakad/mobile-price-prediction')
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  state = excluded.state,
  status = excluded.status,
  repo_url = excluded.repo_url;