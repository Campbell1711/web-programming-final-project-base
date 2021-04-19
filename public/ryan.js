
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
    if (this.status === 200 && this.response.results.length > 0) {
        let rows = this.response.results;
        for (let i = 0; i < rows.length; ++i) {
            let response = rows[i];
            // Create result div
            let newResult = document.createElement("div");
            newResult.classList.add("result");
            // Title
            let titleElem = document.createElement("p");
            titleElem.classList.add("resulttitle");
            titleElem.innerHTML = `<a href="jurgen/${response.doc_id}"><u>${response.scene_title}</u></a>`;
            newResult.appendChild(titleElem);
            // Author
            let authorElem = document.createElement("p");
            authorElem.classList.add("resultauthor");
            authorElem.innerHTML = `Play: <a href="ryan?query=${response.play_title}&searchtype=author"><u>${response.play_title}</u></a>`;
            newResult.appendChild(authorElem);
            // Snippet
            let snippet = document.createElement("p");
            snippet.innerText = response.snippet;
            newResult.appendChild(snippet);
            // Tags
            let tags = document.createElement("p");
            let innerHTML = "Tags: ";
            if (response.tag_english) {
                innerHTML += `<a href="ryan?query=tag_english&searchtype=tags"><u>tag_english</u></a> `;
            }
            if (response.tag_short) {
                innerHTML += `<a href="ryan?query=tag_short&searchtype=tags"><u>tag_short</u></a> `;
            }
            if (response.tag_med) {
                innerHTML += `<a href="ryan?query=tag_med&searchtype=tags"><u>tag_med</u></a> `;
            }
            if (response.tag_long) {
                innerHTML += `<a href="ryan?query=tag_long&searchtype=tags"><u>tag_long</u></a> `;
            }
            tags.innerHTML = innerHTML;
            newResult.appendChild(tags);
            resultsDiv.appendChild(newResult);
        }
    } else {
        showMore.style.display = "none"; // No more results, or error, hide button
    }
}