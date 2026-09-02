# React for a Flutter developer

This project uses familiar architectural ideas with different syntax. Start at `src/main.jsx`, then read `App.jsx`, one page, its components, and finally the service it calls.

## The mental-model map

| Flutter | React in this project |
|---|---|
| `runApp(const App())` | `createRoot(...).render(<App />)` |
| `Widget` | Function component |
| Constructor parameters | Props |
| `State<T>` fields | `useState` values |
| `setState(() {})` | A state setter such as `setName(...)` |
| `initState` plus cleanup in `dispose` | `useEffect` plus its returned cleanup function |
| `Provider` / inherited state | React Context (`AuthContext`) |
| `Navigator` / `go_router` | React Router |
| `FutureBuilder` states | Explicit loading, data, and error state |
| Repository/service class | Exported functions in `services/` |
| `pubspec.yaml` | `package.json` |
| `flutter pub get` | `npm install` |
| `flutter run` | `npm run dev` |

## 1. Components are functions

A React component is a JavaScript function that returns JSX:

```jsx
function ProgressBar({ current, total }) {
  return <p>{current} of {total}</p>
}
```

`{ current, total }` destructures the props object. In Flutter, these values would normally be final constructor fields on a widget.

React calls the function again when its props, state, or consumed context changes. Do not mutate values during rendering.

## 2. State triggers rendering

```jsx
const [name, setName] = useState('')
```

- `name` is the current value.
- `setName` schedules the next value and a render.
- Calling `setName` is comparable to changing a field inside Flutter's `setState`.

Treat arrays and objects as immutable:

```jsx
setAnswers((current) => [...current, newAnswer])
```

The callback receives the latest state. The spread syntax creates a new array instead of changing the existing one.

## 3. Effects connect React to outside systems

`useEffect` runs work that is caused by rendering but happens outside React, such as restoring a Supabase session or loading attempts:

```jsx
useEffect(() => {
  loadAttempts()
}, [loadAttempts])
```

The dependency array tells React when the effect must rerun. A returned function performs cleanup, similar to `dispose`:

```jsx
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.cancel()
}, [])
```

Development `StrictMode` intentionally runs additional checks, including an extra effect setup/cleanup cycle. Effects should therefore be safe to retry.

## 4. Conditional UI uses JavaScript

React does not have a separate template language. Conditions and collection transformations are ordinary JavaScript:

```jsx
{loading ? <LoadingScreen /> : <DashboardPage />}

{attempts.map((attempt) => (
  <AttemptRow key={attempt.id} attempt={attempt} />
))}
```

Stable `key` values help React match list items across renders. This is conceptually related to Flutter keys.

## 5. Events receive functions

```jsx
<button onClick={handleStart}>Start quiz</button>
```

Pass the function itself. `onClick={handleStart()}` would call it immediately during rendering.

Forms call `event.preventDefault()` because browsers normally navigate when a form is submitted.

## 6. Context shares the session

`AuthProvider` owns the profile and provides it to every descendant. Components call `useAuth()` instead of passing the profile through every route. This is close to reading a Provider from Flutter's `BuildContext`.

Quiz data is not global context because only the quiz page needs it. Keeping state close to its consumer makes the flow easier to follow.

## 7. Routing builds screens from the URL

`App.jsx` declares routes. `:attemptId` is a URL parameter, comparable to a path parameter in `go_router`. `ProtectedRoute` redirects to the name page until the session/profile is ready.

Vercel serves one `index.html`, so `vercel.json` rewrites deep links back to that file and lets React Router choose the screen.

## 8. Supabase is behind a service boundary

Pages call functions such as `getQuestions()` and `submitAnswer()` rather than importing Supabase directly. This is the same reason a Flutter app often uses a repository: UI code describes UI, while service code handles persistence.

The browser uses only a publishable key. Supabase maps the anonymous Auth session to `auth.uid()`, and Row Level Security restricts profile, attempt, and answer rows to that ID.

Correct answers stay in the private `questions` table. The client fetches safe fields through `get_quiz_questions()` and receives correctness/explanation only after `submit_quiz_answer()` saves the answer.

## 9. JavaScript versus TypeScript

The current component accepts any prop shape at runtime:

```jsx
function ProgressBar({ current, total }) {}
```

The later TypeScript version can describe that contract:

```tsx
type ProgressBarProps = {
  current: number
  total: number
}

function ProgressBar({ current, total }: ProgressBarProps) {}
```

Browsers still receive JavaScript. TypeScript adds checks before Vite builds the application.

## 10. Incremental TypeScript migration

You do not need to recreate the project:

1. Install `typescript` and ensure the React type packages are present.
2. Add `tsconfig.json` with `allowJs: true` so `.js`, `.jsx`, `.ts`, and `.tsx` can coexist.
3. Rename one leaf component, such as `ProgressBar.jsx`, to `ProgressBar.tsx`.
4. Type its props and fix reported errors.
5. Move upward through components, pages, services, context, and finally `main.jsx`.
6. Replace implicit database objects with generated Supabase database types.
7. Turn on stricter compiler options only after the first conversion builds.

Migrate small files first. A full rewrite would hide which TypeScript change produced each new error.
