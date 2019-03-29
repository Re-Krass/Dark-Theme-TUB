// must be run after all components where created (which has collapsible class assigned)
function setup_collapse_components() {
    var collapsible_elements = document.getElementsByClassName("collapsible");
    for (let collapsible_element of collapsible_elements) {
        // hide the line content
        collapsible_element.children[1].style.display = "none";
        collapsible_element.addEventListener("click", function () {
            var collapsible_content = this.children[1];

            if (!collapsible_content) {
                return;
            }

            console.log(this.firstElementChild);
            this.firstElementChild.classList.toggle("collapsible--active");
            console.log(this.children);
            if (collapsible_content.style.display === "flex") {
                collapsible_content.style.display = "none";
            } else {
                collapsible_content.style.display = "flex";
            }
        });
    }
}

// FIXME: todos-item-container doesnt get created
function create_todo_file(file) {
    var file_elem = htmlToElement(
        `
        <div class="window__file">
            <span class="window__file__icon">
                <i class="material-icons">folder</i>
            </span>
            ${file}
        </div>
        `
    )
    return file_elem
}

function create_todo_item_container() {
    var container = htmlToElement(
        `
        <div class="window__item-container">
            <!-- todo items get inserted here via javascript -->
        </div>
    `
    )
    return container
}

// creates a todo item from given json object
function create_todo_item(todo, line_contents_obj) {
    // use the modifier if its an empty message
    var modifier = "";
    // if the message if empty output a warning message to the user
    if (!todo["text"]) {
        todo["text"] = "&#60;no message provided&#62;";
        modifier = "window__item__message--empty";
    }
    var todo_lineContent_items = "";
    var split_file_string = todo["file"].split(".");
    var type = split_file_string[split_file_string.length - 1];
    for (let line of line_contents_obj["line_content"]) {
        var line_number = line[0];
        var line_content = line[1];
        var current_modifier = "";
        if (todo["line"] == line_number) {
            current_modifier = "script-box__item__line-number--current";
        }
        todo_lineContent_items += `
      <div class="script-box__item">
        <div class="script-box__item__line-number ${current_modifier}">${line_number}</div>
        <div class="script-box__item__content"><pre><code class="${type}">${line_content}</pre></code></div>
      </div>
    `;
    }
    var todo_lineContent = `<div class="window__line-content">${todo_lineContent_items}</div>`;
    var todo_elem = htmlToElement(
        `
        <div class="collapsible">
            <div class="window__item">
                <div class='window__item__line'>line ${todo["line"]}</div>
                <div class='window__item__type'>${todo["tag"]}</div>
                <div class='window__item__message ${modifier}'>${todo["text"]}</div>
            </div>
            <div class="window__line-content">
              <div class="script-box">
                <div class="script-box__item-container">
                  ${todo_lineContent}
                </div>
              </div>
            </div>
        </div>
        `
    );
    return todo_elem;
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 * src: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 */
function htmlToElement(html) {
    var template = document.createElement("template");
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function getLastModifiedDate(fileName) {
    return fetch(fileName, {
        method: "HEAD"
    }).then(response => {
        return response.headers.get('last-modified');
    })
}

function getJsonContentFromServer(fileName) {
    return fetch(fileName).then(data => {
        return data.json();
    });
}

// src: https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function create_todos(data, lines) {
    var item_container = document.getElementById("todos-item-container");
    var todo_window = document.getElementById("todo-window");
    var todo_footer = todo_window.lastElementChild;
    // holds the caption for each file
    var item_container = {};
    for (let todo of data) {
        var file_name = todo["file"];
        // check if the container for the todo items with the desired file already exists
        if (!item_container.hasOwnProperty(file_name)) {
            // create new container
            var file_elem = create_todo_file(file_name);
            var container_elem = create_todo_item_container();
            item_container[file_name] = container_elem;
            todo_window.insertBefore(container_elem, todo_footer);
            todo_window.insertBefore(file_elem, container_elem);
        }

        // get the container reference
        var container = item_container[file_name];

        //create new todo item
        var query_string = `${todo["file"]} ${todo["line"]}`;
        var lines_content = lines[query_string];
        if (!lines_content) {
            alert("line_content not found!\nPlease run manually the script <todos_lines_extraction.py> to extract lines and upload the file!\n(todos.json is newer than todos_line_extractions.json)")
            console.error("line_content not found!\n Please run manually the script to extract lines and upload the file!\n(todos.json is newer than todos_line_extractions.json)")
        }
        var todo_elem = create_todo_item(todo, lines_content);
        // insert the new created todo element into the container
        container.appendChild(todo_elem);
    }
}

getJsonContentFromServer("todos.json")
    .then(data => {
        console.log(data);
        getJsonContentFromServer("todos_line_extractions.json").then(lines => {
            // create todos
            create_todos(data, lines);
            // apply collabsible functionality
            setup_collapse_components();
            // apply syntax highlighting
            hljs.initHighlightingOnLoad();
        });
    })
    .catch(error => console.error(error));

getLastModifiedDate("todos.json")
    .then(last_modified => {
        var last_modified_elem = document.getElementById("todos-meta-last-modified");
        last_modified_elem.innerText = "last updated: " + last_modified;
    })
    .catch(error => console.error(error));

