const $ = id => document.getElementById(id);

const bpm = $("bpm");
const bpmValue = $("bpmValue");

const delay = $("delay");
const delayValue = $("delayValue");

const patternSelect = $("patternSelect");
const modeSelect = $("modeSelect");

const chordList = $("chordList");
const chordSelect = $("chordSelect");

const currentChord = $("currentChord");
const nextChord = $("nextChord");

const patternDisplay = $("patternDisplay");
const beatLabel = $("beatLabel");

const startBtn = $("startBtn");
const pauseBtn = $("pauseBtn");
const stopBtn = $("stopBtn");

const addChordBtn = $("addChordBtn");
const clearBtn = $("clearBtn");

const countdown = $("countdown");

const feedbackTitle = $("feedbackTitle");
const feedbackText = $("feedbackText");
const feedbackIcon = $("feedbackIcon");

const voiceBtn = $("voiceBtn");
const testVoiceBtn = $("testVoiceBtn");
const voiceStatus = $("voiceStatus");

const micBtn = $("micBtn");
const micStatus = $("micStatus");

const expectedAudioChord =
    $("expectedAudioChord");

const detectedChordEl =
    $("detectedChord");

const confidenceEl =
    $("confidence");

const meterFill =
    $("meterFill");

const audioFeedback =
    $("audioFeedback");


const patterns = {

    DUDU: [
        "D",
        "U",
        "D",
        "U"
    ],

    DUDDU: [
        "D",
        "U",
        "D",
        "D",
        "U"
    ],

    DUUDU: [
        "D",
        "U",
        "U",
        "D",
        "U"
    ],

    DDUUDU: [
        "D",
        "D",
        "U",
        "U",
        "D",
        "U"
    ],

    D_DUDU: [
        "D",
        "-",
        "D",
        "U",
        "D",
        "U"
    ]

};


let chords = [
    "Em",
    "C",
    "G",
    "D"
];

let currentIndex = 0;

let currentPattern = [];

let patternIndex = 0;

let running = false;

let paused = false;

let beatTimer = null;

let transitionTimer = null;


// ==================================================
// SETTINGS
// ==================================================

function updateSettings() {

    bpmValue.textContent =
        bpm.value;

    delayValue.textContent =
        (
            Number(delay.value) /
            1000
        ).toFixed(1) + "s";
}

bpm.addEventListener(
    "input",
    updateSettings
);

delay.addEventListener(
    "input",
    updateSettings
);


// ==================================================
// CHORD LIST
// ==================================================

function renderChords() {

    chordList.innerHTML = "";

    chords.forEach(
        (chord, index) => {

            const chip =
                document.createElement(
                    "div"
                );

            chip.className =
                "chordChip";

            chip.innerHTML =
                `
                <span>
                    ${index + 1}. ${chord}
                </span>

                <button>
                    ×
                </button>
                `;

            chip
                .querySelector("button")
                .onclick = () => {

                    chords.splice(
                        index,
                        1
                    );

                    if (
                        currentIndex >=
                        chords.length
                    ) {

                        currentIndex =
                            Math.max(
                                0,
                                chords.length - 1
                            );
                    }

                    renderChords();

                    updateChordDisplay();
                };

            chordList.appendChild(
                chip
            );
        }
    );

    updateChordDisplay();
}


addChordBtn.onclick = () => {

    chords.push(
        chordSelect.value
    );

    renderChords();
};


clearBtn.onclick = () => {

    stopPractice();

    chords = [];

    renderChords();
};


// ==================================================
// PATTERN
// ==================================================

function getPattern() {

    if (
        patternSelect.value ===
        "random"
    ) {

        const keys =
            Object.keys(patterns);

        const randomKey =
            keys[
                Math.floor(
                    Math.random() *
                    keys.length
                )
            ];

        return [
            ...patterns[randomKey]
        ];
    }

    return [
        ...patterns[
            patternSelect.value
        ]
    ];
}


function renderPattern() {

    patternDisplay.innerHTML = "";

    currentPattern.forEach(
        (stroke, index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "strum";

            if (stroke === "-") {
                div.style.opacity =
                    "0.4";
            }

            div.textContent =
                stroke;

            patternDisplay.appendChild(
                div
            );
        }
    );
}


function highlightStrum(index) {

    const elements =
        document.querySelectorAll(
            ".strum"
        );

    elements.forEach(
        (element, i) => {

            element.classList.toggle(
                "active",
                i === index
            );
        }
    );
}


// ==================================================
// CHORD DISPLAY
// ==================================================

function updateChordDisplay() {

    if (!chords.length) {

        currentChord.textContent =
            "—";

        nextChord.textContent =
            "—";

        expectedAudioChord.textContent =
            "—";

        return;
    }

    currentChord.textContent =
        chords[currentIndex];

    expectedAudioChord.textContent =
        chords[currentIndex];


    if (
        modeSelect.value ===
        "random"
    ) {

        let randomChord;

        do {

            randomChord =
                chords[
                    Math.floor(
                        Math.random() *
                        chords.length
                    )
                ];

        } while (
            chords.length > 1 &&
            randomChord ===
            chords[currentIndex]
        );

        nextChord.textContent =
            randomChord;

    } else {

        nextChord.textContent =
            chords[
                (
                    currentIndex + 1
                ) %
                chords.length
            ];
    }
}


modeSelect.onchange =
    updateChordDisplay;


patternSelect.onchange = () => {

    if (!running) {

        currentPattern =
            getPattern();

        renderPattern();
    }
};


// ==================================================
// VOICE
// ==================================================

let voiceEnabled = true;

let selectedVoice = null;


function loadVoices() {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    const voices =
        speechSynthesis.getVoices();

    selectedVoice =
        voices.find(
            voice =>
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        ) ||
        voices[0] ||
        null;
}


loadVoices();


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;
}


function speak(
    text,
    cancelPrevious = true
) {

    if (
        !voiceEnabled ||
        !("speechSynthesis" in window)
    ) {
        return;
    }

    if (cancelPrevious) {

        speechSynthesis.cancel();
    }

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    utterance.lang =
        "en-US";

    utterance.rate =
        1.35;

    utterance.pitch =
        1;

    utterance.volume =
        1;

    if (selectedVoice) {

        utterance.voice =
            selectedVoice;
    }

    speechSynthesis.speak(
        utterance
    );
}


function speakPattern(
    pattern
) {

    const words =
        pattern.map(
            stroke => {

                if (
                    stroke === "D"
                ) {
                    return "Down";
                }

                if (
                    stroke === "U"
                ) {
                    return "Up";
                }

                return "Rest";
            }
        );

    speak(
        words.join(" "),
        false
    );
}


voiceBtn.onclick = () => {

    voiceEnabled =
        !voiceEnabled;

    if (voiceEnabled) {

        voiceBtn.textContent =
            "Voice ON";

        voiceStatus.textContent =
            "Voice is ON";

    } else {

        voiceBtn.textContent =
            "Voice OFF";

        voiceStatus.textContent =
            "Voice is OFF";

        speechSynthesis.cancel();
    }
};


testVoiceBtn.onclick = () => {

    voiceEnabled = true;

    voiceBtn.textContent =
        "Voice ON";

    voiceStatus.textContent =
        "Voice is ON";

    speak(
        "Guitar coach is working",
        true
    );
};


// ==================================================
// PRACTICE
// ==================================================

function beginChord() {

    if (
        !running ||
        paused ||
        !chords.length
    ) {
        return;
    }


    currentPattern =
        getPattern();

    patternIndex = 0;


    renderPattern();

    updateChordDisplay();


    // Speak chord

    speak(
        chords[currentIndex],
        true
    );


    // Speak pattern

    setTimeout(
        () => {

            if (
                running &&
                !paused
            ) {

                speakPattern(
                    currentPattern
                );
            }

        },
        100
    );


    const beatMs =
        60000 /
        Number(bpm.value);


    highlightStrum(0);

    beatLabel.textContent =
        "Beat 1";


    clearInterval(
        beatTimer
    );


    beatTimer =
        setInterval(
            () => {

                if (
                    !running ||
                    paused
                ) {
                    return;
                }


                patternIndex++;


                if (
                    patternIndex >=
                    currentPattern.length
                ) {

                    clearInterval(
                        beatTimer
                    );

                    highlightStrum(-1);

                    beatLabel.textContent =
                        "Changing...";


                    startTransition();

                    return;
                }


                highlightStrum(
                    patternIndex
                );

                beatLabel.textContent =
                    "Beat " +
                    (
                        patternIndex + 1
                    );
            },
            beatMs
        );
}


function startTransition() {

    const wait =
        Number(delay.value);


    const next =
        nextChord.textContent;


    speak(
        "Next chord " + next,
        true
    );


    if (wait === 0) {

        moveNext();

        return;
    }


    countdown.textContent =
        (
            wait / 1000
        ).toFixed(1) + "s";


    transitionTimer =
        setTimeout(
            () => {

                moveNext();

            },
            wait
        );
}


function moveNext() {

    if (
        !running ||
        paused ||
        !chords.length
    ) {
        return;
    }


    if (
        modeSelect.value ===
        "random"
    ) {

        if (
            chords.length === 1
        ) {

            currentIndex = 0;

        } else {

            let newIndex;

            do {

                newIndex =
                    Math.floor(
                        Math.random() *
                        chords.length
                    );

            } while (
                newIndex ===
                currentIndex
            );

            currentIndex =
                newIndex;
        }

    } else {

        currentIndex =
            (
                currentIndex + 1
            ) %
            chords.length;
    }


    countdown.textContent =
        "Play";


    beginChord();
}


// ==================================================
// START / PAUSE / STOP
// ==================================================

startBtn.onclick = () => {

    if (!chords.length) {

        alert(
            "Add at least one chord."
        );

        return;
    }


    running = true;

    paused = false;

    currentIndex = 0;


    startBtn.disabled =
        true;

    pauseBtn.disabled =
        false;

    stopBtn.disabled =
        false;


    feedbackTitle.textContent =
        "Get Ready";

    feedbackText.textContent =
        "Listen and play the chord.";

    feedbackIcon.textContent =
        "🎸";


    speak(
        "Get ready",
        true
    );


    setTimeout(
        () => {

            if (
                running &&
                !paused
            ) {

                beginChord();
            }

        },
        500
    );
};


pauseBtn.onclick = () => {

    if (!running)
        return;


    paused =
        !paused;


    if (paused) {

        pauseBtn.textContent =
            "▶ Resume";

        clearInterval(
            beatTimer
        );

        clearTimeout(
            transitionTimer
        );

        speechSynthesis.cancel();

        feedbackTitle.textContent =
            "Paused";

    } else {

        pauseBtn.textContent =
            "⏸ Pause";

        feedbackTitle.textContent =
            "Playing";

        beginChord();
    }
};


stopBtn.onclick =
    stopPractice;


function stopPractice() {

    running = false;

    paused = false;


    clearInterval(
        beatTimer
    );

    clearTimeout(
        transitionTimer
    );


    speechSynthesis.cancel();


    startBtn.disabled =
        false;

    pauseBtn.disabled =
        true;

    stopBtn.disabled =
        true;


    pauseBtn.textContent =
        "⏸ Pause";


    currentIndex = 0;


    highlightStrum(-1);


    countdown.textContent =
        "Ready";


    beatLabel.textContent =
        "Ready";


    updateChordDisplay();


    feedbackTitle.textContent =
        "Ready";

    feedbackText.textContent =
        "Press Start Practice.";

    feedbackIcon.textContent =
        "🎸";
}


// ==================================================
// GUITAR CHORD DETECTION
// ==================================================

let audioContext = null;

let analyser = null;

let microphoneStream = null;

let microphoneSource = null;

let audioRunning = false;

let animationFrame = null;


const CHORDS = {

    C: [0, 4, 7],

    D: [2, 6, 9],

    Dm: [2, 5, 9],

    E: [4, 8, 11],

    Em: [4, 7, 11],

    F: [5, 9, 0],

    G: [7, 11, 2],

    A: [9, 1, 4],

    Am: [9, 0, 4],

    G7: [7, 11, 2, 5],

    Em7: [4, 7, 11, 2],

    Am7: [9, 0, 4, 7]
};


function midiFrequency(midi) {

    return 440 *
        Math.pow(
            2,
            (midi - 69) / 12
        );
}


function detectChord() {

    if (!analyser) {
        return null;
    }


    const buffer =
        new Float32Array(
            analyser.fftSize
        );


    analyser.getFloatTimeDomainData(
        buffer
    );


    let energy = 0;


    for (
        let i = 0;
        i < buffer.length;
        i++
    ) {

        energy +=
            buffer[i] *
            buffer[i];
    }


    const rms =
        Math.sqrt(
            energy /
            buffer.length
        );


    if (rms < 0.015) {

        return {
            chord: null,
            confidence: 0
        };
    }


    const spectrum =
        new Float32Array(
            analyser.frequencyBinCount
        );


    analyser.getFloatFrequencyData(
        spectrum
    );


    const pitchEnergy =
        new Array(12).fill(0);


    const sampleRate =
        audioContext.sampleRate;


    const binSize =
        sampleRate /
        analyser.fftSize;


    for (
        let midi = 28;
        midi <= 76;
        midi++
    ) {

        const frequency =
            midiFrequency(midi);


        const bin =
            Math.round(
                frequency /
                binSize
            );


        if (
            bin < 0 ||
            bin >= spectrum.length
        ) {
            continue;
        }


        let value = -120;


        for (
            let i = -2;
            i <= 2;
            i++
        ) {

            if (
                bin + i >= 0 &&
                bin + i <
                spectrum.length
            ) {

                value =
                    Math.max(
                        value,
                        spectrum[bin + i]
                    );
            }
        }


        const energyValue =
            Math.pow(
                10,
                value / 20
            );


        const pitchClass =
            (
                midi % 12 +
                12
            ) % 12;


        pitchEnergy[pitchClass] +=
            energyValue;
    }


    const max =
        Math.max(
            ...pitchEnergy
        );


    if (max <= 0) {

        return {
            chord: null,
            confidence: 0
        };
    }


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        pitchEnergy[i] /=
            max;
    }


    let bestChord = null;

    let bestScore = 0;


    for (
        const [
            chord,
            notes
        ]
        of Object.entries(CHORDS)
    ) {

        let score = 0;

        let nonChord = 0;


        for (
            let i = 0;
            i < 12;
            i++
        ) {

            if (
                notes.includes(i)
            ) {

                score +=
                    pitchEnergy[i];

            } else {

                nonChord +=
                    pitchEnergy[i];
            }
        }


        const finalScore =
            score /
            (
                notes.length +
                nonChord * 0.5
            );


        if (
            finalScore >
            bestScore
        ) {

            bestScore =
                finalScore;

            bestChord =
                chord;
        }
    }


    if (
        bestScore < 0.35
    ) {

        return {
            chord: null,
            confidence: bestScore
        };
    }


    return {
        chord: bestChord,
        confidence:
            Math.min(
                1,
                bestScore
            )
    };
}


// ==================================================
// MICROPHONE
// ==================================================

async function enableMic() {

    try {

        microphoneStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    audio: {

                        echoCancellation:
                            false,

                        noiseSuppression:
                            false,

                        autoGainControl:
                            false,

                        channelCount:
                            1
                    }
                });


        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


        analyser =
            audioContext
                .createAnalyser();


        analyser.fftSize =
            4096;


        analyser.smoothingTimeConstant =
            0.05;


        microphoneSource =
            audioContext
                .createMediaStreamSource(
                    microphoneStream
                );


        microphoneSource.connect(
            analyser
        );


        audioRunning = true;


        micBtn.textContent =
            "🎤 Microphone ON";

        micStatus.textContent =
            "Listening to guitar...";


        audioFeedback.textContent =
            "Play a chord.";


        listenToGuitar();


    } catch (error) {

        console.error(error);


        micStatus.textContent =
            "Microphone permission denied.";


        audioFeedback.textContent =
            "Allow microphone access and try again.";
    }
}


function listenToGuitar() {

    if (
        !audioRunning
    ) {
        return;
    }


    const result =
        detectChord();


    if (result) {

        const percent =
            Math.round(
                result.confidence *
                100
            );


        confidenceEl.textContent =
            percent + "%";


        meterFill.style.width =
            percent + "%";


        if (result.chord) {

            detectedChordEl.textContent =
                result.chord;


            const expected =
                chords.length
                    ? chords[currentIndex]
                    : null;


            if (
                expected &&
                result.chord ===
                expected
            ) {

                audioFeedback.textContent =
                    "✓ Correct! " +
                    result.chord;

                audioFeedback.style.color =
                    "#00d084";

            } else if (
                expected
            ) {

                audioFeedback.textContent =
                    "Try " +
                    expected +
                    " — detected " +
                    result.chord;

                audioFeedback.style.color =
                    "#ff5c5c";
            }
        }
    }


    animationFrame =
        requestAnimationFrame(
            listenToGuitar
        );
}


function disableMic() {

    audioRunning =
        false;


    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );
    }


    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );
    }


    if (audioContext) {

        audioContext.close();
    }


    microphoneStream = null;

    microphoneSource = null;

    analyser = null;

    audioContext = null;


    micBtn.textContent =
        "Enable Microphone";

    micStatus.textContent =
        "Microphone OFF";


    detectedChordEl.textContent =
        "—";

    confidenceEl.textContent =
        "0%";

    meterFill.style.width =
        "0%";


    audioFeedback.textContent =
        "Enable microphone and play your guitar.";
}


micBtn.onclick = () => {

    if (audioRunning) {

        disableMic();

    } else {

        enableMic();
    }
};


// ==================================================
// INITIALIZE
// ==================================================

updateSettings();

currentPattern =
    getPattern();

renderPattern();

renderChords();

updateChordDisplay();