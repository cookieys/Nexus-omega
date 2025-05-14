// ==UserScript==
// @name         Memrise Community Auto Actions (v1.6 - UpdateURL & Reliable Correct)
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Auto-clicks Hint (INSTANT), Correct (Next w/ delay), Next Session. Prevents virtual keyboard. For Memrise COMMUNITY COURSES.
// @author       Xyra
// @match        https://community-courses.memrise.com/*/learn*
// @match        https://community-courses.memrise.com/*/review*
// @match        https://community-courses.memrise.com/*/garden*
// @match        https://community-courses.memrise.com/*/*session_complete*
// @match        https://community-courses.memrise.com/*/*end_of_session*
// @icon         https://i.imgur.com/7owOpVH.jpeg
// @updateURL    https://raw.githubusercontent.com/cookieys/Nexus-omega/refs/heads/main/Memrise.js
// @downloadURL  https://raw.githubusercontent.com/cookieys/Nexus-omega/refs/heads/main/Memrise.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log("Memrise Community Auto Actions Script (v1.6): Initializing...");

    // --- Configuration ---
    const hintButtonSelector = 'button:has(span[data-testid="wand"])';
    const correctButtonSelector = 'button:has(span[data-testid="tick"])'; // Confirm this selector!
    const nextSessionButtonSelector = 'a[data-testid="scb-classic_review"]';
    const typingInputSelector = 'input[data-testid="typing-response-input"]';

    const correctClickPreDelay = 150;  // Delay BEFORE clicking CORRECT (ms) after finding it
    const activationDelay = 1500;      // Delay before script fully activates observer
    const observerDebounceDelay = 50;  // Delay for MutationObserver callback to batch changes
    const observerTargetSelector = '#root'; // More specific target for the observer

    let observer = null;
    let correctButtonTimer = null; // Timer for delayed correct click

    // --- Helper: Check if element is visible and interactable ---
    function isElementVisibleAndEnabled(element) {
        if (!element) return false;
        const style = getComputedStyle(element);
        return (
            element.offsetParent !== null &&
            !element.disabled &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
        );
    }

    // --- Button Logic Functions ---
    function findAndClickHint() {
        const hintButton = document.querySelector(hintButtonSelector);
        if (isElementVisibleAndEnabled(hintButton)) {
            console.log("Memrise Auto Actions: Found actionable HINT button, attempting INSTANT click.");
            try {
                hintButton.click();
                console.log("Memrise Auto Actions: HINT Clicked!");
            } catch (e) {
                console.error("Memrise Auto Actions: Error clicking HINT button:", e);
            }
        }
    }

    function findAndClickCorrect() {
        // Clear any existing timer to prevent multiple delayed clicks if observer fires rapidly
        if (correctButtonTimer) {
            clearTimeout(correctButtonTimer);
            correctButtonTimer = null;
        }

        const correctButton = document.querySelector(correctButtonSelector);
        if (isElementVisibleAndEnabled(correctButton)) {
            console.log("Memrise Auto Actions: Found actionable 'CORRECT!' button. Scheduling click.");
            correctButtonTimer = setTimeout(() => {
                // Re-check visibility right before clicking, in case state changed during delay
                const buttonAgain = document.querySelector(correctButtonSelector);
                if (isElementVisibleAndEnabled(buttonAgain)) {
                    try {
                        console.log("Memrise Auto Actions: Attempting 'CORRECT!' click (after delay)...");
                        buttonAgain.click();
                        console.log("Memrise Auto Actions: 'CORRECT!' click executed.");
                    } catch (e) {
                        console.error("Memrise Auto Actions: Error clicking 'CORRECT!' button:", e);
                    }
                } else {
                    console.log("Memrise Auto Actions: 'CORRECT!' button disappeared or became disabled before scheduled click.");
                }
                correctButtonTimer = null; // Clear timer after execution
            }, correctClickPreDelay);
        }
    }

    function findAndClickNextSession() {
        const nextSessionButton = document.querySelector(nextSessionButtonSelector);
        if (isElementVisibleAndEnabled(nextSessionButton)) {
            console.log("Memrise Auto Actions: Found actionable 'Next Session' button.");
            try {
                console.log("Memrise Auto Actions: Attempting 'Next Session' click...");
                nextSessionButton.click();
                console.log("Memrise Auto Actions: 'Next Session' click executed.");
            } catch (e) {
                console.error("Memrise Auto Actions: Error clicking 'Next Session' button:", e);
            }
        }
    }

    // --- Prevent Keyboard for Typing Input ---
    function preventKeyboardForInput() {
        const inputElement = document.querySelector(typingInputSelector);
        if (inputElement) {
            if (!inputElement.readOnly || inputElement.inputMode !== 'none') {
                console.log("Memrise Auto Actions: Found typing input. Setting readOnly and inputMode='none'.");
                inputElement.readOnly = true;
                inputElement.inputMode = 'none';
            }
        }
    }

    // --- Main Activation Logic (Delayed) ---
    function activateScript() {
        console.log("Memrise Auto Actions: Activating observer and initial checks...");

        let targetNode = document.querySelector(observerTargetSelector);
        if (!targetNode) {
            console.warn(`Memrise Auto Actions: Observer target "${observerTargetSelector}" not found. Falling back to document.body.`);
            targetNode = document.body;
        } else {
            console.log(`Memrise Auto Actions: Observer target found: "${observerTargetSelector}".`);
        }

        const config = {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'style', 'class', 'readonly', 'inputmode']
        };

        const callback = function(mutationsList, obs) {
            setTimeout(() => {
                findAndClickHint();
                findAndClickCorrect();
                findAndClickNextSession();
                preventKeyboardForInput();
            }, observerDebounceDelay);
        };

        observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
        console.log("Memrise Auto Actions: Observer started.");

        console.log("Memrise Auto Actions: Running initial checks...");
        findAndClickHint();
        findAndClickCorrect();
        findAndClickNextSession();
        preventKeyboardForInput();

        window.stopMemriseAutoActions = () => {
            if (observer) {
                observer.disconnect();
                console.log("Memrise Auto Actions: Observer stopped manually.");
                observer = null;
            }
            if (correctButtonTimer) {
                clearTimeout(correctButtonTimer);
                correctButtonTimer = null;
                console.log("Memrise Auto Actions: Pending 'Correct!' click cancelled.");
            }
            console.log("Memrise Auto Actions: Script manually stopped.");
        };
        console.log("Memrise Auto Actions: Manual stop function 'window.stopMemriseAutoActions()' is available in console.");
    }

    console.log(`Memrise Auto Actions: Waiting ${activationDelay}ms before full activation...`);
    setTimeout(activateScript, activationDelay);

})();
