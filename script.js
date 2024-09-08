class TimeState {
  hours;
  minutes;
  seconds;
  milliseconds;

  constructor(milliseconds = 0, seconds = 0, minutes = 0, hours = 0) {
    this.milliseconds = milliseconds;
    this.seconds = seconds;
    this.minutes = minutes;
    this.hours = hours;
    this._order();
  }

  static newByObj(obj) {
    return new TimeState(obj.milliseconds, obj.seconds, obj.minutes, obj.hours);
  }

  _order() {
    this.seconds += parseInt(this.milliseconds / 1000);
    this.milliseconds %= 1000;

    this.minutes += parseInt(this.seconds / 60);
    this.seconds %= 60;

    this.hours += parseInt(this.minutes / 60);
    this.minutes %= 60;
  }

  add(milliseconds = 0, seconds = 0, minutes = 0, hours = 0) {
    this.milliseconds += milliseconds;
    this.seconds += seconds;
    this.minutes += minutes;
    this.hours += hours;
    return this._order();
  }

  addByObj(timeState) {
    return this.add(
      timeState.milliseconds,
      timeState.seconds,
      timeState.minutes,
      timeState.hours
    );
  }

  remove(milliseconds = 0, seconds = 0, minutes = 0, hours = 0) {
    this.milliseconds -= milliseconds;
    this.seconds -= seconds;
    this.minutes -= minutes;
    this.hours -= hours;

    return this._order();
  }

  removeByObj(timeState) {
    return this.remove(
      timeState.milliseconds,
      timeState.seconds,
      timeState.minutes,
      timeState.hours
    );
  }

  reset() {
    this.milliseconds = 0;
    this.seconds = 0;
    this.minutes = 0;
    this.hours = 0;
  }

  static max(time1, time2) {
    if (time1.hours != time2.hours)
      return time1.hours > time2.hours ? time1 : time2;
    if (time1.minutes != time2.minutes)
      return time1.minutes > time2.minutes ? time1 : time2;
    if (time1.seconds != time2.seconds)
      return time1.seconds > time2.seconds ? time1 : time2;
    return time1.milliseconds >= time2.milliseconds ? time1 : time2;
  }

  static min(time1, time2) {
    if (time1.hours != time2.hours)
      return time1.hours < time2.hours ? time1 : time2;
    if (time1.minutes != time2.minutes)
      return time1.minutes < time2.minutes ? time1 : time2;
    if (time1.seconds != time2.seconds)
      return time1.seconds < time2.seconds ? time1 : time2;
    return time1.milliseconds <= time2.milliseconds ? time1 : time2;
  }

  copy() {
    return TimeState.newByObj(this);
  }
}

const display = document.querySelector("#time");
const displayFlag = document.querySelector("#time-last-flag");
let lastDateTime;
let time = new TimeState();
let timeFlag = new TimeState();
let timeFlags = [];
let doWarns = true;

let timerInterval = null;

function shineDisplay(originalColor, color = "#ffd", elem = display) {
  console.log("shining ", elem);
  if (!originalColor)
    originalColor = getComputedStyle(elem).getPropertyValue("color");
  const originalTransition =
    getComputedStyle(elem).getPropertyValue("transitionDuration");

  elem.style.color = color;

  setTimeout(() => {
    elem.style.transitionDuration = "1s";
    elem.style.color = originalColor;
  }, 1);

  elem.style.transitionDuration = originalTransition;
}

function shineAllDisplay(color = "#ffd", originalColor) {
  const displays = document.querySelectorAll(".timer-text");
  displays.forEach((display) => shineDisplay(color, originalColor, display));
}

function updateDisplay(elem = display, timeState = time) {
  elem.childNodes[1].textContent = String(timeState.hours).padStart(2, "0");
  elem.childNodes[3].textContent =
    ":" + String(timeState.minutes).padStart(2, "0");
  elem.childNodes[5].textContent =
    ":" + String(timeState.seconds).padStart(2, "0");
  elem.childNodes[7].textContent =
    ":" + String(parseInt(timeState.milliseconds / 10)).padStart(2, "0");
}

function addTime() {
  let milliseconds = Date.now() - lastDateTime;
  time.add(milliseconds);
  timeFlag.add(milliseconds);
  lastDateTime = Date.now();
  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
}

function resumeSwitch() {
  shineAllDisplay("#b3d8f5");
  if (timerInterval) return stop();
  lastDateTime = Date.now();
  timerInterval = setInterval(addTime, 10);

  document.querySelector("#resume-button").textContent = "Stop";
}

function editTimer(actionCode) {
  const input = String(document.querySelector("#set-time-input").value).split(
    ":"
  );
  const newTime = new TimeState(
    parseInt(input[0]),
    parseInt(input[1]),
    parseInt(input[2])
  );
  switch (actionCode) {
    case "set":
      time = newTime;
      break;
    case "add":
      time.addByObj(newTime);
      timeFlag.addByObj(newTime);
      break;

    default:
      console.warn("Action code is invalid");
      return;
  }
  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
}

function stop() {
  clearInterval(timerInterval);
  timerInterval = null;

  document.querySelector("#resume-button").textContent = "Resume";
}

function reset() {
  if (
    doWarns &&
    // TODO: use window.open() with specific modal for do not show again confirmations
    !confirm(
      "ALERTA: Isso irá apagar permanentemente os dados da sessão atual!" +
        "\n\nOK para continuar"
    )
  )
    return;

  shineAllDisplay("#b3d8f5", "#ffa200");
  stop();
  time.reset();
  timeFlag.reset();
  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
  timeFlags.length = 0;
  document.querySelector("#flags").innerHTML = "";
  document.querySelector("#resume-button").textContent = "Start";
}

function warnSwitch() {
  doWarns = !document.querySelector("#dont-warn").checked;
}

function flag() {
  shineDisplay("#b3d8f5", "#f0f", displayFlag);

  const flagsContainer = document.querySelector("#flags");

  flagsContainer.innerHTML =
    `<div class="flags-pairs align-center"><span>Flag no. ${
      flagsContainer.querySelectorAll(".flags").length + 1
    }:&ensp;</span><div class="flags bold">${
      displayFlag.innerHTML
    }</div></div>` + flagsContainer.innerHTML;

  timeFlags.push(timeFlag.copy());
  timeFlag.reset();
  updateDisplay(displayFlag, timeFlag);

  minTimeIndex = timeFlags.reduce(
    (bestIndex, time, i) =>
      TimeState.min(time, timeFlags[bestIndex]) == time ? i : bestIndex,
    0
  );
  maxTimeIndex = timeFlags.reduce(
    (bestIndex, time, i) =>
      TimeState.max(time, timeFlags[bestIndex]) == time ? i : bestIndex,
    0
  );

  document
    .querySelectorAll(".flags-pairs > .flags")
    .forEach((node, i, list) => {
      const inverseIndex = list.length - 1 - i;
      if (inverseIndex == maxTimeIndex && inverseIndex != minTimeIndex)
        return (node.style.color = "#b00");
      if (inverseIndex == minTimeIndex && inverseIndex != maxTimeIndex)
        return (node.style.color = "#0b0");
      node.style.color = "#333";
    });
}

function save(name) {
  let timers = localStorage.getItem("timers");
  if (!timers) timers = [];
  timers.push({
    name: name,
    time: time,
    timeFlag: timeFlag,
    timeFlags: timeFlags,
    flagsContent: document.querySelector("#flags").innerHTML,
  });

  localStorage.setItem("timers", JSON.stringify(timers));
}

function getSession(sessionId, isGettingAll = false) {
  const sessions = JSON.parse(localStorage.getItem("timers"));

  if (isGettingAll) return sessions;

  if (sessionId === undefined) return sessions[sessions.length - 1];
  return sessions[sessionId];
}

function load(sessionId) {
  if (
    doWarns &&
    !confirm(
      "ALERTA: Carregar dados salvos irá apagar permanentemente os dados da sessão atual!\n\n" +
        "OK para continuar"
    )
  )
    return;

  {
    const doWarnsBackup = doWarns;
    doWarns = false;
    reset();
    doWarns = doWarnsBackup;
  }

  const session = getSession(sessionId);

  if (!session) {
    console.warn("No data to load.");
    return;
  }
  console.log("Current session: " + session);

  time = TimeState.newByObj(session.time);
  timeFlag = TimeState.newByObj(session.timeFlag);
  timeFlags = session.timeFlags.map((elem) => TimeState.newByObj(elem));

  document.querySelector("#flags").innerHTML = session.flagsContent;

  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
}
