// Установка даты (формат: YYYY-MM-DDTHH:MM:SS)
const endDate = new Date("2026-12-31T00:00:00").getTime();

const timer = setInterval(() => {
  const now = new Date().getTime();
  const diff = endDate - now;

  // Расчет времени
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Вывод значений
  document.getElementById("days").innerText = days < 10 ? "0" + days : days;
  document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
  document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
  document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;

  // Остановка при окончании
  if (diff < 0) {
    clearInterval(timer);
    document.querySelector(".timer").innerHTML = "Время вышло!";
  }
}, 1000);
