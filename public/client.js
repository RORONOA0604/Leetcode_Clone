// public/client.js
document.addEventListener('DOMContentLoaded', () => {
    const studentDetails = JSON.parse(sessionStorage.getItem('studentDetails'));
    if (!studentDetails) {
        alert("Student details not found. Please start from the beginning.");
        window.location.href = 'index.html';
        return;
    }

    // All 5 Questions
    const questions = [
        {
            title: "Find Minimum in Rotated Sorted Array",
            statement: "You are given an array of unique elements sorted in ascending order that has been rotated. Find the minimum element. You must write an algorithm that runs in O(log n) time.",
            examples: "<strong>Example 1:</strong><br>Input: nums = [3,4,5,1,2]<br>Output: 1<br><br><strong>Example 2:</strong><br>Input: nums = [4,5,6,7,0,1,2]<br>Output: 0",
            template: `class Solution {
    public int findMin(int[] nums) {
        // Your code here
    }
}`
        },
        {
            title: "Search in Rotated Sorted Array",
            statement: "You are given a rotated sorted array without duplicates and a target value. Return the index of the target if it exists, otherwise return -1. Your algorithm must run in O(log n) time.",
            examples: "<strong>Example 1:</strong><br>Input: nums = [4,5,6,7,0,1,2], target = 0<br>Output: 4<br><br><strong>Example 2:</strong><br>Input: nums = [4,5,6,7,0,1,2], target = 3<br>Output: -1",
            template: `class Solution {
    public int search(int[] nums, int target) {
        // Your code here
    }
}`
        },
        {
            title: "Find Peak Element",
            statement: "A peak element is an element that is strictly greater than its neighbors. Return the index of any peak element. You may assume nums[-1] = nums[n] = -∞. The algorithm must run in O(log n) time.",
            examples: "<strong>Example 1:</strong><br>Input: nums = [1,2,3,1]<br>Output: 2<br><br><strong>Example 2:</strong><br>Input: nums = [1,2,1,3,5,6,4]<br>Output: 5",
            template: `class Solution {
    public int findPeakElement(int[] nums) {
        // Your code here
    }
}`
        },
        {
            title: "Longest Substring Without Repeating Characters",
            statement: "Given a string s, find the length of the longest substring without repeating characters.",
            examples: "<strong>Example 1:</strong><br>Input: s = 'abcabcbb'<br>Output: 3<br><br><strong>Example 2:</strong><br>Input: s = 'bbbbb'<br>Output: 1",
            template: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your code here
    }
}`
        },
        {
            title: "First and Last Occurrence in Sorted Array",
            statement: "Given a sorted array of integers and a target, return the indices of the first and last occurrence of the target. If the target is not found, return [-1, -1]. You must write an algorithm that runs in O(log n) time.",
            examples: "<strong>Example 1:</strong><br>Input: nums = [5,7,7,8,8,10], target = 8<br>Output: [3,4]<br><br><strong>Example 2:</strong><br>Input: nums = [5,7,7,8,8,10], target = 6<br>Output: [-1,-1]",
            template: `class Solution {
    public int[] searchRange(int[] nums, int target) {
        // Your code here
    }
}`
        }
    ];

    let editor;
    let currentQuestionIndex = 0;
    let marks = Array(questions.length).fill(0); // 0 or 1 per question
    let answers = Array(questions.length).fill(""); // stores student code

    // Load Monaco Editor
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: questions[0].template,
            language: 'java',
            theme: 'vs-dark',
            automaticLayout: true
        });
        loadQuestion(0);
    });

    // Attach question buttons (Q1..Q5)
    document.querySelectorAll('.q-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);

            // Save current code before switching
            answers[currentQuestionIndex] = editor.getValue();

            loadQuestion(index);

            // Highlight active button
            document.querySelectorAll('.q-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Load question in left panel + editor
    function loadQuestion(index) {
        currentQuestionIndex = index;
        document.getElementById('question-title').textContent = questions[index].title;
        document.getElementById('question-statement').textContent = questions[index].statement;
        document.getElementById('question-examples').innerHTML = questions[index].examples;

        // Restore code if already written, else show template
        const codeToLoad = answers[index] && answers[index].trim() !== "" ? answers[index] : questions[index].template;
        editor.setValue(codeToLoad);

        document.getElementById('feedback-container').classList.add('hidden');
    }

    // Code submission
    document.getElementById('run-code-btn').addEventListener('click', async () => {
        const code = editor.getValue();
        answers[currentQuestionIndex] = code; // Save code
        const question = questions[currentQuestionIndex].title;

        const feedbackContainer = document.getElementById('feedback-container');
        const feedbackText = document.getElementById('feedback-text');

        feedbackText.textContent = "Evaluating...";
        feedbackContainer.className = 'feedback-container active';

        try {
            const response = await fetch('/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, question })
            });
            const result = await response.json();

            feedbackText.textContent = result.feedback;
            if (result.status.toLowerCase() === 'correct') {
                feedbackContainer.classList.add('correct');
                marks[currentQuestionIndex] = 20;
            } else if (result.status.toLowerCase() === 'incorrect') {
                feedbackContainer.classList.add('incorrect');
                marks[currentQuestionIndex] = 0;
            } else {
                feedbackContainer.classList.add('error');
            }
        } catch (error) {
            feedbackText.textContent = "Error while submitting. Please try again.";
            feedbackContainer.classList.add('error');
        }
    });

    // Final submission
    function submitTest(auto = false) {
        const totalMarks = marks.reduce((a, b) => a + b, 0);
    
        fetch('/submit-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...studentDetails, marks: totalMarks })
        }).then(() => {
            // store score locally so result.html can access
            sessionStorage.setItem("finalScore", totalMarks);
    
            if (auto) {
                window.location.href = 'result.html?auto=1';
            } else {
                window.location.href = 'result.html';
            }
        }).catch(() => {
            alert("Error submitting test. Please try again.");
        });
    }
    

    document.getElementById('submit-test-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to submit the test?")) {
            submitTest();
        }
    });

    // Timer
    const timerDisplay = document.getElementById('timer');
    let timeLeft = 2 * 60 * 60; // 2 hours

    function startTimer() {
        const timerInterval = setInterval(() => {
            timeLeft--;
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert("⏰ Time's up! Your test will be auto-submitted.");
                submitTest();
            }
        }, 1000);
    }

    // Start timer on page load
    startTimer();

    // Default: load first question & mark button active
    document.querySelector('.q-btn[data-index="0"]').classList.add('active');

    // 🚨 Restrict tab switch + minimize
// 🚨 Restrict tab switch + minimize
// 🚨 Restrict tab switch + minimize
let warningCount = 0;
const maxWarnings = 2;
let lockViolation = false; // prevent double-counting

function handleViolation(reason) {
    if (lockViolation) return; // ignore duplicate triggers while alert is open
    lockViolation = true;

    warningCount++;
    if (warningCount >= maxWarnings) {
        alert(`❌ ${reason}\nYou exceeded ${maxWarnings} warnings. Test will be auto-submitted.`);
        submitTest(true); // auto submit, pass flag
    } else {
        alert(`⚠️ Warning ${warningCount}/${maxWarnings}: ${reason}`);
    }

    // unlock after alert is closed
    setTimeout(() => lockViolation = false, 500);
}

// Detect tab switch
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        handleViolation("You switched tabs or minimized the window.");
    }
});

// Detect minimize / window blur (switching apps)
window.addEventListener("blur", () => {
    handleViolation("You left the test window (blur detected).");
});



});
