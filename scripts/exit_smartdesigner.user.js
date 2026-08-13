// ==UserScript==
// @name         Exit Smartdesigner
// @namespace    http://tampermonkey.net/
// @version      2025-07-29
// @description  Back to modules button when in SmartDesigner
// @author       Espen Raugstad
// @match        https://uia.instructure.com/courses/*/external_tools/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @updateURL    https://github.com/espenraugstad/uia-scripts/raw/refs/heads/main/scripts/exit_smartdesigner.user.js
// @downloadURL  https://github.com/espenraugstad/uia-scripts/raw/refs/heads/main/scripts/exit_smartdesigner.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Breadcrumbs
    const bc = document.querySelector(".ic-app-crumbs");

    // Create a new div
    let div = document.createElement("div");


    let link = getContentLink();

    // Add the exit button
    if(link !== ""){
        div.innerHTML = link;
        bc.insertAdjacentElement("afterend", div);
    }

    function getContentLink(){
        const url = new URLSearchParams(location.search);
        let content = url.toString().split("=")[0];
        let isCustomFrontPage = url.toString().split("=")[1] === "_frontpage" ? true : false;
        if(isCustomFrontPage){
            content = "syllabus";
        }
        console.log("You are viewing a...");
        console.log(location.search);
        switch (content){
            case "page":
                return `<a href="https://uia.instructure.com/courses/${ENV.current_context.id}/pages/${url.get("page")}" role="button" class="Button Button--primary">Gå ut av SmartDesigner</a>`;
            case "assignment":
                return `<a href="https://uia.instructure.com/courses/${ENV.current_context.id}/assignments/${url.get("assignment")}" role="button" class="Button Button--primary">Gå ut av SmartDesigner</a>`;
            case "syllabus":
                return `<a href="https://uia.instructure.com/courses/${ENV.current_context.id}" role="button" class="Button Button--primary">Gå ut av SmartDesigner</a>`;
            case "announcement":
                return `<a href="https://uia.instructure.com/courses/${ENV.current_context.id}/discussion_topics/${url.get("announcement")}" role="button" class="Button Button--primary">Gå ut av SmartDesigner</a>`;
            case "discussion":
                return `<a href="https://uia.instructure.com/courses/${ENV.current_context.id}/discussion_topics/${url.get("discussion")}" role="button" class="Button Button--primary">Gå ut av SmartDesigner</a>`;

            default:
                return "";
        }
    }

})();