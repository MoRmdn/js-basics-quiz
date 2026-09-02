-- JS Quest database, security policies, and server-side quiz functions.
-- Run this file first in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id bigint primary key generated always as identity,
  position smallint not null unique check (position between 1 and 100),
  category text not null,
  prompt text not null,
  code_snippet text,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  correct_option smallint not null check (correct_option between 0 and 3),
  explanation text not null
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  total_questions smallint not null default 100 check (total_questions > 0),
  score smallint check (score between 0 and total_questions),
  passed boolean,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status = 'in_progress' and score is null and passed is null and completed_at is null)
    or
    (status = 'completed' and score is not null and passed is not null and completed_at is not null)
  )
);

create unique index if not exists one_active_attempt_per_user
  on public.attempts(user_id)
  where status = 'in_progress';

create table if not exists public.attempt_answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id bigint not null references public.questions(id) on delete restrict,
  selected_option smallint not null check (selected_option between 0 and 3),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

revoke all on public.profiles, public.questions, public.attempts, public.attempt_answers from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.attempts, public.attempt_answers to authenticated;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can read their attempts" on public.attempts;
create policy "Users can read their attempts"
  on public.attempts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their answers" on public.attempt_answers;
create policy "Users can read their answers"
  on public.attempt_answers for select to authenticated
  using (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );

-- Returns only safe question fields. correct_option and explanation stay server-side
-- until the learner has submitted an answer.
create or replace function public.get_quiz_questions()
returns table (
  id bigint,
  "position" smallint,
  category text,
  prompt text,
  code_snippet text,
  options jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
    select q.id, q.position, q.category, q.prompt, q.code_snippet, q.options
    from public.questions q
    order by q.position;
end;
$$;

create or replace function public.get_or_create_active_attempt()
returns table (
  id uuid,
  status text,
  score smallint,
  passed boolean,
  total_questions smallint,
  started_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_attempt public.attempts%rowtype;
  question_total smallint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select a.* into found_attempt
  from public.attempts a
  where a.user_id = auth.uid() and a.status = 'in_progress'
  order by a.started_at desc
  limit 1;

  if found then
    return query select found_attempt.id, found_attempt.status, found_attempt.score,
      found_attempt.passed, found_attempt.total_questions, found_attempt.started_at,
      found_attempt.completed_at;
    return;
  end if;

  select count(*)::smallint into question_total from public.questions;
  if question_total <> 100 then
    raise exception 'The quiz requires exactly 100 questions; found %', question_total;
  end if;

  insert into public.attempts (user_id, total_questions)
  values (auth.uid(), question_total)
  returning * into found_attempt;

  return query select found_attempt.id, found_attempt.status, found_attempt.score,
    found_attempt.passed, found_attempt.total_questions, found_attempt.started_at,
    found_attempt.completed_at;
end;
$$;

create or replace function public.submit_quiz_answer(
  p_attempt_id uuid,
  p_question_id bigint,
  p_selected_option smallint
)
returns table (
  is_correct boolean,
  correct_option smallint,
  explanation text,
  answered_count bigint,
  total_questions bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  owned_attempt public.attempts%rowtype;
  quiz_question public.questions%rowtype;
  existing_answer public.attempt_answers%rowtype;
  answer_is_correct boolean;
  answer_count bigint;
  question_count bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select a.* into owned_attempt
  from public.attempts a
  where a.id = p_attempt_id and a.user_id = auth.uid();

  if not found then raise exception 'Quiz attempt not found'; end if;
  if owned_attempt.status <> 'in_progress' then raise exception 'Quiz attempt is already complete'; end if;

  select q.* into quiz_question from public.questions q where q.id = p_question_id;
  if not found then raise exception 'Question not found'; end if;
  if p_selected_option < 0 or p_selected_option >= jsonb_array_length(quiz_question.options) then
    raise exception 'Selected option is outside the valid range';
  end if;

  select aa.* into existing_answer
  from public.attempt_answers aa
  where aa.attempt_id = p_attempt_id and aa.question_id = p_question_id;

  if found then
    select count(*) into answer_count from public.attempt_answers aa where aa.attempt_id = p_attempt_id;
    select count(*) into question_count from public.questions;
    return query select existing_answer.is_correct, quiz_question.correct_option,
      quiz_question.explanation, answer_count, question_count;
    return;
  end if;

  select count(*) into answer_count
  from public.attempt_answers aa
  where aa.attempt_id = p_attempt_id;

  if quiz_question.position <> answer_count + 1 then
    raise exception 'Questions must be answered in their fixed learning order';
  end if;

  answer_is_correct := p_selected_option = quiz_question.correct_option;
  insert into public.attempt_answers (attempt_id, question_id, selected_option, is_correct)
  values (p_attempt_id, p_question_id, p_selected_option, answer_is_correct);

  answer_count := answer_count + 1;
  select count(*) into question_count from public.questions;
  return query select answer_is_correct, quiz_question.correct_option,
    quiz_question.explanation, answer_count, question_count;
end;
$$;

create or replace function public.complete_quiz_attempt(p_attempt_id uuid)
returns table (
  id uuid,
  score smallint,
  total_questions smallint,
  passed boolean,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  owned_attempt public.attempts%rowtype;
  answer_count bigint;
  correct_count smallint;
  question_count smallint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select a.* into owned_attempt
  from public.attempts a
  where a.id = p_attempt_id and a.user_id = auth.uid();

  if not found then raise exception 'Quiz attempt not found'; end if;
  if owned_attempt.status = 'completed' then
    return query select owned_attempt.id, owned_attempt.score, owned_attempt.total_questions,
      owned_attempt.passed, owned_attempt.completed_at;
    return;
  end if;

  select count(*) into question_count from public.questions;
  select count(*), count(*) filter (where aa.is_correct)::smallint
    into answer_count, correct_count
    from public.attempt_answers aa
    where aa.attempt_id = p_attempt_id;

  if answer_count <> question_count then
    raise exception 'Answer all % questions before completing the quiz', question_count;
  end if;

  update public.attempts a
  set status = 'completed',
      score = correct_count,
      total_questions = question_count,
      passed = (correct_count::numeric / question_count * 100) >= 70,
      completed_at = now()
  where a.id = p_attempt_id
  returning a.* into owned_attempt;

  return query select owned_attempt.id, owned_attempt.score, owned_attempt.total_questions,
    owned_attempt.passed, owned_attempt.completed_at;
end;
$$;

revoke all on function public.get_quiz_questions() from public;
revoke all on function public.get_or_create_active_attempt() from public;
revoke all on function public.submit_quiz_answer(uuid, bigint, smallint) from public;
revoke all on function public.complete_quiz_attempt(uuid) from public;

grant execute on function public.get_quiz_questions() to authenticated;
grant execute on function public.get_or_create_active_attempt() to authenticated;
grant execute on function public.submit_quiz_answer(uuid, bigint, smallint) to authenticated;
grant execute on function public.complete_quiz_attempt(uuid) to authenticated;
