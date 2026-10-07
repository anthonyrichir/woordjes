/**
 * Logique du quiz côté client (island vanilla, sans framework).
 * Flux : choix du sens → questions (les ratés reviennent en fin) → écran de fin + événement Umami.
 */
import { check, type Direction } from '../lib/check';
import type { Word } from '../lib/csv';

type Phase = 'ask' | 'feedback';

/** Phrases d'encouragement du hibou, piochées au hasard. */
const CHEERS = ['Super !', 'Top !', 'Bravo !', 'Goed zo !', 'Oui !', 'Prima !', 'Génial !'];
const COMFORTS = ['Pas grave, on la reverra.', 'Presque ! On réessaie plus tard.', 'Ça viendra, promis.', 'On la garde pour la fin.'];
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/** Mélange de Fisher-Yates (copie). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Lecture d'un mot néerlandais via Web Speech (voix nl-NL si dispo, sinon n'importe quel nl). */
function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'nl-NL';
  u.rate = 0.9;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === 'nl-NL') ?? voices.find((v) => v.lang.startsWith('nl'));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** Relance une animation CSS pilotée par data-mood (retirer puis remettre l'attribut). */
function setMood(owl: Element, mood: 'idle' | 'happy' | 'oops' | 'party') {
  owl.setAttribute('data-mood', 'idle');
  void (owl as HTMLElement).getBoundingClientRect(); // force le reflow
  owl.setAttribute('data-mood', mood);
}

export function startQuiz(root: HTMLElement) {
  const words = JSON.parse(root.dataset.words!) as Word[];
  const title = root.dataset.title!;
  const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;

  const screens = { setup: $('screen-setup'), play: $('screen-play'), done: $('screen-done') };
  const owlPlay = screens.play.querySelector('.uiltje')!;
  const owlSays = $('owl-says');
  const barFill = $('bar-fill');
  const bar = root.querySelector<HTMLElement>('.bar')!;
  const counter = $('counter');
  const promptTag = $('prompt-tag');
  const promptWord = $('prompt-word');
  const speakBtn = $<HTMLButtonElement>('speak');
  const feedback = $('feedback');
  const form = $<HTMLFormElement>('answer-form');
  const input = $<HTMLInputElement>('answer');
  const submitIcon = $('submit-icon');
  const submitLabel = $('submit-label');

  // --- État de la session -------------------------------------------------
  let direction: Direction = 'nl-fr';
  let requireArticles = false;
  let queue: number[] = []; // indices des mots à poser dans ce tour
  let retry: number[] = []; // ratés du tour, reposés au tour suivant
  let current = -1;
  let mastered = 0; // mots réussis (= progression)
  const missedFirstTry = new Set<number>();
  const seen = new Set<number>(); // mots déjà posés au moins une fois
  let phase: Phase = 'ask';

  const show = (name: keyof typeof screens) => {
    for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  };

  /** Mot source et traductions acceptées selon le sens. */
  const sourceOf = (w: Word) => (direction === 'nl-fr' ? w.nl[0]! : w.fr[0]!);
  const acceptedOf = (w: Word) => (direction === 'nl-fr' ? w.fr : w.nl);
  const dutchOf = (w: Word) => w.nl[0]!;

  // --- Écran 1 : choix du sens --------------------------------------------
  for (const btn of screens.setup.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
    btn.addEventListener('click', () => {
      direction = btn.dataset.dir as Direction;
      requireArticles = $<HTMLInputElement>('require-articles').checked;
      begin();
    });
  }

  function begin() {
    queue = shuffle(words.map((_, i) => i));
    retry = [];
    mastered = 0;
    missedFirstTry.clear();
    seen.clear();
    promptTag.textContent = direction === 'nl-fr' ? 'NL' : 'FR';
    promptTag.className = `tag ${direction === 'nl-fr' ? 'tag-nl' : 'tag-fr'}`;
    promptWord.lang = direction === 'nl-fr' ? 'nl' : 'fr';
    input.lang = direction === 'nl-fr' ? 'fr' : 'nl';
    show('play');
    next();
  }

  // --- Écran 2 : questions --------------------------------------------------
  function updateProgress() {
    const pct = Math.round((mastered / words.length) * 100);
    barFill.style.width = `${pct}%`;
    bar.setAttribute('aria-valuenow', String(pct));
    counter.textContent = `${mastered} / ${words.length}`;
  }

  function next() {
    // Tour terminé : on repose les ratés, ou on a fini.
    if (queue.length === 0) {
      if (retry.length === 0) return finish();
      queue = shuffle(retry);
      retry = [];
      owlSays.textContent = 'On revoit ceux qui ont résisté !';
    }
    current = queue.shift()!;
    const w = words[current]!;
    phase = 'ask';
    // Nouveau mot + relance de son animation d'apparition.
    promptWord.textContent = sourceOf(w);
    promptWord.style.animation = 'none';
    void promptWord.offsetWidth;
    promptWord.style.animation = '';
    // En FR→NL, écouter le mot donnerait la réponse : le bouton n'apparaît qu'après correction.
    speakBtn.hidden = direction === 'fr-nl';
    feedback.className = 'feedback';
    feedback.textContent = '';
    input.value = '';
    input.readOnly = false;
    input.classList.remove('shake');
    submitIcon.textContent = '✓';
    submitLabel.textContent = 'Valider';
    setMood(owlPlay, 'idle');
    updateProgress();
    input.focus({ preventScroll: true });
  }

  function answer() {
    const w = words[current]!;
    const verdict = check(input.value, acceptedOf(w), { direction, requireArticles });
    const expected = acceptedOf(w)[0]!;
    phase = 'feedback';
    input.readOnly = true;
    submitIcon.textContent = '➜';
    submitLabel.textContent = 'Suivant';
    speakBtn.hidden = false; // on peut toujours écouter le mot NL une fois corrigé

    if (verdict === 'wrong') {
      if (!seen.has(current)) missedFirstTry.add(current);
      retry.push(current);
      feedback.className = 'feedback oops';
      feedback.innerHTML = `<span>Pas tout à fait…</span><span class="answer">${escapeHtml(expected)}</span>`;
      input.classList.add('shake');
      owlSays.textContent = pick(COMFORTS);
      setMood(owlPlay, 'oops');
    } else {
      mastered++;
      feedback.className = verdict === 'exact' ? 'feedback ok' : 'feedback almost';
      feedback.innerHTML =
        verdict === 'exact'
          ? `<span>✅ ${pick(CHEERS)}</span>`
          : `<span>✅ Presque parfait !</span><span class="answer">${escapeHtml(expected)}</span><span class="hint">Attention aux accents</span>`;
      owlSays.textContent = verdict === 'exact' ? pick(CHEERS) : 'Bien ! Pense aux accents 😉';
      setMood(owlPlay, 'happy');
      updateProgress();
    }
    seen.add(current);
  }

  // Entrée = valider, puis Entrée = mot suivant (le champ garde le focus, le clavier reste ouvert).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (phase === 'ask') {
      if (!input.value.trim()) return input.focus();
      answer();
    } else {
      next();
    }
  });
  // Le champ est en lecture seule pendant la correction : on garde le focus dessus pour qu'Entrée fonctionne.
  input.addEventListener('blur', () => {
    if (phase === 'feedback' && !screens.play.hidden) setTimeout(() => input.focus({ preventScroll: true }), 0);
  });
  speakBtn.addEventListener('click', () => speak(dutchOf(words[current]!)));

  // --- Écran 3 : fin -----------------------------------------------------------
  function finish() {
    const score = words.length - missedFirstTry.size;
    const pct = Math.round((score / words.length) * 100);
    $('score').textContent = String(score);
    $('score-total').textContent = String(words.length);
    $('done-title').textContent = pct === 100 ? 'Parfait ! 🏆' : pct >= 70 ? 'Bravo ! 🎉' : 'Bien joué ! 💪';
    $('done-msg').textContent =
      pct === 100
        ? 'Tous les mots du premier coup. Uiltje est impressionné !'
        : missedFirstTry.size === 1
          ? 'Un seul mot a résisté, et tu l’as eu ensuite !'
          : `${missedFirstTry.size} mots ont résisté, mais tu les as tous eus à la fin !`;
    confetti($('confetti'));
    show('done');

    // Suivi pédagogique anonyme (voir README). Aucune donnée nominative.
    window.umami?.track('quiz_termine', {
      lecon: title,
      direction: direction === 'nl-fr' ? 'NL→FR' : 'FR→NL',
      nb_mots: words.length,
      score,
      rates_premier_essai: missedFirstTry.size,
    });
  }

  $('restart').addEventListener('click', () => {
    show('setup');
    screens.setup.querySelector<HTMLButtonElement>('[data-dir]')?.focus();
  });

  // Les voix se chargent de façon asynchrone sur certains navigateurs.
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
}

/** 40 confettis en CSS pur, couleurs de la palette. */
function confetti(host: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#6c4ab6', '#ffb703', '#2ec4b6', '#ff8fa3', '#f4a261'];
  host.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length]!;
    c.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    c.style.animationDelay = `${Math.random() * 2}s`;
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    host.appendChild(c);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}
