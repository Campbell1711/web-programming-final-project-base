let inputTitle = document.getElementById('textTitle')
let inputAuthor = document.getElementById('author')
let inputTags = document.getElementById('tags')

let form = document.getElementById('submitForm')

let titleValid = false;
let authorValid = false;
let tagsValid = false;
let textValid = false;

fnameInput.addEventListener('input', checkName);
lnameInput.addEventListener('input', checkName);