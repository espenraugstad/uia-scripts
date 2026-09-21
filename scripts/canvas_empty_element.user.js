// ==UserScript==
// @name         Canvas Empty Element
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Marks empty HTML elements on Canvas pages
// @author       Espen Raugstad
// @match        https://uia.instructure.com/courses/*/pages/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=feide.no
// @updateURL    https://github.com/espenraugstad/uia-scripts/raw/refs/heads/main/scripts/canvas_empty_element.user.js
// @downloadURL  https://github.com/espenraugstad/uia-scripts/raw/refs/heads/main/scripts/canvas_empty_element.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SKIP_TAGS = new Set(['BR', 'HEADER', 'svg', 'IMG', 'VIDEO', 'INPUT', 'CANVAS', 'SVG', 'IFRAME']);
    const SKIP_IDS = new Set(['todo-date-mount-point', 'assign-to-mount-point', 'choose-editor-mount-point']);
    const SKIP_CLASSES = new Set(['ally-accessible-versions', 'ally-prominent-af-download-button', 'divider', 'external_link_icon']);

    const observer = new MutationObserver((mutationList, observer)=> {
        const content = document.querySelector(".user_content");
        if(content){

            // Go through all the sub-elements of content to find empty elements.
            const empties = findEmptyElements(content);
            //console.log(empties);
            if(!empties || empties.length === 0){
                console.log("No empty elements found");
                return;
            }

            for(const el of empties){
                //console.log(el);
                el.style.width = "100px";
                el.style.height = "100px";
                el.style.border = "2px solid red";
            }

        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    function findEmptyElements(content) {
        const cache = new WeakMap();

        function isEffectivelyEmpty(el) {
            if (cache.has(el)) return cache.get(el);

            // Replace &nbsp; (\u00A0) and trim — if anything is left, it's not empty
            const text = el.textContent.replace(/\u00A0/g, '').trim();

            let empty;
            /* if (text !== '' || ( el.children.length > 0 && [...el.children].every(child => child.tagName === 'IMG' || child.tagName === 'IFRAME'))) */
            if (text !== '' || ( el.children.length > 0 && [...el.children].every(child => SKIP_TAGS.has(child.tagName)))) {
                empty = false;
            } else {
                // No meaningful text — but verify all child *elements* are <br> or themselves empty
                if (el.childNodes.length === 0){
                    empty = true;
                } else {
                    empty = [...el.children].every(
                        child => child.tagName === 'BR' || isEffectivelyEmpty(child)
                    );
                }
            }

            cache.set(el, empty);
            return empty;
        }

        const emptyElements = [];
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_ELEMENT);

        let node;
        while ((node = walker.nextNode())) {
            if(!node.parentNode.classList.contains("divider")) {
                if (!SKIP_TAGS.has(node.tagName) && isEffectivelyEmpty(node) && !SKIP_IDS.has(node.id) && ![...node.classList].some(cls => SKIP_CLASSES.has(cls))) emptyElements.push(node);
            }

        }

        return emptyElements;
    }
})();