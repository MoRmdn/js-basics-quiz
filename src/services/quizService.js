import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import {
  completeDemoAttempt,
  getDemoAnswers,
  getDemoAttempt,
  getDemoQuestions,
  getOrCreateDemoAttempt,
  listDemoAttempts,
  submitDemoAnswer,
} from './demoService.js'

function firstRow(data, fallbackMessage) {
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error(fallbackMessage)
  return row
}

export async function getQuestions() {
  if (!isSupabaseConfigured) return getDemoQuestions()

  const { data, error } = await supabase.rpc('get_quiz_questions')
  if (error) throw error
  return data
}

export async function listAttempts() {
  if (!isSupabaseConfigured) return listDemoAttempts()

  const { data, error } = await supabase
    .from('attempts')
    .select('id, status, score, passed, total_questions, started_at, completed_at')
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getAttempt(attemptId) {
  if (!isSupabaseConfigured) return getDemoAttempt(attemptId)

  const { data, error } = await supabase
    .from('attempts')
    .select('id, status, score, passed, total_questions, started_at, completed_at')
    .eq('id', attemptId)
    .single()

  if (error) throw error
  return data
}

export async function getAttemptAnswers(attemptId) {
  if (!isSupabaseConfigured) return getDemoAnswers(attemptId)

  const { data, error } = await supabase
    .from('attempt_answers')
    .select('question_id, selected_option, is_correct, answered_at')
    .eq('attempt_id', attemptId)
    .order('answered_at')

  if (error) throw error
  return data
}

export async function getOrCreateActiveAttempt() {
  if (!isSupabaseConfigured) return getOrCreateDemoAttempt()

  const { data, error } = await supabase.rpc('get_or_create_active_attempt')
  if (error) throw error
  return firstRow(data, 'Could not start a quiz attempt.')
}

export async function submitAnswer(attemptId, questionId, selectedOption) {
  if (!isSupabaseConfigured) {
    return submitDemoAnswer(attemptId, questionId, selectedOption)
  }

  const { data, error } = await supabase.rpc('submit_quiz_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
  })

  if (error) throw error
  return firstRow(data, 'The answer could not be saved.')
}

export async function completeAttempt(attemptId) {
  if (!isSupabaseConfigured) return completeDemoAttempt(attemptId)

  const { data, error } = await supabase.rpc('complete_quiz_attempt', {
    p_attempt_id: attemptId,
  })

  if (error) throw error
  return firstRow(data, 'The quiz could not be completed.')
}
