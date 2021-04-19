let inputScene = document.getElementById('textScene');
let inputPlay = document.getElementById('play');
let metaWarning = document.getElementById('metaWarning');

let textInput = document.getElementById('text');
let textWarning = document.getElementById('textWarning');

let form = document.getElementById('submitForm');

let metaValid = false;
let textValid = false;

inputScene.addEventListener('input', checkMeta);
inputPlay.addEventListener('input', checkMeta);

function checkMeta() {
    metaValid = inputScene.value && inputPlay.value;
    if (!metaValid) {
        metaWarning.style.display = 'block';
    } else {
        metaWarning.style.display = 'none';
    }
}

textInput.addEventListener('input', checkText);

function checkText() {
    textValid = textInput.value ? true : false;
    if (!textValid) {
        textWarning.style.display = 'block';
    } else {
        textWarning.style.display = 'none';
    }
}

form.addEventListener('submit', function (e) {
    if (metaValid && textValid) {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function (e) {
            console.log('success!');
        })
        xhr.open('POST', '/yuyang');
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(`textScene=${inputScene.value}&play=${inputPlay.value}&text=${textInput.value}`);
    }
})

