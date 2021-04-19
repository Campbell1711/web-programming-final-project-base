
// Fill in query and search type from URL
let queryParams = new URLSearchParams(window.location.search);
let queryText = queryParams.get("query");
let searchType = queryParams.get("searchtype");
if (queryText) {
    document.getElementById("query").value = queryText;
}
if (searchType) {
    document.getElementById("searchtype").value = searchType;
}

let resultsDiv = document.getElementById("results"); // Div containing each search result
let showMore = document.getElementById("showmore"); // Button to show more search results
let queryposition = 0;
// Handle fetching more documents upon click of Show More button
showMore.addEventListener("click", requestMoreResults);

// Make inital request for first results
requestMoreResults();

// Makes request for more results
function requestMoreResults() {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", responseHandler);
    xhr.responseType = "json";
    queryParams.set("queryposition", (queryposition++).toString());
    xhr.open("GET", "/ryan?" + queryParams.toString());
    xhr.send();
}

// Handle display of fetched documents on click of "Show More" button
function responseHandler() {
    if (this.status === 200 && this.response.length > 0) {
        for (let i = 0; i < this.response.length; ++i) {
            let response = this.response[i];
            console.log(response);
            continue;
            // Create result div
            let newResult = document.createElement("div");
            newResult.classList.add("result");
            // Title
            let titleElem = document.createElement("p");
            titleElem.classList.add("resulttitle");
            titleElem.innerHTML = `<a href="${response.docanchor}"><u>${response.title}</u></a>`;
            newResult.appendChild(titleElem);
            // Author
            let authorElem = document.createElement("p");
            authorElem.classList.add("resultauthor");
            authorElem.innerHTML = `Author: <a href="ryan?query=${response.author}&searchtype=author"><u>${response.author}</u></a>`;
            newResult.appendChild(authorElem);
            // Snippet
            let snippet = document.createElement("p");
            snippet.innerText = response.snippet;
            newResult.appendChild(snippet);
            // Tags
            if (response.tags.length > 0) {
                let tags = document.createElement("p");
                let innerHTML = "Tags: ";
                for (let i = 0; i < response.tags.length - 1; ++i) {
                    innerHTML += `<a href="ryan?query=${response.tags[i]}&searchtype=tags"><u>${response.tags[i]}</u></a>, `;
                }
                innerHTML += `<a href="ryan?query=${response.tags[response.tags.length - 1]}&searchtype=tags"><u>${response.tags[response.tags.length - 1]}</u></a>`;
                tags.innerHTML = innerHTML;
                newResult.appendChild(tags);
            }
            resultsDiv.appendChild(newResult);
        }
    } else {
        showMore.style.display = "none"; // No more results, or error, hide button
    }
}