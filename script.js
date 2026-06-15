let db = {};
let secretKey = "";
let secretChar = {};
let attempts = 0;
let isGameOver = false;

// Элементы UI
const countLabel = document.getElementById('count-label');
const guessInput = document.getElementById('guess-input');
const checkBtn = document.getElementById('check-btn');
const txtLog = document.getElementById('txt-log');
const actionBtn = document.getElementById('action-btn');

// Загрузка базы данных персонажей
fetch(`characters.json?v=${Date.now()}`)
    .then(response => response.json())
    .then(data => {
        db = data;
        countLabel.textContent = `Загружено персонажей: ${Object.keys(db).length}`;
        startNewGame();
    })
    .catch(err => {
        alert('Ошибка загрузки characters.json! Проверьте, лежит ли он рядом.');
        console.error(err);
    });

function startNewGame() {
    const keys = Object.keys(db);
    secretKey = keys[Math.floor(Math.random() * keys.length)];
    secretChar = db[secretKey];
    attempts = 0;
    isGameOver = false;

    actionBtn.textContent = "Сдаться 🏳️";
    actionBtn.className = "btn-giveup";

    txtLog.textContent = "🆕 Игра началась! Загадан случайный персонаж.\n" + "—".repeat(45) + "\n";
    guessInput.value = "";
    guessInput.focus();
}

function findCharacter(userInput) {
    const val = userInput.trim().toLowerCase();
    if (!val) return null;

    // 1. Точное совпадение
    for (let k in db) {
        let namesList = db[k].имя_ру.split('/').map(n => n.trim().toLowerCase());
        namesList.push(k.toLowerCase());
        if (namesList.includes(val)) return k;
    }

    // 2. Частичное совпадение
    for (let k in db) {
        let namesList = db[k].имя_ру.split('/').map(n => n.trim().toLowerCase());
        if (namesList.some(name => name.includes(val)) || k.toLowerCase().includes(val)) {
            return k;
        }
    }
    return null;
}

function checkGuess() {
    if (isGameOver) return;

    const guessInputVal = guessInput.value;
    guessInput.value = "";

    const matchedKey = findCharacter(guessInputVal);
    if (!matchedKey) {
        alert("Такого персонажа нет в вашей базе данных!");
        return;
    }

    attempts++;
    const guessChar = db[matchedKey];
    const displayName = guessChar.имя_ру.split('/')[0].strip ? guessChar.имя_ру.split('/')[0].trim() : guessChar.имя_ру.split('/')[0];

    let resStr = `Попытка #${attempts}: ${displayName}\n`;

    const fields = [
        ["редкость", "⭐ Редкость"],
        ["элемент", "🔮 Элемент"],
        ["оружие", "⚔️ Оружие"],
        ["регион", "🗺️ Регион"]
    ];

    fields.forEach(([field, label]) => {
        let gVal = guessChar[field];
        let sVal = secretChar[field];
        let gDisplay = field === "редкость" ? `${gVal}★` : gVal;

        if (gVal === sVal) {
            resStr += `  🟢 ${label}: ${gDisplay} (Совпало)\n`;
        } else {
            resStr += `  🔴 ${label}: ${gDisplay} (Не совпало)\n`;
        }
    });

    // Проверка патча
    let gPatch = parseFloat(guessChar["патч"]);
    let sPatch = parseFloat(secretChar["патч"]);

    if (!isNaN(gPatch) && !isNaN(sPatch)) {
        if (gPatch === sPatch) {
            resStr += `  🟢 📅 Патч: ${gPatch} (Совпало)\n`;
        } else if (gPatch < sPatch) {
            resStr += `  🔼 📅 Патч: ${gPatch} (Загаданный вышел ПОЗЖЕ)\n`;
        } else {
            resStr += `  🔽 📅 Пач: ${gPatch} (Загаданный вышел РАНЬШЕ)\n`;
        }
    } else {
        if (guessChar["патч"] === secretChar["патч"]) {
            resStr += `  🟢 📅 Патч: ${guessChar["патч"]} (Совпало)\n`;
        } else {
            resStr += `  🔴 📅 Патч: ${guessChar["патч"]} (Не совпало)\n`;
        }
    }

    resStr += "—".repeat(45) + "\n";

    // Выводим в лог (добавляем наверх или вниз)
    txtLog.textContent += resStr;
    txtLog.scrollTop = txtLog.scrollHeight;

    if (matchedKey === secretKey) {
        isGameOver = true;
        alert(`Победа! 🎉\nВы угадали персонажа ${displayName} за ${attempts} попыток!`);
        actionBtn.textContent = "Сыграть еще раз 🔄";
        actionBtn.className = "btn-restart";
    }
}

function giveUp() {
    if (isGameOver) {
        startNewGame();
        return;
    }
    const secretName = secretChar.имя_ру.split('/')[0].trim();
    txtLog.textContent += `❌ Вы сдались! Был загадан персонаж: ${secretName}\n` + "—".repeat(45) + "\n";
    txtLog.scrollTop = txtLog.scrollHeight;

    isGameOver = true;
    actionBtn.textContent = "Сыграть еще раз 🔄";
    actionBtn.className = "btn-restart";
}

// Слушатели событий
checkBtn.addEventListener('click', checkGuess);
guessInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkGuess(); });
actionBtn.addEventListener('click', () => { if (isGameOver) startNewGame(); else giveUp(); });