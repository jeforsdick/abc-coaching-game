import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, Download, Eye, MessageCircleQuestion, RefreshCw } from 'lucide-react'
import { jsPDF } from 'jspdf'

type AbcLabel = '' | 'Antecedent' | 'Behavior' | 'Consequence'
type Answer = string | string[]
type Answers = Record<string, Answer>
type Screen = 'welcome' | 'game' | 'results'
type Step = { eyebrow: string; title: string; prompt: string; type: 'single' | 'abc' | 'multi'; options?: string[]; correct?: string; feedback: string }

const abcEvents = [
  'The teacher gives the class an independent writing assignment.',
  'Eli says “I’m not doing this” and pushes the paper away.',
  'The teacher approaches, repeats the direction, and helps him get started.',
]
const abcLabels: Exclude<AbcLabel, ''>[] = ['Antecedent', 'Behavior', 'Consequence']

function MountainScene({ stage = 1, full = false }: { stage?: number; full?: boolean }) {
  return <svg className={`mountains ${full ? 'mountains-full' : ''}`} viewBox="0 0 720 190" preserveAspectRatio="none" aria-hidden="true">
    <path className="mountain-sky" d="M0 144 90 78l48 38 95-91 65 73 61-50 72 68 79-91 44 52 64-43 102 112v44H0Z" />
    <path className="mountain-mid" d="M0 161 105 91l53 52 88-77 88 89 107-103 65 67 55-42 159 92v21H0Z" />
    <path className="mountain-front" d="M0 174 97 132l57 28 98-67 91 67 75-45 76 54 76-46 150 54v13H0Z" />
    <path className="snow" d="m191 114 55-48 28 28-15-7-13 18-13-14-17 20-12-6Zm194-30 56-32 31 32-20-9-11 14-13-13-17 12-12-11Z" />
    {!full && <circle className="mountain-sun" cx={86 + stage * 106} cy={42} r="9" />}
  </svg>
}

const steps: Step[] = [
  { eyebrow: '01 · SEE IT', title: 'Start with what we can see and hear', prompt: 'Which statement gives us the most useful description of what we can actually observe?', type: 'single', options: ['“The student is defiant.”', '“The student refuses to work.”', '“When independent writing begins, the student says ‘I’m not doing this,’ pushes the paper away, and puts their head down.”', '“The student just wants attention.”'], correct: '“When independent writing begins, the student says ‘I’m not doing this,’ pushes the paper away, and puts their head down.”', feedback: 'Move from “the student is…” toward “the student does…” Observable words give us a shared starting point.' },
  { eyebrow: '02 · SORT IT', title: 'Organize the pattern with ABC', prompt: 'For each event, identify its place in the ABC sequence.', type: 'abc', feedback: 'ABC organizes what happened—not why. Seeing the sequence gives us useful questions to explore next.' },
  { eyebrow: '03 · THINK FUNCTIONALLY', title: 'Hold a working hypothesis lightly', prompt: 'Based on what we know so far, what might the behavior be helping the student get, avoid, or change?', type: 'single', options: ['Avoid or delay the writing task', 'Get adult attention', 'Access something preferred', 'We need more information before deciding'], correct: 'We need more information before deciding', feedback: 'Both task delay and adult support are plausible. Function is a working hypothesis—not a label—and we need patterns across more than one moment.' },
  { eyebrow: '04 · COACH IT', title: 'Ask before solving', prompt: 'What would be the most useful question to ask the teacher next?', type: 'single', options: ['“Have you tried a reward chart?”', '“When does this usually happen, and when is Eli more successful?”', '“Why do you think he is doing this?”', '“Have you called home?”'], correct: '“When does this usually happen, and when is Eli more successful?”', feedback: 'That question invites partnership and comparison. It gathers information before recommending a strategy.' },
  { eyebrow: '05 · STAY CURIOUS', title: 'Build a fuller picture', prompt: 'If you could ask three questions first, which would you prioritize?', type: 'multi', options: ['When does the behavior happen?', 'When does it not happen?', 'What usually happens immediately before?', 'What usually happens after?', 'What does success look like?', 'What has already been tried?'], feedback: 'There is no single right set of three. Useful coaching questions help us understand context, comparison, patterns, and previous supports before recommending a strategy.' },
]

const loadAnswers = (): Answers => { try { return JSON.parse(sessionStorage.getItem('behavior-coach-answers') || '{}') } catch { return {} } }
const initialDraft = (type: Step['type']): Answer => type === 'abc' ? ['', '', ''] as AbcLabel[] : type === 'multi' ? [] : ''

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(loadAnswers)
  const [draft, setDraft] = useState<Answer>('')
  const [revealed, setRevealed] = useState(false)
  useEffect(() => sessionStorage.setItem('behavior-coach-answers', JSON.stringify(answers)), [answers])
  useEffect(() => {
    history.replaceState({ screen: 'welcome', index: 0 }, '')
    const onPop = (event: PopStateEvent) => {
      const state = event.state as { screen?: Screen; index?: number } | null
      const nextScreen = state?.screen ?? 'welcome'; const nextIndex = state?.index ?? 0
      setScreen(nextScreen); setIndex(nextIndex); setRevealed(false)
      setDraft(nextScreen === 'game' ? loadAnswers()[String(nextIndex)] ?? initialDraft(steps[nextIndex].type) : '')
      window.scrollTo(0, 0)
    }
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop)
  }, [])
  const navigate = (nextScreen: Screen, nextIndex = 0) => {
    history.pushState({ screen: nextScreen, index: nextIndex }, '')
    setScreen(nextScreen); setIndex(nextIndex); setRevealed(false)
    setDraft(nextScreen === 'game' ? answers[String(nextIndex)] ?? initialDraft(steps[nextIndex].type) : '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const step = steps[index]
  const abcAccuracy = (value: Answer | undefined) => Array.isArray(value) ? value.filter((label, i) => label === abcLabels[i]).length : 0
  const choiceStrong = step.type === 'abc' ? abcAccuracy(draft) === 3 : step.type === 'multi' ? true : draft === step.correct
  const snapshot = useMemo(() => {
    const correct = (i: number) => answers[String(i)] === steps[i].correct
    const abc = abcAccuracy(answers['1'])
    return [correct(0) ? 3 : 1, abc, correct(2) ? 3 : 1, correct(3) ? 3 : 1]
  }, [answers])
  const canSubmit = step.type === 'abc' ? Array.isArray(draft) && draft.every(Boolean) : step.type === 'multi' ? Array.isArray(draft) && draft.length === 3 : Boolean(draft)
  const submit = () => { setAnswers(a => ({ ...a, [String(index)]: draft })); setRevealed(true) }
  const next = () => index === steps.length - 1 ? navigate('results') : navigate('game', index + 1)
  const restart = () => { setAnswers({}); sessionStorage.removeItem('behavior-coach-answers'); navigate('welcome') }

  return <div className="app-shell">
    <header className="site-header"><div className="brand-mark" aria-hidden="true"><Eye size={22}/></div><div><b>Behavior Basics</b><span>Granite School District</span></div></header>
    {screen === 'welcome' && <main className="welcome page screen-enter"><div className="welcome-title"><p className="eyebrow">A 5–8 MINUTE LEARNING EXPERIENCE</p><h1>See It, Sort It,<br/><em>Coach It.</em></h1><MountainScene /></div><p className="subtitle">A quick behavior lens for instructional coaches</p><div className="welcome-card"><p>You already know how to listen, notice patterns, and ask thoughtful questions. This activity adds a simple behavior lens to those strengths.</p><p><strong>The goal isn’t to diagnose a student or become a behavior specialist.</strong> It’s to slow down, describe what’s observable, organize information, and stay curious before jumping to a solution.</p></div><button className="primary" onClick={() => navigate('game')}>Start the Scenario <ArrowRight size={19}/></button><p className="privacy">No login · Answers stay in this browser session</p></main>}
    {screen === 'game' && <main className="page game screen-enter" key={index}>
      <div className="progress-row"><span>Scenario: Independent Writing</span><span>{index + 1} of {steps.length}</span></div><div className="progress"><i style={{ width: `${((index + 1) / steps.length) * 100}%` }}/></div>
      <div className="ridge-progress" aria-label={`Learning journey, step ${index + 1} of ${steps.length}`}><MountainScene stage={index + 1}/><div className="journey-labels">{['See It','Sort It','Think','Coach It','Stay Curious'].map((label,i)=><span className={i <= index ? 'reached' : ''} key={label}>{label}</span>)}</div></div>
      <button className="back" onClick={() => history.back()}><ChevronLeft size={18}/> Back</button>
      <section className="question-card"><p className="eyebrow">{step.eyebrow}</p><h2>{step.title}</h2><h3>{step.prompt}</h3>
        {step.type === 'abc' ? <AbcInteraction value={draft as AbcLabel[]} setValue={setDraft} revealed={revealed}/> : <div className={`options ${step.type}`} role={step.type === 'single' ? 'radiogroup' : 'group'} aria-label={step.prompt}>{step.options?.map(option => { const many = step.type === 'multi'; const selected = many ? Array.isArray(draft) && draft.includes(option) : draft === option; const capped = many && Array.isArray(draft) && draft.length === 3 && !selected
          return <button key={option} disabled={revealed || capped} role={many ? 'checkbox' : 'radio'} aria-checked={selected} className={`option ${selected ? 'selected' : ''}`} onClick={() => setDraft(many ? selected ? (draft as string[]).filter(x => x !== option) : [...(draft as string[]), option] : option)}><span className="select-dot">{selected && <Check size={15}/>}</span><span>{option}</span></button>})}</div>}
        {step.type === 'multi' && !revealed && <p className="selection-count" aria-live="polite">{Array.isArray(draft) ? draft.length : 0} of 3 selected</p>}
        {revealed && <div className={`feedback ${choiceStrong ? 'good' : ''}`} role="status"><div><MessageCircleQuestion size={22}/></div><p><strong>{choiceStrong ? 'A useful coaching move' : 'Keep the lens curious'}</strong>{step.type === 'abc' && !choiceStrong ? `You identified ${abcAccuracy(draft)} of 3. The completed sequence below shows how each event fits. ` : step.type === 'single' && !choiceStrong ? 'That’s a common place to start. Consider what we can verify or what question would gather more information. ' : ''}{step.feedback}</p></div>}
        {revealed && step.type === 'abc' && <CompletedAbc />}
        {!revealed ? <button className="primary full" disabled={!canSubmit} onClick={submit}>{step.type === 'abc' ? 'Check the Pattern' : 'See Coaching Feedback'} <ArrowRight size={18}/></button> : <button className="primary full" onClick={next}>{index === steps.length - 1 ? 'View My Snapshot' : 'Continue'} <ArrowRight size={18}/></button>}
      </section>
    </main>}
    {screen === 'results' && <Results levels={snapshot} answers={answers} download={createPdf} restart={restart}/>}<footer>Created for curious, collaborative coaching.</footer>
  </div>
}

function AbcInteraction({ value, setValue, revealed }: { value: AbcLabel[]; setValue: (value: Answer) => void; revealed: boolean }) {
  const current = Array.isArray(value) ? value : ['', '', ''] as unknown as AbcLabel[]
  return <div className="abc-task">{abcEvents.map((event, eventIndex) => <fieldset key={event}><legend><span>Event {eventIndex + 1}</span>{event}</legend><div className="abc-choices">{abcLabels.map(label => <button type="button" key={label} disabled={revealed} className={current[eventIndex] === label ? 'selected' : ''} aria-pressed={current[eventIndex] === label} onClick={() => { const next = [...current]; next[eventIndex] = label; setValue(next) }}>{label}</button>)}</div></fieldset>)}</div>
}

function CompletedAbc() { return <section className="abc-complete" aria-label="Completed ABC sequence"><h4>Completed ABC sequence</h4>{abcLabels.map((label, i) => <div key={label}><span>{label[0]}</span><p><b>{label}</b>{abcEvents[i]}</p></div>)}</section> }

const levelWords = ['Keep Exploring', 'Practiced Here', 'Strong Move']
function Results({ levels, answers, download, restart }: { levels: number[]; answers: Answers; download: () => void; restart: () => void }) {
  const names = ['Notice Clearly','Organize the Pattern','Stay Curious','Ask Before Solving']
  const curiousChoices = Array.isArray(answers['4']) ? answers['4'] as string[] : []
  const observations = [levels[0] === 3 ? 'You chose observable information before interpreting behavior.' : 'Keep practicing the shift from a description of the student to what someone can see or hear.', levels[2] === 3 ? `You held function as a working hypothesis. Your first questions included ${curiousChoices.length ? curiousChoices.slice(0, 2).join(' and ').toLowerCase() : 'more context'}.` : 'One move to keep practicing: pause at a working hypothesis and gather context before choosing a strategy.', levels[1] === 3 ? 'You accurately organized all three events with the ABC lens.' : `You identified ${levels[1]} of the three ABC events; revisiting what happened immediately before and after can clarify the pattern.`]
  return <main className="page results screen-enter"><div className="result-icon"><Check size={26}/></div><p className="eyebrow">SCENARIO COMPLETE</p><h1>Your Coaching Lens<br/><em>Snapshot</em></h1><p className="result-intro">A snapshot of the moves you practiced in this scenario—not a score of your coaching ability.</p><div className="results-landscape"><MountainScene full/><p>Your behavior coaching view</p></div>
    <section className="snapshot" aria-label="Behavior coaching snapshot">{names.map((name,i)=><div className="bar-row" key={name}><div><b>{name}</b><span>{levelWords[Math.max(0, levels[i] - 1)]}</span></div><div className="bar segments" aria-label={`${name}: ${levelWords[Math.max(0, levels[i] - 1)]}`}>{[1,2,3].map(segment => <i className={segment <= levels[i] ? 'filled' : ''} key={segment}/>)}</div></div>)}</section>
    <section className="takeaways"><h2>What your choices suggest</h2>{observations.map(x=><p key={x}><Check size={17}/><span>{x}</span></p>)}</section><section className="guide-card"><div><Download size={25}/></div><h2>Take the lens with you</h2><p>Your print-ready reference includes practical coaching questions, the ABC lens, and prompts to help you dig deeper.</p><button className="primary full" onClick={download}><Download size={18}/> Download Behavior Coaching Quick Reference</button></section><p className="reminder"><span>NOTICE</span><i>→</i><span>UNDERSTAND</span><i>→</i><span>SUPPORT</span><i>→</i><span>CHECK</span></p><button className="text-button" onClick={restart}><RefreshCw size={16}/> Try it again</button>
  </main>
}

function createPdf() {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const navy = [18, 63, 112] as const
  const royal = [43, 104, 174] as const
  const sky = [214, 235, 247] as const
  const pale = [244, 248, 251] as const
  const slate = [55, 72, 88] as const
  const margin = 42
  const contentWidth = 528

  const text = (value: string, x: number, y: number, size = 9.5, style: 'normal' | 'bold' | 'italic' = 'normal', color: readonly [number, number, number] = slate) => {
    doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(value, x, y)
  }
  const wrapped = (value: string, x: number, y: number, width: number, size = 9.5, style: 'normal' | 'bold' | 'italic' = 'normal', leading = 12, color: readonly [number, number, number] = slate) => {
    const lines = doc.splitTextToSize(value, width) as string[]
    doc.setLineHeightFactor(leading / size)
    text(lines.join('\n'), x, y, size, style, color)
    return y + lines.length * leading
  }
  const bullets = (items: string[], x: number, y: number, width: number, size = 8.8, leading = 11.5) => {
    items.forEach(item => {
      const lines = doc.splitTextToSize(item, width - 13) as string[]
      doc.setFillColor(...royal); doc.circle(x + 2.5, y - 3, 1.7, 'F')
      doc.setLineHeightFactor(leading / size)
      text(lines.join('\n'), x + 12, y, size)
      y += lines.length * leading + 2
    })
    return y
  }
  const questionLabel = (x: number, y: number) => {
    doc.setFillColor(...sky); doc.roundedRect(x, y - 11, 116, 17, 4, 4, 'F')
    text('QUESTIONS TO HELP YOU DIG', x + 8, y, 7.2, 'bold', navy)
  }
  const sectionTitle = (number: string, title: string, y: number) => {
    doc.setFillColor(...royal); doc.roundedRect(margin, y - 17, 25, 25, 6, 6, 'F')
    text(number, margin + 9, y, 11, 'bold', [255, 255, 255])
    text(title, margin + 36, y, 15, 'bold', navy)
  }
  const callout = (value: string, y: number, strong = false) => {
    const fillColor: readonly [number, number, number] = strong ? royal : sky
    doc.setFillColor(...fillColor); doc.roundedRect(margin, y, contentWidth, 27, 6, 6, 'F')
    text(value, margin + 13, y + 17, 9.3, 'bold', strong ? [255, 255, 255] : navy)
  }
  const mountains = () => {
    doc.setFillColor(186, 220, 239); doc.triangle(0, 792, 100, 776, 205, 792, 'F')
    doc.setFillColor(91, 151, 194); doc.triangle(128, 792, 280, 769, 430, 792, 'F')
    doc.setFillColor(...navy); doc.triangle(365, 792, 490, 774, 612, 792, 'F')
  }
  const footer = (page: number) => {
    mountains()
    doc.setDrawColor(196, 210, 222); doc.line(margin, 728, 570, 728)
    text('NOTICE   >   UNDERSTAND   >   SUPPORT   >   CHECK', margin, 746, 8.5, 'bold', navy)
    text(`${page} / 2`, 546, 746, 8, 'bold', navy)
    wrapped('Use this lens to support collaborative problem-solving—not to independently diagnose function or conduct a formal FBA.', margin, 762, 490, 7.5, 'normal', 9)
  }

  // Page 1: observe carefully, then organize and compare what is happening.
  doc.setFillColor(...navy); doc.rect(0, 0, 612, 116, 'F')
  doc.setFillColor(...royal); doc.triangle(340, 116, 476, 56, 612, 116, 'F')
  doc.setFillColor(102, 166, 207); doc.triangle(433, 116, 535, 75, 612, 116, 'F')
  text('GRANITE SCHOOL DISTRICT', margin, 25, 7.5, 'bold', [186, 220, 239])
  text('Behavior Coaching Quick Reference', margin, 52, 21, 'bold', [255, 255, 255])
  text('When a teacher brings you a behavior concern, start here.', margin, 75, 10.5, 'bold', [255, 255, 255])
  wrapped('You do not need to solve it immediately. Your first job is to slow it down, get specific, and understand the pattern.', margin, 94, 390, 8.5, 'normal', 10, [255, 255, 255])

  sectionTitle('1', 'Get Specific', 145)
  text('Move from “the student is…” to “the student does…”', margin + 36, 162, 9.5, 'italic', royal)
  doc.setFillColor(...pale); doc.roundedRect(margin, 174, contentWidth, 52, 7, 7, 'F')
  text('INSTEAD OF', margin + 13, 188, 7, 'bold', royal); text('“He’s defiant.”', margin + 13, 207, 10.5, 'bold', slate)
  text('TRY', margin + 147, 188, 7, 'bold', royal)
  wrapped('“When independent work begins, he says ‘no,’ pushes the paper away, and puts his head down.”', margin + 147, 203, 360, 9.2, 'normal', 11)
  questionLabel(margin, 247)
  bullets(['What does it actually look or sound like?', 'What would I see if I were standing in the room?', 'When you say refuses, shuts down, escalates, or is disrespectful, what does the student actually do?', 'How often is it happening?', 'How long does it usually last?'], margin + 2, 267, contentWidth - 4)
  callout('Coach move: Get clear before you try to fix it.', 340)

  sectionTitle('2', 'Look for the Pattern', 394)
  text('Use the ABC lens', margin + 36, 411, 9.5, 'italic', royal)
  const abc = [
    ['A', 'ANTECEDENT', 'What was happening right before?'],
    ['B', 'BEHAVIOR', 'What did the student actually do or say?'],
    ['C', 'CONSEQUENCE', 'What happened right after? What changed?'],
  ]
  abc.forEach((item, i) => {
    const x = margin + i * 180
    const fillColor: readonly [number, number, number] = i === 1 ? royal : navy
    doc.setFillColor(...fillColor); doc.roundedRect(x, 426, 168, 65, 7, 7, 'F')
    text(item[0], x + 11, 449, 18, 'bold', [255, 255, 255]); text(item[1], x + 37, 444, 7.5, 'bold', sky)
    wrapped(item[2], x + 37, 458, 119, 8.2, 'normal', 10, [255, 255, 255])
  })
  questionLabel(margin, 516)
  text('BEFORE', margin + 2, 540, 8, 'bold', navy)
  bullets(['What was the student being asked to do?', 'Who was there?', 'Was this a transition, difficult task, correction, waiting, or unstructured time?', 'What had been happening earlier?'], margin + 2, 557, 252, 8.2, 10.5)
  text('AFTER', 318, 540, 8, 'bold', navy)
  bullets(['What did the adults do?', 'What did peers do?', 'Did the task change, stop, or get easier?', 'Did the student gain attention, help, a break, an item, or something else?', 'What happened next?'], 318, 557, 252, 8.2, 10.5)
  callout('One ABC is a clue. A repeated pattern is more useful.', 672)
  footer(1)

  doc.addPage()
  doc.setFillColor(...navy); doc.rect(0, 0, 612, 54, 'F')
  text('BEHAVIOR COACHING QUICK REFERENCE', margin, 33, 11, 'bold', [255, 255, 255])
  text('FROM PATTERN TO A DOABLE NEXT STEP', 393, 33, 7.5, 'bold', sky)

  sectionTitle('3', 'Compare When It Happens — and When It Doesn’t', 86)
  text('Sometimes the best information comes from the times things are going well.', margin + 36, 103, 9.3, 'italic', royal)
  bullets(['When is this most likely to happen?', 'When does it almost never happen?', 'What activities or settings are easier for the student?', 'Which adults, classes, or times of day are different?', 'What is different when the student is successful?', 'Has anything recently changed?', 'Are there patterns in task difficulty, attention, transitions, peers, choice, or predictability?'], margin + 2, 125, contentWidth - 4, 8.5, 10.5)
  callout('Coach move: Look for differences you may actually be able to change.', 218)

  sectionTitle('4', 'Think Functionally', 270)
  text('What seems to “work” about this behavior for the student?', margin + 36, 287, 9.4, 'italic', royal)
  text('You are developing a hypothesis, not assigning a label.', margin + 36, 303, 8.7, 'bold', slate)
  doc.setFillColor(...pale); doc.roundedRect(margin, 315, 254, 91, 7, 7, 'F'); doc.roundedRect(316, 315, 254, 91, 7, 7, 'F')
  text('DOES SOMETHING GET ADDED?', margin + 12, 333, 8, 'bold', navy)
  bullets(['Adult attention', 'Peer attention', 'Help or support', 'Access to something preferred'], margin + 12, 350, 226, 8.2, 9.5)
  text('DOES SOMETHING GO AWAY OR GET DELAYED?', 328, 333, 7.5, 'bold', navy)
  bullets(['Difficult work', 'A demand', 'A social situation', 'Waiting', 'An uncomfortable situation'], 328, 350, 226, 8.2, 9.5)
  questionLabel(margin, 427)
  bullets(['What reliably changes after the behavior?', 'If the behavior stopped working tomorrow, what would the student lose?', 'What could the student do instead that would accomplish the same thing appropriately?'], margin + 2, 448, contentWidth - 4, 8.5, 10.5)

  sectionTitle('5', 'Before You Recommend a Strategy…', 507)
  const strategyQuestions = ['What has already been tried?', 'How consistently was it used?', 'For how long?', 'What happened when it was used?', 'What does the teacher realistically have the capacity to do?', 'What is one small change we could try first?', 'How will we know if it helped?']
  bullets(strategyQuestions.slice(0, 4), margin + 2, 529, 250, 8.2, 10)
  bullets(strategyQuestions.slice(4), 318, 529, 252, 8.2, 10)
  callout('A strategy should fit the pattern — not just the behavior.', 584, true)

  doc.setFillColor(...navy); doc.roundedRect(margin, 622, contentWidth, 96, 9, 9, 'F')
  text('QUESTIONS WORTH KEEPING IN YOUR BACK POCKET', margin + 15, 643, 10.5, 'bold', [255, 255, 255])
  const pocket = ['“Walk me through what usually happens right before.”', '“What happens next?”', '“When is this less likely to happen?”', '“What does it look like when things go well?”', '“What have you already tried?”', '“What do you think the student gets or gets away from when this happens?”', '“What would we rather see the student do instead?”', '“What is one thing we could change that feels doable tomorrow?”']
  pocket.forEach((item, i) => {
    const x = margin + 15 + (i % 2) * 255; const y = 660 + Math.floor(i / 2) * 13
    doc.setFillColor(126, 190, 225); doc.circle(x + 2, y - 2.5, 1.4, 'F')
    text(item, x + 9, y, i === 5 || i === 7 ? 7.3 : 7.7, 'normal', [255, 255, 255])
  })
  footer(2)
  doc.save('behavior-coaching-quick-reference.pdf')
}

export default App
