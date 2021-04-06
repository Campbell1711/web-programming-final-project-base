
// Fill in query and search type from URL
let queryPath = new URLSearchParams(window.location.search);
let queryFile = queryPath.get('file');

let docTextContainer = document.getElementById('docTextContainer');
let docTagsContainer = document.getElementById('docTagsContainer');
let titleText = document.getElementById('title');
let authorText = document.getElementById('author');

requestFile()

function requestFile() {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", responseHandler);
    xhr.responseType = "json";
    xhr.open("GET", "/jurgen?getjson=true&" + queryPath.toString());
    xhr.send();
}

function responseHandler() {
    if (this.status === 200 && this.response.has) {
        let res = this.response;
        titleText.innerHTML = res.title;
        authorText.innerHTML = res.author;
        let content = res.content;
        for (let i = 0; i < content.length; ++i) {
            docTextContainer.innerHTML += `<p>${content[i]}</p>`;
        }
    }
}