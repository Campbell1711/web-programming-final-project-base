let inputTitle = document.getElementById('textTitle')
let inputAuthor = document.getElementById('author')
let inputTags = document.getElementById('tags')
let metaWarning = document.getElementById('metaWarning')

let textInput = document.getElementById('text')
let textWarning = document.getElementById('textWarning')

let form = document.getElementById('submitForm')

let metaValid = false;
let textValid = false;

inputTitle.addEventListener('input', checkMeta);
inputAuthor.addEventListener('input', checkMeta);
inputTags.addEventListener('input', checkMeta);

function checkMeta() {
    metaValid = inputTitle.value && (inputAuthor.value && inputTags.value)
    if (!metaValid) {
        metaWarning.style.display = 'block'
    } else {
        metaWarning.style.display = 'none'
    }
}

textInput.addEventListener('input', checkText);

function checkText() {
    textValid = textInput.value ? true : false;
    if (!textValid) {
        textWarning.style.display = 'block'
    } else {
        textWarning.style.display = 'none'
    }
}

form.addEventListener('submit', function (e) {
    if (!(metaValid && textValid)) {
        e.preventDefault();
    }
    else {
        let formData = new FormData(form)
        let xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function (e) {
            console.log('success!')
        })
        xhr.open('POST', '/yuyang');
        xhr.send(formData)
    }
})

