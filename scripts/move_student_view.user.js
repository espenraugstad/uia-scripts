// ==UserScript==
// @name         Move Student View
// @namespace    http://tampermonkey.net/
// @version      2025-04-10
// @description  Reposition the "Student View" bar
// @author       Espen Raugstad
// @match        https://uia.instructure.com/courses/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /***** GLOBAL VARIABLES *****/
    let position = "bottom";
    const up = `<svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="none" viewBox="0 0 24 24" focusable="false" role="img"><path fill="currentColor" fill-rule="evenodd" d="M12.53 5.97a.75.75 0 0 0-1.06 0l-5.5 5.5a.75.75 0 1 0 1.06 1.06L12 7.56l4.97 4.97a.75.75 0 1 0 1.06-1.06zm5.5 9.5-5.5-5.5a.75.75 0 0 0-1.06 0l-5.5 5.5a.75.75 0 1 0 1.06 1.06L12 11.56l4.97 4.97a.75.75 0 1 0 1.06-1.06" clip-rule="evenodd"></path></svg>`;
    const down = `<svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="none" viewBox="0 0 24 24" focusable="false" role="img"><path fill="currentColor" fill-rule="evenodd" d="M7.03 7.47a.75.75 0 0 0-1.06 1.06l5.5 5.5a.75.75 0 0 0 1.06 0l5.5-5.5a.75.75 0 0 0-1.06-1.06L12 12.44zm0 4a.75.75 0 0 0-1.06 1.06l5.5 5.5a.75.75 0 0 0 1.06 0l5.5-5.5a.75.75 0 1 0-1.06-1.06L12 16.44z" clip-rule="evenodd"></path></svg>`;

    /***** INIT *****/
    const observer = new MutationObserver((mutationList, observer)=>{
        for(const mutation of mutationList){
            const bar = document.getElementById("fixed_bottom");
            if(bar){
                addMoveButton(bar);
                observer.disconnect();
                return; // Add return here to break for-loop.
            }
        }
    });

    observer.observe(document.body, {subtree: true, childList: true});

    function addMoveButton(bar){
        const moveBtn = document.createElement("button");
        moveBtn.innerHTML = up;
        moveBtn.addEventListener("click", ()=>{
            moveBar(bar, moveBtn);
        });

        const masq = document.getElementById("masquerade_bar");

        masq.children[1].insertAdjacentElement("afterend", moveBtn);
    }

    function moveBar(bar, moveBtn){
        if(position === "bottom"){
            bar.style = "top: 0; bottom: unset;";
            moveBtn.innerHTML = down;
            position = "top";
        } else {
            bar.style = "bottom: 0; top: unset;";
            moveBtn.innerHTML = up;
            position = "bottom";
        }
    }
})();