import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, Download, Eye, MessageCircleQuestion, RefreshCw } from 'lucide-react'
import { jsPDF } from 'jspdf'

type Answer = string | string[]
type Answers = Record<string, Answer>
type Step = { eyebrow: string; title: string; prompt: string; type: 'single' | 'sort' | 'multi'; options: string[]; correct?: string; feedback: string }

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
  { eyebrow: '02 · SORT IT', title: 'Organize the pattern with ABC', prompt: 'Tap each ABC card to identify all three parts of the scenario.', type: 'sort', options: ['A|The teacher gives an independent writing assignment.', 'B|Eli says “I’m not doing this” and pushes the paper away.', 'C|The teacher repeats the direction and helps him get started.'], feedback: 'ABC helps us organize what happened—not decide why. The sequence gives us useful questions to explore next.' },
  { eyebrow: '03 · THINK FUNCTIONALLY', title: 'Hold a working hypothesis lightly', prompt: 'Based on what we know so far, what might the behavior be helping the student get, avoid, or change?', type: 'single', options: ['Avoid or delay the writing task', 'Get adult attention', 'Access something preferred', 'We need more information before deciding'], correct: 'We need more information before deciding', feedback: 'Exactly. Both task delay and adult support are plausible. Function is a working hypothesis—not a label—and we need patterns across more than one moment.' },
  { eyebrow: '04 · COACH IT', title: 'Ask before solving', prompt: 'What would be the most useful question to ask the teacher next?', type: 'single', options: ['“Have you tried a reward chart?”', '“When does this usually happen, and when is Eli more successful?”', '“Why do you think he is doing this?”', '“Have you called home?”'], correct: '“When does this usually happen, and when is Eli more successful?”', feedback: 'That question invites partnership and comparison. It gathers information before recommending a strategy.' },
  { eyebrow: '05 · STAY CURIOUS', title: 'Build a fuller picture', prompt: 'What else would you want to know? Select all that would help.', type: 'multi', options: ['When does the behavior happen?', 'When does it not happen?', 'What usually happens immediately before?', 'What usually happens after?', 'What does success look like?', 'What has already been tried?'], feedback: 'These questions turn a broad concern into something observable, contextual, and coachable—without blaming or diagnosing.' }
]

const initial = () => { try { return JSON.parse(sessionStorage.getItem('behavior-coach-answers') || '{}') } catch { return {} } }

function App() {
  const [screen, setScreen] = useState<'welcome' | 'game' | 'results'>('welcome')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(initial)
  const [draft, setDraft] = useState<Answer>('')
  const [revealed, setRevealed] = useState(false)
  useEffect(() => sessionStorage.setItem('behavior-coach-answers', JSON.stringify(answers)), [answers])
  const step = steps[index]
  const choiceCorrect = step.type === 'multi' ? (draft as string[]).length >= 4 : step.type === 'sort' ? (draft as string[]).length === 3 : draft === step.correct
  const scores = useMemo(() => {
    const got = (i: number) => answers[String(i)] === steps[i].correct
    const multi = Array.isArray(answers['4']) ? (answers['4'] as string[]).length : 0
    return [got(0) ? 94 : 72, 90, got(2) ? 96 : 74, Math.min(96, (got(3) ? 84 : 66) + multi * 2)]
  }, [answers])

  const submit = () => { setAnswers(a => ({ ...a, [String(index)]: draft })); setRevealed(true) }
  const next = () => { if (index === steps.length - 1) setScreen('results'); else { setIndex(i => i + 1); setDraft(['multi','sort'].includes(steps[index + 1].type) ? [] : ''); setRevealed(false) }; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const restart = () => { setAnswers({}); setIndex(0); setDraft(''); setRevealed(false); setScreen('welcome'); sessionStorage.removeItem('behavior-coach-answers') }
  const download = () => createPdf(scores)

  return <div className="app-shell">
    <header className="site-header"><div className="brand-mark" aria-hidden="true"><Eye size={22}/></div><div><b>Behavior Basics</b><span>Granite School District</span></div></header>
    {screen === 'welcome' && <main className="welcome page screen-enter">
      <div className="welcome-title"><p className="eyebrow">A 5–8 MINUTE LEARNING EXPERIENCE</p><h1>See It, Sort It,<br/><em>Coach It.</em></h1><MountainScene /></div>
      <p className="subtitle">A quick behavior lens for instructional coaches</p>
      <div className="welcome-card"><p>You already know how to listen, notice patterns, and ask thoughtful questions. This activity adds a simple behavior lens to those strengths.</p><p><strong>The goal isn’t to diagnose a student or become a behavior specialist.</strong> It’s to slow down, describe what’s observable, organize information, and stay curious before jumping to a solution.</p></div>
      <button className="primary" onClick={() => setScreen('game')}>Start the Scenario <ArrowRight size={19}/></button><p className="privacy">No login · Answers stay in this browser session</p>
    </main>}
    {screen === 'game' && <main className="page game screen-enter" key={index}>
      <div className="progress-row"><span>Scenario: Independent Writing</span><span>{index + 1} of {steps.length}</span></div><div className="progress"><i style={{ width: `${((index + 1) / steps.length) * 100}%` }}/></div>
      <div className="ridge-progress" aria-label={`Learning journey, step ${index + 1} of ${steps.length}`}><MountainScene stage={index + 1}/><div className="journey-labels">{['See It','Sort It','Think','Coach It','Snapshot'].map((label,i)=><span className={i <= index ? 'reached' : ''} key={label}>{label}</span>)}</div></div>
      <button className="back" onClick={() => index ? (setIndex(index-1), setRevealed(false), setDraft(answers[String(index-1)] || '')) : setScreen('welcome')}><ChevronLeft size={18}/> Back</button>
      <section className="question-card"><p className="eyebrow">{step.eyebrow}</p><h2>{step.title}</h2>
        {index === 1 && <blockquote>“The teacher gives the class an independent writing assignment. Eli looks at the paper, says ‘I’m not doing this,’ and pushes it away. The teacher approaches, repeats the direction, and begins helping him get started.”</blockquote>}
        <h3>{step.prompt}</h3>
        <div className={`options ${step.type}`} role={step.type === 'single' ? 'radiogroup' : 'group'} aria-label={step.prompt}>
          {step.options.map((option, i) => {
            const label = step.type === 'sort' ? option.slice(2) : option; const selectableMany = step.type === 'multi' || step.type === 'sort'; const selected = selectableMany ? (Array.isArray(draft) && draft.includes(option)) : draft === option
            return <button key={option} disabled={revealed} role={selectableMany ? 'checkbox' : 'radio'} aria-checked={selected} className={`option ${selected ? 'selected' : ''}`} onClick={() => setDraft(selectableMany ? selected ? (draft as string[]).filter(x=>x!==option) : [...(Array.isArray(draft) ? draft : []), option] : option)}>
              {step.type === 'sort' ? <span className="abc">{option[0]}</span> : <span className="select-dot">{selected && <Check size={15}/>}</span>}<span>{label}</span>
              {step.type === 'sort' && <small>{i === 0 ? 'Right before' : i === 1 ? 'Student action' : 'Right after'}</small>}
            </button>})}
        </div>
        {revealed && <div className={`feedback ${choiceCorrect ? 'good' : ''}`} role="status"><div><MessageCircleQuestion size={22}/></div><p><strong>{choiceCorrect ? 'A useful coaching move' : 'Keep the lens curious'}</strong>{choiceCorrect ? step.feedback : `That’s a common place to start. ${step.type === 'single' ? 'Consider what we can verify or what question would gather more information.' : step.feedback}`}</p></div>}
        {!revealed ? <button className="primary full" disabled={['multi','sort'].includes(step.type) ? !Array.isArray(draft) || !draft.length : !draft} onClick={submit}>{step.type === 'sort' ? 'Check the Pattern' : 'See Coaching Feedback'} <ArrowRight size={18}/></button> : <button className="primary full" onClick={next}>{index === steps.length - 1 ? 'View My Snapshot' : 'Continue'} <ArrowRight size={18}/></button>}
      </section>
    </main>}
    {screen === 'results' && <Results scores={scores} answers={answers} download={download} restart={restart}/>} 
    <footer>Created for curious, collaborative coaching.</footer>
  </div>
}

function Results({scores, answers, download, restart}:{scores:number[]; answers:Answers; download:()=>void; restart:()=>void}) {
  const names = ['Notice Clearly','Organize the Pattern','Stay Curious','Ask Before Solving']
  const observations = [scores[0] > 80 ? 'You consistently looked for observable information before interpreting behavior.' : 'Keep practicing the shift from character descriptions to what someone can see or hear.', scores[2] > 80 ? 'You held possible function as a working hypothesis and made room for more information.' : 'One thing to keep practicing: pause before moving from a hypothesis to a strategy.', Array.isArray(answers['4']) && answers['4'].length >= 4 ? 'Your follow-up questions showed strong curiosity about context, patterns, and success.' : 'Your next growth move is to compare when the concern happens with when the student is successful.']
  return <main className="page results screen-enter"><div className="result-icon"><Check size={26}/></div><p className="eyebrow">SCENARIO COMPLETE</p><h1>Your Coaching Lens<br/><em>Snapshot</em></h1><p className="result-intro">A reflection of the coaching moves you practiced today.</p>
    <div className="results-landscape"><MountainScene full/><p>Your behavior coaching view</p></div>
    <section className="snapshot" aria-label="Behavior coaching snapshot">{names.map((n,i)=><div className="bar-row" key={n}><div><b>{n}</b><span>{i === 0 ? 'Observe before interpreting' : i === 1 ? 'Use ABC to see context' : i === 2 ? 'Hold hypotheses lightly' : 'Gather before recommending'}</span></div><div className="bar"><i style={{width:`${scores[i]}%`}}/></div></div>)}</section>
    <section className="takeaways"><h2>What your choices suggest</h2>{observations.map(x=><p key={x}><Check size={17}/><span>{x}</span></p>)}</section>
    <section className="guide-card"><div><Download size={25}/></div><h2>Take the lens with you</h2><p>Your one-page, print-ready reference includes the ABC lens, coaching questions, and your snapshot.</p><button className="primary full" onClick={download}><Download size={18}/> Download My Behavior Basics Quick Guide</button></section>
    <p className="reminder"><span>NOTICE</span><i>→</i><span>UNDERSTAND</span><i>→</i><span>SUPPORT</span><i>→</i><span>CHECK</span></p>
    <button className="text-button" onClick={restart}><RefreshCw size={16}/> Try it again</button>
  </main>
}

function createPdf(scores:number[]) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' }); const blue=[18,63,112] as const, teal=[18,137,139] as const; const margin=48
  doc.setFillColor(...blue); doc.rect(0,0,612,112,'F'); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.text('Behavior Basics Quick Guide',margin,49); doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.text('A practical behavior lens for instructional coaches',margin,70); doc.text('GRANITE SCHOOL DISTRICT',margin,94)
  doc.setTextColor(...blue); let y=145
  const section=(num:string,title:string,lines:string[])=>{ doc.setFillColor(228,242,245); doc.roundedRect(margin,y-16,25,25,6,6,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(num,margin+9,y+1); doc.setFontSize(14); doc.text(title,margin+37,y); doc.setFont('helvetica','normal'); doc.setTextColor(48,65,82); doc.setFontSize(10.5); lines.forEach((line,i)=>doc.text(line,margin+37,y+19+i*15)); y += 26+lines.length*15; doc.setTextColor(...blue) }
  section('1','Describe, Don’t Label',['Move from “The student is…” to “The student does…”']);
  section('2','Use the ABC Lens',['Antecedent — What happened right before?','Behavior — What did the student do?','Consequence — What happened right after?']);
  section('3','Think Functionally',['What might the behavior help the student get, avoid, or change?','Function is a working hypothesis—not a label. Ask what else we need to know.']);
  section('4','Ask Before Solving',['When does this usually happen—and when does it not?','What happens right before and right after?','When is the student more successful? What has already been tried?']);
  doc.setFillColor(245,248,251); doc.roundedRect(margin,y-13,516,116,10,10,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...blue); doc.text('YOUR BEHAVIOR COACHING SNAPSHOT',margin+16,y+10); const names=['Notice Clearly','Organize the Pattern','Stay Curious','Ask Before Solving']; names.forEach((n,i)=>{ const yy=y+31+i*17; doc.setFontSize(9); doc.text(n,margin+16,yy); doc.setFillColor(218,226,235); doc.roundedRect(margin+142,yy-7,330,7,3,3,'F'); doc.setFillColor(...teal); doc.roundedRect(margin+142,yy-7,330*scores[i]/100,7,3,3,'F') }); y+=132
  doc.setFillColor(...teal); doc.roundedRect(margin,y-12,516,43,8,8,'F'); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('COACHING REMINDER',margin+16,y+6); doc.setFontSize(13); doc.text('Notice  >  Understand  >  Support  >  Check',margin+158,y+6)
  doc.setTextColor(92,106,120); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text('Use this lens to support collaborative inquiry—not to independently diagnose function or conduct a formal FBA.',margin,714)
  doc.setFillColor(174,211,231); doc.triangle(0,792,112,745,220,792,'F'); doc.setFillColor(69,132,175); doc.triangle(105,792,294,724,430,792,'F'); doc.setFillColor(...blue); doc.triangle(350,792,492,746,612,792,'F')
  doc.save('behavior-basics-quick-guide.pdf')
}

export default App
