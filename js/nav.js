const motionToggle = document.getElementById('motion-toggle');
let motionOn = true;

motionToggle.addEventListener('click', () => {
  motionOn = !motionOn;
  document.documentElement.classList.toggle('motion-off', !motionOn);
  motionToggle.textContent = motionOn ? 'Motion' : 'Motion: off';
  document.dispatchEvent(new CustomEvent('motionchange', { detail: motionOn }));
});
