let view = document.getElementById("content");
let level = 0;
let question = 0;
let questions;
let level_score = 0;
let game_score = 0;

let sounds = {
    right: new Audio("media/right.mp3"),
    wrong: new Audio("media/wrong.mp3"),
    finish: new Audio("media/finish.mp3"),
    over: new Audio("media/over.mp3"),
}

// escape strings
function escapeHTML(str) {
    let table = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
    }
    for (key in table) {
        str = str.replaceAll(key, table[key]);
    };
    return str;
}
// Templating function
let templates = {};
async function setView(name, values) {
    if (!templates[name]) {
        let response = await fetch(`./views/${name}.html`);
        templates[name] = await response.text();
    };
    replaced = templates[name];
    for (let key in values) {
        replaced = replaced.replaceAll(`{${key}}`, escapeHTML(values[key]));
    }
    view.innerHTML = replaced;
}

// Load questions.json
async function loadQuestions() {
    let response = await fetch("./questions.json");
    return await response.json();
};
loadQuestions().then(json => {
    questions = json;
    displayHomePage();
});

// Views

// Home page
function displayHomePage() {
    setView("home", {
        title: questions.title
    });
    level = 0;
    game_score = 0;
}

// Level start
function displayLevelStart() {
    setView("levelStart", {
        title: questions.levels[level].title,
        image: questions.levels[level].image
    });
    question = 0;
    level_score = 0;
};

// Question
function displayQuestion() {
    let answers = [...questions.levels[level].questions[question].answers];
    let image = questions.levels[level].questions[question].image;
    answers.sort(() => Math.random() - 0.5);
    setView("question", {
        query: questions.levels[level].questions[question].query,
        image: image ? image : "",
        ans1: answers[0],
        ans2: answers[1],
        ans3: answers[2],
        ans4: answers[3],
    });
    updateScore()
};

// Select an answer
function selectAnswer(e) {
    if (e.innerHTML == escapeHTML(questions.levels[level].questions[question].answers[0])) {
        e.classList.add("right");
        level_score += 1;
        sounds.right.play();
    } else {
        e.classList.add("wrong");
        level_score -= 0.5;
        sounds.wrong.play();
    };
    updateScore();
    for (let idx = 0; idx < 4; idx++) {
        const elem = document.getElementById("opt_" + idx);
        elem.removeAttribute("onclick");
    };
    document.getElementById("next_q").classList.remove("hidden");
}

function updateScore() {
    let value = level_score/Math.ceil(questions.levels[level].questions.length / 2)*100
    if (value > 100) {value = 100};
    if (value < 2) {value = 2};
    document.getElementById("score-bar").style.height = `${100-value}%`;
}

// Continue to next question
function nextQuestion() {
    question += 1;
    if (questions.levels[level].questions.length <= question || level_score >= Math.ceil(questions.levels[level].questions.length / 2)) {
        displayLevelEnd();
    } else {
        displayQuestion();
    }
};

function displayLevelEnd() {
    game_score += level_score;
    if (level_score < Math.ceil(questions.levels[level].questions.length / 2)) {
        displayGameEnd(false);
        sounds.over.play();
    } else {
        setView("levelEnd", {
            title: questions.levels[level].title,
        });
    }
};

// Continue to next level
function nextLevel() {
    level += 1;
    if (questions.levels.length <= level) {
        displayGameEnd(true);
        sounds.finish.play();
    } else {
        displayLevelStart();
    }
}

// Game over
function displayGameEnd(finished) {
    let question_count = 0;
    for (level of questions.levels) {
        question_count += level.questions.length;
    }
    let final_score = Math.round(game_score/Math.ceil(question_count / 2)*100);

    let key_name = `${questions.title.replaceAll(" ", "_")}_high_score`;
    let high_score = window.localStorage.getItem(key_name);
    if (high_score === null) {
        high_score = -1
    }
    if (final_score < 0) {
        final_score = 0;
    }
    if (final_score > 100) {
        final_score = 100;
    }
    if (final_score > high_score) {
        window.localStorage.setItem(key_name, final_score);
    }

    setView(finished ? "finish" : "over", {
        title: questions.title,
        score: String(final_score),
        high_score: high_score == -1 ? "" : String(high_score),
    });
}
