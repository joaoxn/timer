class TimeState {
  hours;
  minutes;
  seconds;

  extraHours = 0;

  constructor(hoursOrObj = 0, minutes = 0, seconds = 0, extraHours = 0) {
    if (typeof hoursOrObj == "object") {
      extraHours = hoursOrObj.extraHours;
      seconds = hoursOrObj.seconds;
      minutes = hoursOrObj.minutes;
      hoursOrObj = hoursOrObj.hours;
    }
    this.hours = hoursOrObj;
    this.minutes = minutes;
    this.seconds = seconds;
    this.extraHours = extraHours;
  }

  add(seconds) {
    this.seconds += seconds;
    this.minutes += parseInt(this.seconds / 60);
    this.seconds %= 60;

    this.hours += parseInt(this.minutes / 60);
    this.minutes %= 60;

    if (this.hours >= 100) this.extraHours += this.hours - 99;

    this.hours %= 100;

    return this;
  }

  addObj(timeState) {
    let seconds = timeState.seconds;
    let minutes = timeState.minutes;
    let hours = timeState.hours;

    minutes += parseInt(seconds / 60);
    seconds %= 60;

    hours += parseInt(minutes / 60);
    minutes %= 60;

    this.hours += hours;
    this.minutes += minutes;
    this.seconds += seconds;

    return this;
  }

  remove(timeState) {
    let seconds = timeState.seconds;
    let minutes = timeState.minutes;
    let hours = timeState.hours;

    minutes += parseInt(seconds / 60);
    seconds %= 60;

    hours += parseInt(minutes / 60);
    minutes %= 60;

    this.hours -= hours;
    this.minutes -= minutes;
    this.seconds -= seconds;

    return this;
  }

  reset() {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
  }

  static max(time1, time2) {
    if (time1.hours != time2.hours)
      return time1.hours > time2.hours ? time1 : time2;
    if (time1.minutes != time2.minutes)
      return time1.minutes > time2.minutes ? time1 : time2;
    return time1.seconds >= time2.seconds ? time1 : time2;
  }

  static min(time1, time2) {
    if (time1.hours != time2.hours)
      return time1.hours < time2.hours ? time1 : time2;
    if (time1.minutes != time2.minutes)
      return time1.minutes < time2.minutes ? time1 : time2;
    return time1.seconds <= time2.seconds ? time1 : time2;
  }

  copy() {
    return new TimeState(this.hours, this.minutes, this.seconds);
  }
}

const display = document.querySelector("#time");
const displayFlag = document.querySelector("#time-last-flag");
let time = new TimeState();
let timeFlag = new TimeState();
let timeFlags = [];

let timerInterval = null;

function shineDisplay(originalColor, color = "#ffd", elem = display) {
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

function updateDisplay(elem = display, timeState = time) {
  elem.childNodes[1].textContent = String(timeState.hours).padStart(2, "0");
  elem.childNodes[3].textContent =
    ":" + String(timeState.minutes).padStart(2, "0");
  elem.childNodes[5].textContent =
    ":" + String(timeState.seconds).padStart(2, "0");
}

function addSecond() {
  time.add(1);
  timeFlag.add(1);
  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
}

function resumeSwitch() {
  if (timerInterval) return stop();

  shineDisplay("#b3d8f5");
  timerInterval = setInterval(addSecond, 1000);

  document.querySelector("#resume-button").textContent = "Stop";
}

function editTimer(actionCode) {
  const input = String(document.querySelector("#set-time-input").value).split(":");
  const newTime = new TimeState(parseInt(input[0]), parseInt(input[1]), parseInt(input[2]));
  switch (actionCode) {
    case "set":
      time = newTime;
      break;
    case "add":
      time.addObj(newTime);
      timeFlag.addObj(newTime);
      break;
  
    default:
      console.warn("Action code is invalid");
      return;
  }
  updateDisplay()
  updateDisplay(displayFlag, timeFlag)
}

function stop() {
  shineDisplay("#b3d8f5");
  clearInterval(timerInterval);
  timerInterval = null;

  document.querySelector("#resume-button").textContent = "Resume";
}

function reset() {
  if (
    !confirm(
      "ALERTA: Isso irá apagar permanentemente os dados da sessão atual!" +
        "\n\nOK para continuar"
    )
  )
    return;
  stop();
  time.reset();
  timeFlag.reset();
  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
  timeFlags.length = 0;
  document.querySelector("#flags").innerHTML = "";
  document.querySelector("#resume-button").textContent = "Start";
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
    !confirm(
      "ALERTA: Carregar dados salvos irá apagar permanentemente os dados da sessão atual!\n\n" +
        "OK para continuar"
    )
  )
    return;

  const session = getSession(sessionId);

  if (!session) {
    console.warn("No data to load.");
    return;
  }
  console.log("Current session: " + session);

  time = new TimeState(session.time);
  timeFlag = new TimeState(session.timeFlag);
  timeFlags = session.timeFlags.map((elem) => new TimeState(elem));

  document.querySelector("#flags").innerHTML = session.flagsContent;

  updateDisplay();
  updateDisplay(displayFlag, timeFlag);
}
