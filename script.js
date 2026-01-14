class RSVPReader {
    constructor() {
        this.words = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.timeoutId = null;
        this.wpm = 300;
        this.textSize = 60;
        this.paragraphBreak = 1.0;
        this.sentenceBreak = 0.5;
        this.startTime = null;
        this.totalDuration = 0;
        
        // Reading statistics tracking
        this.cumulativeWordsRead = 0;
        this.cumulativeReadingTime = 0; // in milliseconds
        this.sessionStartTime = null;
        this.pauseStartTime = null;
        this.lastWordIndex = 0;
        
        this.initializeElements();
        this.attachEventListeners();
        this.setupKeyboardShortcuts();
        this.loadPublicDomainWorks();
    }

    initializeElements() {
        this.textInput = document.getElementById('text-input');
        this.fileInput = document.getElementById('file-input');
        this.fileName = document.getElementById('file-name');
        this.wpmSlider = document.getElementById('wpm');
        this.wpmValue = document.getElementById('wpm-value');
        this.textSizeSlider = document.getElementById('text-size');
        this.textSizeValue = document.getElementById('text-size-value');
        this.paragraphBreakSlider = document.getElementById('paragraph-break');
        this.paragraphBreakValue = document.getElementById('paragraph-break-value');
        this.sentenceBreakSlider = document.getElementById('sentence-break');
        this.sentenceBreakValue = document.getElementById('sentence-break-value');
        this.wordCountDisplay = document.getElementById('word-count');
        this.timeRemainingDisplay = document.getElementById('time-remaining');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.playBtn = document.getElementById('play-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.wordDisplay = document.getElementById('word-display');
        this.worksGrid = document.getElementById('works-grid');
        this.readingStatsDisplay = document.getElementById('reading-stats');
    }

    attachEventListeners() {
        this.textInput.addEventListener('input', () => {
            this.updateWordCount();
            // Reset reading position if text changes
            if (this.isPlaying || this.currentIndex > 0) {
                this.reset();
            }
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.wpmSlider.addEventListener('input', (e) => {
            this.wpm = parseInt(e.target.value);
            this.wpmValue.textContent = this.wpm;
            this.updateTimeRemaining();
        });
        this.textSizeSlider.addEventListener('input', (e) => {
            this.textSize = parseInt(e.target.value);
            this.textSizeValue.textContent = `${this.textSize}px`;
            this.wordDisplay.style.fontSize = `${this.textSize}px`;
        });
        this.paragraphBreakSlider.addEventListener('input', (e) => {
            this.paragraphBreak = parseFloat(e.target.value);
            this.paragraphBreakValue.textContent = `${this.paragraphBreak.toFixed(1)}s`;
        });
        this.sentenceBreakSlider.addEventListener('input', (e) => {
            this.sentenceBreak = parseFloat(e.target.value);
            this.sentenceBreakValue.textContent = `${this.sentenceBreak.toFixed(1)}s`;
        });
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Set initial text size
        this.wordDisplay.style.fontSize = `${this.textSize}px`;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                return;
            }
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.wpm = Math.max(50, this.wpm - 10);
                this.wpmSlider.value = this.wpm;
                this.wpmValue.textContent = this.wpm;
                this.updateTimeRemaining();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.wpm = Math.min(1000, this.wpm + 10);
                this.wpmSlider.value = this.wpm;
                this.wpmValue.textContent = this.wpm;
                this.updateTimeRemaining();
            }
        });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            this.fileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.textInput.value = e.target.result;
                this.updateWordCount();
            };
            reader.readAsText(file);
        } else {
            alert('Please upload a valid .txt file');
            this.fileInput.value = '';
            this.fileName.textContent = 'No file selected';
        }
    }

    parseText(text) {
        if (!text.trim()) {
            return [];
        }

        // Split by paragraphs first, then by sentences, then by words
        const paragraphs = text.split(/\n\s*\n/);
        const words = [];
        
        paragraphs.forEach((paragraph, pIndex) => {
            // Split paragraph into sentences (keeping delimiters)
            const sentences = paragraph.split(/([.!?]+[\s\n])/);
            const validSentences = sentences.filter(s => s.trim() && !/^[.!?]+[\s\n]/.test(s));
            
            validSentences.forEach((sentence, sIndex) => {
                // Extract words from sentence
                const sentenceWords = sentence.match(/\S+/g) || [];
                const isLastSentenceInParagraph = sIndex === validSentences.length - 1;
                
                sentenceWords.forEach((word, wIndex) => {
                    const isLastInSentence = wIndex === sentenceWords.length - 1;
                    // Mark as end of paragraph if it's the last word of the last sentence in this paragraph
                    // (but not if it's the very last paragraph, as there's nothing after it)
                    const isEndOfParagraph = isLastInSentence && isLastSentenceInParagraph && 
                                           pIndex < paragraphs.length - 1;
                    
                    words.push({
                        text: word,
                        isEndOfSentence: isLastInSentence,
                        isEndOfParagraph: isEndOfParagraph
                    });
                });
            });
        });
        
        return words;
    }

    getCenterLetterIndex(word) {
        return Math.floor(word.length / 2);
    }

    createWordElement(word) {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        
        const centerIndex = this.getCenterLetterIndex(word);
        
        for (let i = 0; i < word.length; i++) {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = word[i];
            
            if (i === centerIndex) {
                letterSpan.classList.add('anchor');
            }
            
            wordSpan.appendChild(letterSpan);
        }
        
        return wordSpan;
    }

    displayWord(word) {
        // Clear previous word
        this.wordDisplay.innerHTML = '';
        
        // Create and position word element
        const wordElement = this.createWordElement(word);
        this.wordDisplay.appendChild(wordElement);
        
        // Use requestAnimationFrame to ensure DOM is rendered before calculating positions
        requestAnimationFrame(() => {
            // Find the anchor letter element
            const anchorLetter = wordElement.querySelector('.anchor');
            if (anchorLetter) {
                const wordRect = wordElement.getBoundingClientRect();
                const anchorRect = anchorLetter.getBoundingClientRect();
                
                // Calculate the offset from the word's left edge to the anchor letter's center
                const anchorOffsetFromWordLeft = anchorRect.left - wordRect.left + (anchorRect.width / 2);
                
                // Position word so anchor letter is at center (50% - anchor offset)
                // Since word is positioned at left: 50%, we translate it left by the anchor offset
                const offset = -anchorOffsetFromWordLeft;
                wordElement.style.transform = `translateX(${offset}px)`;
            }
        });
    }

    calculateWordDelay(word, isEndOfSentence, isEndOfParagraph) {
        // Base delay: 60 seconds / WPM = seconds per word
        const baseDelay = (60 / this.wpm) * 1000; // Convert to milliseconds
        
        // Add sentence break if needed
        if (isEndOfSentence && this.sentenceBreak > 0) {
            return baseDelay + (this.sentenceBreak * 1000);
        }
        
        // Add paragraph break if needed
        if (isEndOfParagraph && this.paragraphBreak > 0) {
            return baseDelay + (this.paragraphBreak * 1000);
        }
        
        return baseDelay;
    }

    calculateTotalDuration() {
        if (this.words.length === 0) return 0;
        
        let total = 0;
        const baseDelay = 60 / this.wpm;
        
        this.words.forEach((word, index) => {
            total += baseDelay;
            if (word.isEndOfSentence && this.sentenceBreak > 0) {
                total += this.sentenceBreak;
            }
            if (word.isEndOfParagraph && this.paragraphBreak > 0) {
                total += this.paragraphBreak;
            }
        });
        
        return total;
    }

    updateProgress() {
        if (this.words.length === 0) {
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '0%';
            return;
        }
        
        const progress = (this.currentIndex / this.words.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${Math.round(progress)}%`;
    }

    updateTimeRemaining() {
        if (this.words.length === 0 || !this.isPlaying) {
            this.timeRemainingDisplay.textContent = '--';
            return;
        }
        
        const remainingWords = this.words.length - this.currentIndex;
        const baseTime = (remainingWords * 60) / this.wpm;
        
        // Add estimated break time
        let breakTime = 0;
        for (let i = this.currentIndex; i < this.words.length; i++) {
            if (this.words[i].isEndOfSentence && this.sentenceBreak > 0) {
                breakTime += this.sentenceBreak;
            }
            if (this.words[i].isEndOfParagraph && this.paragraphBreak > 0) {
                breakTime += this.paragraphBreak;
            }
        }
        
        const totalSeconds = Math.ceil(baseTime + breakTime);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        if (minutes > 0) {
            this.timeRemainingDisplay.textContent = `${minutes}m ${seconds}s`;
        } else {
            this.timeRemainingDisplay.textContent = `${seconds}s`;
        }
    }

    updateWordCount() {
        const text = this.textInput.value.trim();
        const wordCount = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
        this.wordCountDisplay.textContent = wordCount;
    }

    play() {
        const text = this.textInput.value.trim();
        if (!text) {
            alert('Please enter some text to read');
            return;
        }

        // Parse text if not already parsed or if text has changed
        if (this.words.length === 0 || this.currentIndex === 0) {
            this.words = this.parseText(text);
            this.currentIndex = 0;
        }

        if (this.words.length === 0) {
            alert('No words found in the text');
            return;
        }

        this.isPlaying = true;
        this.playBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.startTime = Date.now();
        
        // Track session start time if this is a new session
        if (this.sessionStartTime === null) {
            this.sessionStartTime = Date.now();
        }
        
        // Hide stats when playing
        if (this.readingStatsDisplay) {
            this.readingStatsDisplay.style.display = 'none';
        }

        this.displayNextWord();
    }

    displayNextWord() {
        if (!this.isPlaying || this.currentIndex >= this.words.length) {
            this.pause();
            if (this.currentIndex >= this.words.length) {
                this.wordDisplay.innerHTML = '<p class="instruction-text">Reading complete!</p>';
            }
            return;
        }

        const word = this.words[this.currentIndex];
        this.displayWord(word.text);
        this.updateProgress();
        this.updateTimeRemaining();

        const delay = this.calculateWordDelay(word.text, word.isEndOfSentence, word.isEndOfParagraph);
        
        this.currentIndex++;
        
        this.timeoutId = setTimeout(() => {
            this.displayNextWord();
        }, delay);
    }

    updateReadingStatistics() {
        if (!this.readingStatsDisplay) {
            return;
        }
        
        if (this.currentIndex === 0) {
            return;
        }

        // Calculate words read in this session
        const wordsRead = this.currentIndex;
        
        // Calculate actual reading time (time since session started, minus breaks)
        const now = Date.now();
        let actualReadingTime = 0;
        
        // Use sessionStartTime if available, otherwise fall back to startTime
        const timeStart = this.sessionStartTime || this.startTime;
        
        if (timeStart) {
            // Calculate total elapsed time
            const totalElapsed = now - timeStart;
            
            // Calculate break time for sentences and paragraphs already read
            let breakTime = 0;
            for (let i = 0; i < this.currentIndex && i < this.words.length; i++) {
                const word = this.words[i];
                if (word.isEndOfSentence && this.sentenceBreak > 0) {
                    breakTime += this.sentenceBreak * 1000;
                }
                if (word.isEndOfParagraph && this.paragraphBreak > 0) {
                    breakTime += this.paragraphBreak * 1000;
                }
            }
            
            // Actual reading time = total elapsed - break time
            actualReadingTime = Math.max(0, totalElapsed - breakTime);
        }
        
        // Update cumulative stats
        this.cumulativeWordsRead = wordsRead;
        this.cumulativeReadingTime = actualReadingTime;
        
        // Calculate statistics
        const readingTimeSeconds = actualReadingTime / 1000;
        const readingTimeMinutes = Math.floor(readingTimeSeconds / 60);
        const readingTimeSecs = Math.floor(readingTimeSeconds % 60);
        
        // Calculate average WPM (words per minute based on actual reading time)
        const avgWPM = readingTimeSeconds > 0 ? Math.round((wordsRead / readingTimeSeconds) * 60) : 0;
        
        // Calculate time at normal reading speed (300 WPM), including breaks
        // Normal reading time = (words / 300) * 60 seconds + break time
        let normalBreakTime = 0;
        for (let i = 0; i < this.currentIndex && i < this.words.length; i++) {
            const word = this.words[i];
            if (word.isEndOfSentence && this.sentenceBreak > 0) {
                normalBreakTime += this.sentenceBreak;
            }
            if (word.isEndOfParagraph && this.paragraphBreak > 0) {
                normalBreakTime += this.paragraphBreak;
            }
        }
        const normalReadingTimeSeconds = (wordsRead / 300) * 60 + normalBreakTime;
        const timeSavedSeconds = normalReadingTimeSeconds - readingTimeSeconds;
        const timeSavedMinutes = Math.floor(Math.abs(timeSavedSeconds) / 60);
        const timeSavedSecs = Math.floor(Math.abs(timeSavedSeconds) % 60);
        
        // Display statistics (show even if time is very short)
        if (wordsRead > 0) {
            // Calculate total elapsed time (including breaks) for effective WPM
            const totalElapsed = timeStart ? (now - timeStart) / 1000 : 0;
            const totalElapsedSeconds = Math.max(0.1, totalElapsed);
            const totalElapsedMinutes = Math.floor(totalElapsedSeconds / 60);
            const totalElapsedSecs = Math.floor(totalElapsedSeconds % 60);
            
            // Calculate effective WPM (based on total elapsed time including breaks)
            // This will be lower than the set WPM when breaks are enabled
            const effectiveWPM = Math.round((wordsRead / totalElapsedSeconds) * 60);
            
            // Calculate time at normal reading speed (300 WPM), including breaks
            let normalBreakTime = 0;
            for (let i = 0; i < this.currentIndex && i < this.words.length; i++) {
                const word = this.words[i];
                if (word.isEndOfSentence && this.sentenceBreak > 0) {
                    normalBreakTime += this.sentenceBreak;
                }
                if (word.isEndOfParagraph && this.paragraphBreak > 0) {
                    normalBreakTime += this.paragraphBreak;
                }
            }
            const normalReadingTimeSeconds = (wordsRead / 300) * 60 + normalBreakTime;
            const timeSavedSeconds = normalReadingTimeSeconds - totalElapsedSeconds;
            const timeSavedMinutes = Math.floor(Math.abs(timeSavedSeconds) / 60);
            const timeSavedSecs = Math.floor(Math.abs(timeSavedSeconds) % 60);
            
            const timeSavedText = timeSavedSeconds > 0 
                ? `saving ${timeSavedMinutes} minute${timeSavedMinutes !== 1 ? 's' : ''} and ${timeSavedSecs} second${timeSavedSecs !== 1 ? 's' : ''}`
                : `taking ${Math.abs(timeSavedMinutes)} minute${Math.abs(timeSavedMinutes) !== 1 ? 's' : ''} and ${Math.abs(timeSavedSecs)} second${Math.abs(timeSavedSecs) !== 1 ? 's' : ''} longer`;
            
            this.readingStatsDisplay.innerHTML = `
                <div class="reading-stats-content">
                    <p class="stats-text">
                        You've read <strong>${wordsRead.toLocaleString()}</strong> word${wordsRead !== 1 ? 's' : ''} 
                        in <strong>${totalElapsedMinutes}</strong> minute${totalElapsedMinutes !== 1 ? 's' : ''} 
                        and <strong>${totalElapsedSecs}</strong> second${totalElapsedSecs !== 1 ? 's' : ''} 
                        at <strong>${effectiveWPM} WPM</strong>, 
                        ${timeSavedText} versus a normal reading speed of 300 WPM.
                    </p>
                </div>
            `;
            this.readingStatsDisplay.style.display = 'block';
        }
    }

    pause() {
        this.isPlaying = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.playBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // Update cumulative reading statistics
        this.updateReadingStatistics();
    }

    reset() {
        this.pause();
        this.currentIndex = 0;
        this.words = [];
        this.wordDisplay.innerHTML = '<p class="instruction-text">Enter text below and click Play to start</p>';
        this.updateProgress();
        this.timeRemainingDisplay.textContent = '--';
        
        // Reset reading statistics
        this.cumulativeWordsRead = 0;
        this.cumulativeReadingTime = 0;
        this.sessionStartTime = null;
        this.lastWordIndex = 0;
        
        // Hide stats display
        if (this.readingStatsDisplay) {
            this.readingStatsDisplay.style.display = 'none';
        }
    }

    loadPublicDomainWorks() {
        console.log('loadPublicDomainWorks called');
        console.log('this.worksGrid:', this.worksGrid);
        console.log('PUBLIC_DOMAIN_WORKS type:', typeof PUBLIC_DOMAIN_WORKS);
        
        if (!this.worksGrid) {
            console.error('Works grid element not found');
            return;
        }

        if (typeof PUBLIC_DOMAIN_WORKS === 'undefined') {
            console.error('PUBLIC_DOMAIN_WORKS is not defined');
            return;
        }

        if (!Array.isArray(PUBLIC_DOMAIN_WORKS)) {
            console.error('PUBLIC_DOMAIN_WORKS is not an array:', typeof PUBLIC_DOMAIN_WORKS);
            return;
        }

        if (PUBLIC_DOMAIN_WORKS.length === 0) {
            console.error('PUBLIC_DOMAIN_WORKS is empty');
            return;
        }

        console.log('Loading', PUBLIC_DOMAIN_WORKS.length, 'works');

        // Clear any existing content
        this.worksGrid.innerHTML = '';
        
        PUBLIC_DOMAIN_WORKS.forEach((work, index) => {
            console.log(`Creating button for work ${index + 1}:`, work.title);
            const workButton = document.createElement('button');
            workButton.className = 'work-button';
            workButton.innerHTML = `
                <div class="work-title">${work.title}</div>
                <div class="work-author">${work.author} (${work.year})</div>
                <div class="work-meta">
                    <span class="work-level">${work.readingLevel}</span>
                    <span class="work-words">${work.wordCount.toLocaleString()} words</span>
                </div>
            `;
            workButton.addEventListener('click', () => {
                this.textInput.value = work.text;
                this.updateWordCount();
                this.reset();
                // Scroll to top to show the reading display
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            this.worksGrid.appendChild(workButton);
        });
        
        console.log('Finished loading works. Grid now has', this.worksGrid.children.length, 'children');
    }
}

// Initialize the RSVP Reader when the page loads
// Since works.js is loaded before this script, PUBLIC_DOMAIN_WORKS should be available
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for works.js to finish parsing if it's large
    setTimeout(function() {
        if (typeof PUBLIC_DOMAIN_WORKS === 'undefined') {
            console.error('PUBLIC_DOMAIN_WORKS is not defined');
            const worksGrid = document.getElementById('works-grid');
            if (worksGrid) {
                worksGrid.innerHTML = '<p style="color: #ff4444; padding: 20px;">Error: Could not load public domain works. Make sure works.js is in the same directory as index.html.</p>';
            }
            // Still initialize the reader without works
            new RSVPReader();
            return;
        }
        
        console.log('Initializing RSVP Reader with', PUBLIC_DOMAIN_WORKS.length, 'works');
        new RSVPReader();
    }, 100);
});

