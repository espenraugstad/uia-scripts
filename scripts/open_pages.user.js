// ==UserScript==
// @name         Canvas Open All Pages
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Open all pages - or a selection - in a Canvas course in new tabs
// @author       You
// @match        https://uia.instructure.com/courses/*/pages
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @require      https://raw.githubusercontent.com/espenraugstad/uia-scripts/refs/heads/main/scripts/utilities/TMCanvasClient.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const c = new TMCanvasClient();

    window.addEventListener("load", ()=>{
        const headerBar = document.querySelector(".ic-app-nav-toggle-and-crumbs");
        if(headerBar){
            console.log(headerBar);


            const openBtn = document.createElement("button");
            openBtn.innerText = "Open selected pages";
            headerBar.appendChild(openBtn);

            const openAll = document.createElement("button");
            openAll.innerText = "Open ALL pages";
            headerBar.appendChild(openAll);

            openBtn.addEventListener("click", ()=>{
                console.log("Opening");
                const selected = document.querySelectorAll('input[type="checkbox"]:checked');

                if(selected.length === 0){
                    alert("Du må velge noen sider først.");
                    return;
                }

                for(const page of selected){
                    console.log(page);
                    const link = page.parentElement.nextElementSibling.querySelector("a");
                    console.log(link.href);
                    window.open(link.href);
                }

            });

            openAll.addEventListener("click", async ()=>{
                const dialog = document.createElement("dialog");
                dialog.innerHTML = `Henter alle sidene. Dette kan ta litt tid hvis det er mange sider.`;
                document.body.appendChild(dialog);
                dialog.showModal();
                const allPages = await c.listPages();
                dialog.close();
                dialog.remove();
                if(allPages.length > 50){
                    if(!window.confirm(`Dette vil åpne ${allPages.length} faner, og kan krasje nettleseren! Er du sikker på du vil fortsette?`)){
                        return;
                    }
                }
                for(const page of allPages){
                    window.open(page.html_url);
                }
            });
        }
    });



})();