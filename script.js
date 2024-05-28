const CONTROL_CHARACTER = "@";

function bob_anim(element, duration) {
    window.requestAnimationFrame(() => {
        element.animate(
            [
              {},
              {transform: "scale(1.05) rotate(5deg)"},
              {transform: "scale(1.05) rotate(-5deg)"},
              {},
            ],
            { duration: duration || 150 }
        );
    })
}

function get_word_list(path) {
    return fetch(path)
        .then(res => res.text())
        .then(words => words.split("\n").filter(word => word.trim().length > 0))
        .then(words => words.map(word => word.trim().toUpperCase().split("")));
}

function get_random_word(words) {
    return words[Math.floor(Math.random() * words.length)];
}

function has_won(word) {
    const combined_word = word.reduce((acc, v) => acc + v);
    const guesses = row_state.map(row => row.reduce((acc, v) => acc + v)).filter((_, idx) => idx < answers_submitted)
    return guesses.some(v => v === combined_word);
}

function has_lost() {
    const guesses_left = row_state.length - answers_submitted;
    return guesses_left <= 0;
}

function rerender(word) {
    const input = document.getElementById("input");
    input.innerHTML = row_state_inner_html(word);
    let newest_input_id;
    if (characters_written > 0) {
        newest_input_id = answers_submitted + "-" + (characters_written - 1);
    }
    const maybe_cell = document.getElementById(newest_input_id);
    if (maybe_cell) {
        bob_anim(maybe_cell);
    }
    const result_text = document.getElementById("result");
    const try_again = document.getElementById("try-again");
    if (has_won(word)) {
        result_text.innerText = "u won yippie 😺";
        try_again.innerHTML = "<h1>try again?</h1>"
        try_again.classList.add("visible");
    } else if (has_lost()) {
        result_text.innerText = "you lost! the word was " + word.reduce((acc, v) => acc + v) + " 😿";
        try_again.innerHTML = "<h1>try again?</h1>"
        try_again.classList.add("visible");
    } else {
        const guesses = row_state.length - answers_submitted
        result_text.innerText = `you have ${row_state.length - answers_submitted} guesses left 🐈`
    }
}

function append_keyboard_cells(result, word, words) {
    const keys = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map(v => v.split(""));
    keys[2].unshift("🆑")
    keys[2].push("🆗")
    for (const row of keys) {
        const container = document.createElement("div");
        container.classList.add("row");
        for (const character of row) {
            const cell = document.createElement("span");
            cell.id = "keyboard-" + character;
            cell.innerText = character;
            cell.classList.add("cell");
            if ("🆑🆗".includes(character)) {
                cell.classList.add("special");
            }
            cell.addEventListener("click", (event) => {
                bob_anim(cell);
                input(character, word, words)
            })
            container.appendChild(cell);
        }
        result.appendChild(container);
    }
}

function submitted_row_classes(row, word_not_a_clone) {
    const word = word_not_a_clone.map(ch => ch);
    return row.map((ch, idx) => {
        if (ch === word[idx]) {
            word[idx] = CONTROL_CHARACTER;
            return [ch, "correct"];
        } else {
            return [ch, "wrong"];
        }
    }).map(([ch, cl], idx) => {
        if (cl === "correct") {
            return cl;
        }
        if (word.includes(ch)) {
            const found_index = word.indexOf(ch);
            word[found_index] = CONTROL_CHARACTER;
            return "partial";
        } else {
            return "wrong";
        }
    });
}

function classes_for_submitted_row(row, word) {
    const classes = submitted_row_classes(row, word);
    for (let i = 0; i < row.length; ++i) {
        const kb_cell = document.getElementById("keyboard-" + row[i]);
        if (!kb_cell.classList.contains(classes[i])) {
            kb_cell.classList.add(classes[i]);
            bob_anim(kb_cell, 300);
        }
    }
    return classes;
}

let answers_submitted = 0;
let characters_written = 0;

function submit_answer(word) {
    answers_submitted += 1;
    characters_written = 0;
    rerender(word);
}

function word_exists(word, words) {
    return words.some(w => {
        return w
            .map((ch, idx) => { return word[idx] === ch })
            .reduce((acc, v) => acc && v);
    })
}

function input(key, word, words) {
    if (has_won(word) || has_lost()) {
        return;
    }
    if (key === "BACKSPACE" || key === "🆑") {
        characters_written -= 1;
        if (characters_written <= 0) {
            characters_written = 0;
        }
        row_state[answers_submitted][characters_written] = CONTROL_CHARACTER;
        rerender(word);
        return;
    }
    if (key === "ENTER" || key === "🆗") {
        if (characters_written < 5) {
            return;
        }
        const submitted = row_state[answers_submitted];
        if (!word_exists(submitted, words)) {
            document.querySelector("#result").innerText = "that's not a word 😾";
            return;
        }
        submit_answer(word);
        return;
    }
    if (key.length !== 1 || characters_written >= 5) {
        return;
    }
    if (key.match(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZ]/)) {
        return;
    }
    row_state[answers_submitted][characters_written] = key;
    if (characters_written < 5) {
        characters_written += 1;
    }
    rerender(word);
}

function empty_row() {
    return Array(5).fill(CONTROL_CHARACTER);
}

const row_state = [
    empty_row(),
    empty_row(),
    empty_row(),
    empty_row(),
    empty_row(),
    empty_row(),
]

function row_state_inner_html(word) {
    const result = document.createElement("div");
    for (row_idx in row_state) {
        const row = row_state[row_idx];
        const container = document.createElement("div");
        container.classList.add("row");
        let classes = ["_", "_", "_", "_", "_"];
        if (row_idx < answers_submitted) {
            classes = classes_for_submitted_row(row, word);
        }
        for (cell_idx in row) {
            const character = row[cell_idx];
            const cell = document.createElement("span");
            cell.innerText = character;
            if (character === CONTROL_CHARACTER) {
                cell.classList.add("invisible-text");
            }
            cell.classList.add(classes[cell_idx]);
            cell.classList.add("cell");
            cell.id = row_idx + "-" + cell_idx;
            container.appendChild(cell);
        }
        result.appendChild(container);
    }
    return result.innerHTML;
}


async function main() {
    const words = await get_word_list("words.txt");
    const answers = await get_word_list("answers.txt");
    const word = get_random_word(answers);
    document.addEventListener("keydown", event => input(event.key.toUpperCase(), word, words))
    rerender(word);

    const kb = document.getElementById("keyboard");
    append_keyboard_cells(kb, word, words);
}

main();
