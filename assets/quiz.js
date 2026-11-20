// Self-check questions. Markup:
// <div class="quiz">
//   <p class="q">Question</p>
//   <div class="opts">
//     <button data-correct data-fb="Why this is right">A</button>
//     <button data-fb="Why this is wrong">B</button>
//   </div>
//   <p class="feedback" aria-live="polite"></p>
// </div>
// Nothing is stored or sent anywhere.

for (const quiz of document.querySelectorAll('.quiz:not([data-custom])')) {
  const fb = quiz.querySelector('.feedback');
  for (const btn of quiz.querySelectorAll('.opts button')) {
    btn.addEventListener('click', () => {
      const right = btn.hasAttribute('data-correct');
      quiz.querySelectorAll('.opts button').forEach(b => b.classList.remove('right', 'wrong'));
      btn.classList.add(right ? 'right' : 'wrong');
      fb.className = 'feedback ' + (right ? 'right' : 'wrong');
      fb.textContent = (right ? 'Correct. ' : 'Not quite. ') + (btn.dataset.fb || '');
    });
  }
}
