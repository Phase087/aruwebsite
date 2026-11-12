/* The second page: "now guess when I'm leaving". Needs common.js first. */

const leaveAnswer = new Date(CONFIG.leaveDate.year, CONFIG.leaveDate.month - 1, CONFIG.leaveDate.day);

createGame($("#game2"), {
  answer: leaveAnswer,
  winMessage: "SURPRISEEEE BABYYYYY!!!!!",
  epic: true,   // extra-big heart explosions
  fakeOut: CONFIG.fakeOutDay
    ? new Date(CONFIG.leaveDate.year, CONFIG.leaveDate.month - 1, CONFIG.fakeOutDay)
    : null,
});

enableTapHearts();
paperHearts(30);

// browsers only allow sound after a tap, so the song picks up again on her first touch
document.addEventListener("pointerdown", resumeMusic, { once: true });
$("#again").addEventListener("click", rememberMusic);
