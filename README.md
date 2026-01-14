# RSVP Reader

A Rapid Serial Visual Presentation (RSVP) web application that helps you read text faster by displaying one word at a time with word anchoring.

## Features

### Core Features
- **Word Anchoring**: The center letter of each word is anchored in the same position and displayed in red, while other letters are white
- **Customizable WPM**: Adjust reading speed from 50 to 1000 words per minute
- **Text Input**: Paste text directly or upload a .txt file
- **Play/Pause Controls**: Start and pause reading at any time
- **Progress Tracking**: Visual progress bar and percentage completion
- **Text Size Control**: Adjustable font size (20px - 120px)
- **Reading Statistics**: Track your reading progress with cumulative statistics showing words read, time taken, average WPM, and time saved compared to normal reading speed (300 WPM)

### Advanced Features
- **Paragraph Breaks**: Configurable pause duration after paragraphs (0-5 seconds)
- **Sentence Breaks**: Configurable pause duration after sentences (0-3 seconds)
- **Word Count Display**: Shows total word count of input text
- **Time Remaining**: Estimates reading time remaining based on current speed
- **Public Domain Works**: Pre-loaded collection of classic literature and documents for practice reading, including:
  - The Declaration of Independence
  - A Modest Proposal by Jonathan Swift
  - The Lottery by Shirley Jackson
  - The Gift of the Magi by O. Henry
  - The Tell-Tale Heart by Edgar Allan Poe
  - The Monkey's Paw by W.W. Jacobs
  - The Most Dangerous Game by Richard Connell
  - And more!
- **Keyboard Shortcuts**:
  - `Spacebar`: Play/Pause
  - `Left Arrow`: Decrease speed by 10 WPM
  - `Right Arrow`: Increase speed by 10 WPM

## Usage

1. **Input Text**: Either paste text into the text area, upload a .txt file, or click a button in the Public Domain Works section
2. **Adjust Settings**: Set your preferred WPM, text size, and break durations
3. **Start Reading**: Click the Play button or press Spacebar
4. **Control Reading**: Use Pause to stop, Reset to start over, or adjust speed on the fly
5. **View Statistics**: When you pause, view your reading statistics including words read, time taken, average WPM, and time saved compared to normal reading speed

## Design

The application features a clean, minimal black/grey/white color scheme:
- Dark background (#1a1a1a) for reduced eye strain
- White text for readability
- Red anchor letters for visual focus (center letter of each word)
- White non-anchor letters for word recognition

## Technical Details

- Pure HTML/CSS/JavaScript (no dependencies)
- Word anchoring uses precise positioning to keep center letters aligned
- Sentence and paragraph detection for natural reading pauses
- Responsive design that works on various screen sizes

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features
- FileReader API
- CSS transforms

