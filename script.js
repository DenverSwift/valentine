const paperStack = document.getElementById("paper-stack");
const continueBar = document.getElementById("continue-bar");
const continueBtn = document.getElementById("continue-btn");
const restartBtn = document.getElementById("restart-btn");

const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("sfx-click");
const softSound = document.getElementById("sfx-soft");
const yesSound = document.getElementById("sfx-yes");
const musicToggle = document.getElementById("music-toggle");
const musicLabel = musicToggle ? musicToggle.querySelector(".music-label") : null;

let envelopeOpened = false;
let currentStep = 1;
let isSwapping = false;
let musicManual = false;

const initialSheets = paperStack ? Array.from(paperStack.querySelectorAll(".paper-sheet")) : [];
const totalSheets = initialSheets.length;

const setMusicState = (isOn) => {
    if (musicToggle) {
        musicToggle.classList.toggle("is-on", isOn);
        musicToggle.setAttribute("aria-pressed", String(isOn));
    }
    if (musicLabel) {
        musicLabel.textContent = isOn ? "Turn music off" : "Turn music on";
    }
};

const playMusic = () => {
    if (!bgMusic) return;
    bgMusic.volume = 0.35;
    const result = bgMusic.play();
    if (result && typeof result.then === "function") {
        result
            .then(() => setMusicState(true))
            .catch(() => {
                setMusicState(false);
                setTimeout(() => {
                    if (!bgMusic.paused) return;
                    const retry = bgMusic.play();
                    if (retry && typeof retry.then === "function") {
                        retry.then(() => setMusicState(true)).catch(() => setMusicState(false));
                    }
                }, 250);
            });
    } else {
        setMusicState(!bgMusic.paused);
    }
};

const pauseMusic = () => {
    if (!bgMusic) return;
    bgMusic.pause();
    setMusicState(false);
};

const unlockAudio = () => {
    if (musicManual) return;
    playMusic();
};

document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

if (musicToggle) {
    setMusicState(false);
    musicToggle.addEventListener("click", () => {
        musicManual = true;
        if (!bgMusic) return;
        if (bgMusic.paused) {
            playMusic();
        } else {
            pauseMusic();
        }
    });
}

const playSound = (audio) => {
    if (!audio) return;
    audio.volume = 0.35;
    audio.currentTime = 0;
    const result = audio.play();
    if (result && typeof result.catch === "function") {
        result.catch(() => {});
    }
};

const refreshStack = () => {
    if (!paperStack) return;
    const sheets = Array.from(paperStack.children);
    const count = sheets.length;

    sheets.forEach((sheet, index) => {
        sheet.style.zIndex = `${count - index}`;
        sheet.style.setProperty("--offset", `${index * 8}px`);
        sheet.style.setProperty("--scale", `${(1 - index * 0.02).toFixed(2)}`);
        sheet.style.opacity = `${Math.max(0.35, 1 - index * 0.08).toFixed(2)}`;
        sheet.classList.toggle("is-top", index === 0);
    });

};

const updateStackScale = () => {
    if (!paperStack) return;
    paperStack.style.setProperty("--stack-scale", "1");
    const rect = paperStack.getBoundingClientRect();
    const maxWidth = Math.max(320, window.innerWidth - 40);
    const maxHeight = Math.max(320, window.innerHeight - 140);
    const scale = Math.min(maxWidth / rect.width, maxHeight / rect.height, 1);
    paperStack.style.setProperty("--stack-scale", scale.toFixed(3));
};

const updateProgress = () => {
    if (continueBtn) {
        continueBtn.hidden = !envelopeOpened || currentStep >= totalSheets;
    }

    if (restartBtn) {
        restartBtn.hidden = !envelopeOpened || currentStep < totalSheets || !isAccepted;
    }

    if (continueBar) {
        continueBar.classList.toggle("is-hidden", !envelopeOpened);
    }
};

const envelope = document.getElementById("envelope");
if (envelope) {
    const openEnvelope = () => {
        if (envelopeOpened) return;
        envelopeOpened = true;
        envelope.classList.add("is-open");

        if (paperStack) {
            paperStack.hidden = false;
            requestAnimationFrame(() => {
                paperStack.classList.add("is-revealed");
                updateStackScale();
                refreshStack();
            });
        }

        updateProgress();
        playSound(softSound);
    };

    envelope.addEventListener("click", openEnvelope);
    envelope.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openEnvelope();
        }
    });
}

const swapTopSheet = () => {
    if (!envelopeOpened || !paperStack || isSwapping) return;
    if (currentStep >= totalSheets) return;

    const topSheet = paperStack.firstElementChild;
    if (!topSheet) return;

    isSwapping = true;
    topSheet.classList.add("is-swap-out");

    const onAnimationEnd = () => {
        topSheet.classList.remove("is-swap-out");
        paperStack.appendChild(topSheet);
        refreshStack();
        if (currentStep === 2) {
            resetLoveCredits();
        }
        isSwapping = false;
    };

    topSheet.addEventListener("animationend", onAnimationEnd, { once: true });
    currentStep += 1;
    updateProgress();
};

if (continueBtn) {
    continueBtn.addEventListener("click", () => {
        playSound(clickSound);
        swapTopSheet();
    });
}

if (restartBtn) {
    restartBtn.addEventListener("click", () => {
        if (!paperStack) return;
        initialSheets.forEach((sheet) => paperStack.appendChild(sheet));
        currentStep = 1;
        refreshStack();
        updateProgress();
        resetQuiz();
        resetLoveCredits();
        isAccepted = false;
        if (valentinePrompt) {
            valentinePrompt.hidden = false;
            valentinePrompt.textContent = "Will you be my valentine?";
        }
        if (valentineButtons) {
            valentineButtons.hidden = false;
            if (yesBtn) yesBtn.style.transform = "";
            if (noBtn) {
                noBtn.style.transform = "";
                noBtn.classList.remove("is-broken");
                noBtn.disabled = false;
            }
        }
        if (yesInline) {
            yesInline.hidden = true;
        }
        if (valentineStage) {
            valentineStage.hidden = false;
            valentineStage.style.display = "grid";
        }
        noCount = 0;
        setValentineStage(0);
        playSound(softSound);
    });
}

updateProgress();

window.addEventListener("resize", () => {
    updateStackScale();
    refreshStack();
});

const loveReasonButtons = Array.from(document.querySelectorAll(".love-reason-btn"));
const loveReasonButtonsWrap = document.getElementById("love-reason-buttons");
const loveMoreLine = document.getElementById("love-more-line");
const loveMoreTrigger = document.getElementById("love-more-trigger");
const loveCreditsViewport = document.getElementById("love-credits-viewport");
const loveCreditsTrack = document.getElementById("love-credits-track");
const loveCreditsList = document.getElementById("love-credits-list");
const loveCreditsListClone = document.getElementById("love-credits-list-clone");
const loveRevealText = document.getElementById("love-reveal-text");
const loveMediaGrid = document.getElementById("love-media-grid");
const lovePhotoMedia = document.getElementById("love-photo-media");

const LOVE_REASONS = [
    "I love the way you smile",
    "I love how your eyes shine when you're happy",
    "I love the sound of your laugh",
    "I love how you make ordinary days feel special",
    "I love how safe I feel with you",
    "I love the warmth of your hugs",
    "I love the way you look at me",
    "I love how you understand me without words",
    "I love your kindness",
    "I love your honesty",

    "I love your voice",
    "I love how caring you are",
    "I love how you support me",
    "I love your sense of humor",
    "I love how beautiful you are",
    "I love how you make me want to be better",
    "I love your patience",
    "I love how you listen to me",
    "I love your little habits",
    "I love the way you say my name",

    "I love your tenderness",
    "I love how you calm me down",
    "I love your energy",
    "I love how you get excited about things",
    "I love your style",
    "I love how smart you are",
    "I love how passionate you are",
    "I love how you care about others",
    "I love how genuine you are",
    "I love how you trust me",

    "I love how you tease me",
    "I love how playful you are",
    "I love how you make me laugh",
    "I love how you hold my hand",
    "I love your little looks",
    "I love how affectionate you are",
    "I love how you believe in me",
    "I love your positivity",
    "I love how you light up a room",
    "I love your curiosity",

    "I love how sweet you are",
    "I love your confidence",
    "I love how you comfort me",
    "I love your softness",
    "I love how thoughtful you are",
    "I love how you remember small details",
    "I love your sincerity",
    "I love how warm your heart is",
    "I love your hugs from behind",
    "I love how you surprise me",

    "I love how you motivate me",
    "I love how you look when you're sleepy",
    "I love your morning voice",
    "I love how you say 'I miss you'",
    "I love how you make silence comfortable",
    "I love your loyalty",
    "I love how you stay by my side",
    "I love how you forgive",
    "I love how you care about us",
    "I love your romantic side",

    "I love how you make me feel loved",
    "I love how you trust our future",
    "I love how you inspire me",
    "I love your uniqueness",
    "I love how gentle you are",
    "I love how strong you are",
    "I love your sincerity when you talk about feelings",
    "I love how you look when you're focused",
    "I love how cute you are when you're shy",
    "I love how you react to surprises",

    "I love how you celebrate little things",
    "I love how you make memories with me",
    "I love your loyalty to people you love",
    "I love how you look at the world",
    "I love your dreams",
    "I love how you share them with me",
    "I love how you make plans with me",
    "I love how you say goodnight",
    "I love how you say good morning",
    "I love how you miss me",

    "I love how you care about my mood",
    "I love how you make me feel special",
    "I love your tenderness when you touch me",
    "I love how you laugh at my jokes",
    "I love how you worry about me",
    "I love how you check if I'm okay",
    "I love your soft heart",
    "I love how you brighten my darkest days",
    "I love how you stay real",
    "I love how you make love feel easy",

    "I love how you accept me",
    "I love how you never give up on us",
    "I love how you make time stop when I'm with you",
    "I love how you make me feel at home",
    "I love how lucky I feel because of you",
    "I love how my world is better with you in it",
    "I love you for everything you are",
    "I love you for everything you do",
    "I love every moment we spend together",
    "I love you simply because you are you"
];

const setActiveLoveReason = (button, withSound = false) => {
    if (!button) return;

    loveReasonButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    const photo = button.dataset.photo;
    if (lovePhotoMedia && photo) {
        lovePhotoMedia.src = photo;
        lovePhotoMedia.alt = button.textContent ? `${button.textContent} photo` : "Her photo";
    }

    if (withSound) {
        playSound(clickSound);
    }
};

const populateLoveCredits = () => {
    if (!loveCreditsList || !loveCreditsListClone) return;
    if (loveCreditsList.children.length > 0 || loveCreditsListClone.children.length > 0) return;

    const fillList = (list) => {
        LOVE_REASONS.forEach((reason) => {
            const item = document.createElement("li");
            item.className = "love-credits-item";
            item.textContent = reason;
            list.appendChild(item);
        });
    };

    fillList(loveCreditsList);
    fillList(loveCreditsListClone);
};

const resetLoveCredits = () => {
    if (loveReasonButtonsWrap) loveReasonButtonsWrap.hidden = false;
    if (loveMoreLine) loveMoreLine.hidden = false;
    if (loveCreditsViewport) loveCreditsViewport.hidden = true;
    if (loveRevealText) loveRevealText.hidden = true;
    if (loveMediaGrid) loveMediaGrid.hidden = false;
    if (loveCreditsTrack) {
        loveCreditsTrack.classList.remove("is-running");
    }

    const defaultReason = loveReasonButtons.find((button) => button.classList.contains("is-active")) || loveReasonButtons[0];
    if (defaultReason) {
        setActiveLoveReason(defaultReason, false);
    }
};

const startLoveCredits = () => {
    populateLoveCredits();
    if (loveReasonButtonsWrap) loveReasonButtonsWrap.hidden = true;
    if (loveMoreLine) loveMoreLine.hidden = true;
    if (loveCreditsViewport) loveCreditsViewport.hidden = false;
    if (loveRevealText) loveRevealText.hidden = false;
    if (loveMediaGrid) loveMediaGrid.hidden = true;

    if (loveCreditsTrack) {
        loveCreditsTrack.classList.remove("is-running");
        void loveCreditsTrack.offsetWidth;
        loveCreditsTrack.classList.add("is-running");
    }
};

loveReasonButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setActiveLoveReason(button, true);
    });
});

if (loveMoreTrigger) {
    loveMoreTrigger.addEventListener("click", () => {
        startLoveCredits();
        playSound(clickSound);
    });

    loveMoreTrigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            startLoveCredits();
            playSound(clickSound);
        }
    });
}

resetLoveCredits();

const timerGrid = document.querySelector(".timer-grid");
if (timerGrid) {
    const startValue = timerGrid.getAttribute("data-start");
    let startDate = startValue ? new Date(startValue) : new Date();

    if (Number.isNaN(startDate.getTime())) {
        startDate = new Date();
    }

    const monthsEl = document.getElementById("months");
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    const getTimeData = (start) => {
        const now = new Date();
        let months =
            (now.getFullYear() - start.getFullYear()) * 12 +
            (now.getMonth() - start.getMonth());

        if (now.getDate() < start.getDate()) {
            months -= 1;
        }

        const afterMonths = new Date(start);
        afterMonths.setMonth(start.getMonth() + months);

        const diff = now - afterMonths;

        return {
            months,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60)
        };
    };

    const updateTimer = () => {
        if (!monthsEl || !daysEl || !hoursEl || !minutesEl || !secondsEl) return;

        const t = getTimeData(startDate);
        monthsEl.textContent = t.months;
        daysEl.textContent = String(t.days).padStart(2, "0");
        hoursEl.textContent = String(t.hours).padStart(2, "0");
        minutesEl.textContent = String(t.minutes).padStart(2, "0");
        secondsEl.textContent = String(t.seconds).padStart(2, "0");
    };

    updateTimer();
    setInterval(updateTimer, 1000);
}

const quizCards = Array.from(document.querySelectorAll(".quiz-card"));
const quizResult = document.getElementById("quiz-result");
const quizResultScore = document.getElementById("quiz-result-score");
const quizResultText = document.getElementById("quiz-result-text");
let quizIndex = 0;
const quizAnswers = {};

const getQuizResultMessage = (matches) => {
    if (matches === 5) {
        return "You're literally reading my mind. We're basically one whole \u2764\uFE0F";
    }
    if (matches === 4) {
        return "We know each other like the back of our hands \uD83D\uDC8B";
    }
    if (matches === 3) {
        return "We still have something in common, no need to copy each other in everything \uD83D\uDE09";
    }
    if (matches === 2) {
        return "Miss Unpredictable - that's so you \uD83D\uDE0A";
    }
    if (matches === 1) {
        return "Cute chaos, premium edition \uD83E\uDD79";
    }
    return "How??";
};

const completeQuiz = () => {
    const total = quizCards.length;
    const matches = Object.values(quizAnswers).filter(Boolean).length;

    quizCards.forEach((card) => {
        card.classList.remove("is-active");
        card.removeAttribute("data-locked");
    });

    if (quizResultScore) {
        quizResultScore.textContent = `You matched ${matches} out of ${total} answers`;
    }

    if (quizResultText) {
        quizResultText.textContent = getQuizResultMessage(matches);
    }

    if (quizResult) {
        quizResult.hidden = false;
    }
};

const resetQuiz = () => {
    Object.keys(quizAnswers).forEach((key) => delete quizAnswers[key]);

    quizCards.forEach((card) => {
        card.classList.remove("is-active");
        card.removeAttribute("data-locked");
        card.querySelectorAll(".quiz-option").forEach((option) => option.classList.remove("is-selected"));
    });

    if (quizResult) {
        quizResult.hidden = true;
    }

    quizIndex = 0;
    if (quizCards[0]) {
        quizCards[0].classList.add("is-active");
    }
};

const advanceQuiz = () => {
    if (quizIndex >= quizCards.length - 1) {
        completeQuiz();
        return;
    }

    quizIndex += 1;
    quizCards.forEach((card, index) => {
        card.classList.toggle("is-active", index === quizIndex);
        card.removeAttribute("data-locked");
    });
};

resetQuiz();

const quizGroups = document.querySelectorAll(".quiz-options");
quizGroups.forEach((group) => {
    group.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const card = group.closest(".quiz-card");
        if (!card || !card.classList.contains("is-active")) return;
        if (card.dataset.locked === "true") return;

        group.querySelectorAll(".quiz-option").forEach((option) => {
            option.classList.remove("is-selected");
        });

        button.classList.add("is-selected");
        card.dataset.locked = "true";
        const questionKey = group.dataset.question || `q${quizIndex + 1}`;
        quizAnswers[questionKey] = button.dataset.match === "true";
        playSound(clickSound);

        setTimeout(() => {
            advanceQuiz();
        }, 280);
    });
});

const valentinePrompt = document.getElementById("valentine-prompt");
const yesBtn = document.getElementById("btn-yes");
const noBtn = document.getElementById("btn-no");
const valentineButtons = document.getElementById("valentine-buttons");
const valentineStage = document.getElementById("valentine-stage");
const valentineStageImage = document.getElementById("valentine-stage-image");
const yesInline = document.getElementById("yes-inline");

const VALENTINE_STAGES = [
    "assets/gifs/stage1.gif",
    "assets/gifs/stage2.gif",
    "assets/gifs/stage3.gif",
    "assets/gifs/stage4.gif"
];

const noMessages = [
    "Are you sure?",
    "Why not?",
    "That's rude.",
    "Ok, I will stop asking you to say no."
];

let noCount = 0;
let isAccepted = false;

const setValentineStage = (count) => {
    if (!valentineStageImage) return;
    const stageIndex = Math.min(Math.max(count, 0), VALENTINE_STAGES.length - 1);
    valentineStageImage.src = VALENTINE_STAGES[stageIndex];
};

if (noBtn) {
    noBtn.addEventListener("click", () => {
        if (isAccepted) return;
        if (noBtn.disabled) return;
        noCount += 1;
        playSound(clickSound);

        const messageIndex = Math.min(noCount, noMessages.length - 1);
        if (valentinePrompt) valentinePrompt.textContent = noMessages[messageIndex];

        if (yesBtn) {
            const yesScale = 1 + Math.min(noCount * 0.08, 0.28);
            yesBtn.style.transform = `scale(${yesScale})`;
        }

        const noScale = Math.max(0.82, 1 - noCount * 0.08);
        noBtn.style.transform = `scale(${noScale})`;
        setValentineStage(noCount);
        if (valentineStage) {
            valentineStage.hidden = false;
            valentineStage.style.display = "grid";
        }

        if (noCount >= 3) {
            noBtn.classList.add("is-broken");
            noBtn.disabled = true;
            playSound(softSound);
        }
    });
}

if (yesBtn) {
    yesBtn.addEventListener("click", () => {
        if (isAccepted) return;
        isAccepted = true;
        playSound(yesSound);
        if (valentinePrompt) {
            valentinePrompt.hidden = true;
        }
        if (valentineButtons) {
            valentineButtons.hidden = true;
        }
        if (valentineStage) {
            valentineStage.hidden = true;
            valentineStage.style.display = "none";
        }
        if (yesInline) {
            yesInline.hidden = false;
        }
        updateProgress();
    });
}

setValentineStage(0);
if (valentineStage) {
    valentineStage.hidden = false;
    valentineStage.style.display = "grid";
}
