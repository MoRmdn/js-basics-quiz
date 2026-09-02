import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateActiveAttempt } from '../services/quizService.js'

export function useQuizWebMcp() {
  const navigate = useNavigate()

  useEffect(() => {
    const modelContext = document.modelContext
    if (!modelContext?.registerTool) return undefined

    const lifecycle = new AbortController()

    Promise.resolve(
      modelContext.registerTool(
        {
          name: 'start_js_quiz',
          title: 'Start or resume JavaScript quiz',
          description: 'Start a new JS Quest attempt, or resume the current unfinished attempt, and open it in the visible app.',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute() {
            const attempt = await getOrCreateActiveAttempt()
            navigate(`/quiz/${attempt.id}`)
            return { attemptId: attempt.id, status: attempt.status }
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {
      // WebMCP is progressive enhancement; the visible UI remains fully usable.
    })

    return () => lifecycle.abort()
  }, [navigate])
}
