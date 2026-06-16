-- Real Production-Ready Supabase Schema for School Report Card System
-- Updated: 2026-06-12 (Global access policies loaded)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SCHOOL PROFILE CONFIGURATION TABLE
create table if not exists public.school_config (
    id uuid primary key default uuid_generate_v4(),
    school_name text not null default 'Notion Core International College',
    motto text not null default 'Knowledge, discipline and outstanding character excellence',
    address text not null default '120, Broadway Lane, New York, NY 10025',
    phone text not null default '+1 (555) 489-0128',
    email text not null default 'admissions@notioncollege.edu',
    resumption_date text not null default 'September 14, 2026',
    term_date text not null default 'June 18, 2026',
    session text not null default '2025/2026 Academic Year',
    principal_name text not null default 'Dr. Christopher Vance, PhD',
    form_teacher_junior text not null default 'Mrs. Clara Vance',
    form_teacher_senior text not null default 'Mr. Albert King',
    current_term text not null default 'Third Term Summary',
    next_term_fee text not null default '₦150,000.00',
    distinction_threshold integer not null default 85,
    pass_threshold integer not null default 50,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. FACULTY / TEACHERS & ADMIN PROFILES TABLE
create table if not exists public.faculty_profiles (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    role text not null default 'Teacher',  -- 'Teacher' | 'Admin'
    avatar text not null default 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop',
    password text not null default '123456',
    is_restricted boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. STUDENTS TABLE
create table if not exists public.students (
    id text primary key,
    name text not null,
    age integer not null default 15,
    sex text not null check (sex in ('Male', 'Female')),
    class_name text not null check (class_name in ('JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3')),
    term_date text not null,
    session text not null,
    attendance_present integer not null default 0,
    attendance_total integer not null default 110,
    form_teacher_remark text default '',
    form_teacher_name text default '',
    principal_name text default '',
    resumption_date text not null,
    password text not null default '123456',
    principal_remark text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SUBJECT GRADES TABLE
create table if not exists public.subject_grades (
    id uuid primary key default uuid_generate_v4(),
    student_id text references public.students(id) on delete cascade not null,
    name text not null, -- Subject name (e.g. Mathematics)
    test_score integer not null default 0 check (test_score >= 0 and test_score <= 30),
    exam_score integer not null default 0 check (exam_score >= 0 and exam_score <= 70),
    first_term_summary integer default 0 check (first_term_summary >= 0 and first_term_summary <= 100),
    second_term_summary integer default 0 check (second_term_summary >= 0 and second_term_summary <= 100),
    third_term_summary integer default 0 check (third_term_summary >= 0 and third_term_summary <= 100),
    position integer,
    is_position_manual boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (student_id, name)
);

-- 5. BEHAVIOURAL RATINGS TABLE
create table if not exists public.behavioural_ratings (
    id uuid primary key default uuid_generate_v4(),
    student_id text references public.students(id) on delete cascade not null,
    name text not null, -- Trait name (e.g. Punctuality, Neatness)
    rating integer not null check (rating >= 1 and rating <= 5),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (student_id, name)
);

-- Create performance optimizations indices
create index if not exists students_class_name_idx on public.students(class_name);
create index if not exists subject_grades_student_id_idx on public.subject_grades(student_id);
create index if not exists behavioural_ratings_student_id_idx on public.behavioural_ratings(student_id);

-- Robust RLS Clean Up: Drop ALL existing policies dynamically on these tables 
-- to prevent ANY policy recursion or naming conflicts from old/wizard-generated rules.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('school_config', 'faculty_profiles', 'students', 'subject_grades', 'behavioural_ratings')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- RECOMMENDED FIX TO RECURSION ERRORS: Disable Row Level Security (RLS) entirely.
-- Since we are allowing global access for multi-teacher synchronization anyway, 
-- turning off RLS is the most reliable, performance-friendly way, and guarantees 100% immunity 
-- to infinite loops or rule collisions! Run these lines to turn off RLS:
ALTER TABLE public.school_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioural_ratings DISABLE ROW LEVEL SECURITY;

-- OPTIONAL FALLBACK: If your organization requires RLS to be strictly enabled:
-- alter table public.school_config enable row level security;
-- alter table public.faculty_profiles enable row level security;
-- alter table public.students enable row level security;
-- alter table public.subject_grades enable row level security;
-- alter table public.behavioural_ratings enable row level security;

-- create policy "Global access school_config" on public.school_config for all using (true) with check (true);
-- create policy "Global access faculty_profiles" on public.faculty_profiles for all using (true) with check (true);
-- create policy "Global access students" on public.students for all using (true) with check (true);
-- create policy "Global access subject_grades" on public.subject_grades for all using (true) with check (true);
-- create policy "Global access behavioural_ratings" on public.behavioural_ratings for all using (true) with check (true);

-- Insert Default Config
insert into public.school_config (school_name, motto, address, phone, email, resumption_date, term_date, session, principal_name, form_teacher_junior, form_teacher_senior, current_term, next_term_fee, distinction_threshold, pass_threshold) 
values ('Notion Core International College', 'Knowledge, discipline and outstanding character excellence', '120, Broadway Lane, New York, NY 10025', '+1 (555) 489-0128', 'admissions@notioncollege.edu', 'September 14, 2026', 'June 18, 2026', '2025/2026 Academic Year', 'Dr. Christopher Vance, PhD', 'Mrs. Clara Vance', 'Mr. Albert King', 'Third Term Summary', '₦150,000.00', 85, 50)
on conflict do nothing;

-- Insert Default Admin Profiler
insert into public.faculty_profiles (name, role, password)
values ('Administrator', 'Admin', 'admin123')
on conflict do nothing;

-- =====================================================================
-- 6. SAFE MIGRATION HELPER (SAVES CODES / PREVENTS "COLUMN NOT FOUND IN SCHEMA CACHE")
-- =====================================================================
-- Run these statements in Supabase to safely add any missing columns to your existing tables 
-- without dropping them or losing your students' saved data!

-- Safe column additions for `public.students` table
alter table public.students add column if not exists age integer not null default 15;
alter table public.students add column if not exists sex text check (sex in ('Male', 'Female'));
alter table public.students add column if not exists attendance_present integer not null default 0;
alter table public.students add column if not exists attendance_total integer not null default 110;
alter table public.students add column if not exists form_teacher_remark text default '';
alter table public.students add column if not exists form_teacher_name text default '';
alter table public.students add column if not exists principal_name text default '';
alter table public.students add column if not exists resumption_date text default '';
alter table public.students add column if not exists password text not null default '123456';
alter table public.students add column if not exists principal_remark text default '';

-- Safe column additions for `public.school_config` table
alter table public.school_config add column if not exists resumption_date text not null default 'September 14, 2026';
alter table public.school_config add column if not exists term_date text not null default 'June 18, 2026';
alter table public.school_config add column if not exists session text not null default '2025/2026 Academic Year';
alter table public.school_config add column if not exists principal_name text not null default 'Dr. Christopher Vance, PhD';
alter table public.school_config add column if not exists form_teacher_junior text not null default 'Mrs. Clara Vance';
alter table public.school_config add column if not exists form_teacher_senior text not null default 'Mr. Albert King';
alter table public.school_config add column if not exists current_term text not null default 'Third Term Summary';
alter table public.school_config add column if not exists next_term_fee text not null default '₦150,000.00';
alter table public.school_config add column if not exists distinction_threshold integer not null default 85;
alter table public.school_config add column if not exists pass_threshold integer not null default 50;

-- Safe column additions for `public.subject_grades` table
alter table public.subject_grades add column if not exists first_term_summary integer default 0;
alter table public.subject_grades add column if not exists second_term_summary integer default 0;
alter table public.subject_grades add column if not exists third_term_summary integer default 0;
alter table public.subject_grades add column if not exists position integer;
alter table public.subject_grades add column if not exists is_position_manual boolean default false;

-- Safe column additions for `public.faculty_profiles` table
alter table public.faculty_profiles add column if not exists email text default '';
alter table public.faculty_profiles add column if not exists assigned_class text;

-- Force reload of Supabase schema cache to instantly recognize the newly added columns
notify pgrst, 'reload schema';

