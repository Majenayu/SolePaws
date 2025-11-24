# Animal Emotion Detection System - Design Guidelines

## Design Approach
**System Selected**: Material Design with scientific dashboard influences
**Rationale**: This application combines data visualization, real-time feedback, and analytical precision. Material Design's clear information hierarchy and visual feedback systems align perfectly with the scientific nature of emotion detection while maintaining user-friendly accessibility.

## Typography System
- **Headings**: Inter or Roboto - weights 600-700
  - H1 (Main title): text-4xl lg:text-5xl font-bold
  - H2 (Section headers): text-2xl lg:text-3xl font-semibold
  - H3 (Subsections): text-xl font-semibold
- **Body Text**: Inter or Roboto - weight 400-500
  - Primary: text-base leading-relaxed
  - Secondary/labels: text-sm
  - Small captions: text-xs
- **Data/Results**: Mono font (Roboto Mono) for confidence percentages and technical readouts

## Layout System
**Spacing Units**: Consistently use Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, py-8)
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Card spacing: p-6
- Grid gaps: gap-4 to gap-6
- Container max-width: max-w-6xl

## Core Application Structure

### Header (Fixed Top)
- Height: h-16
- Application title with small icon/logo
- Navigation minimal - just title centered
- Subtle elevation with shadow-sm

### Main Layout (3-Column Grid on Desktop)
**Left Panel** (w-80, fixed sidebar):
- Pet selection cards in vertical stack (space-y-4)
- Each card: rounded-xl, p-4, cursor-pointer
- Animal icon + name, displays 5 options stacked
- Active state: elevated with shadow-md

**Center Panel** (flex-1, main workspace):
- Audio input controls section at top
- Large circular emotion visualization (primary focus)
- Audio waveform visualization below circle
- All contained in card-style containers with rounded-lg

**Right Panel** (w-72, results sidebar):
- Current emotion detected (large display)
- Confidence metrics
- Historical readings list
- Timestamp information

**Mobile**: Stack vertically - pet selection → audio controls → emotion circle → results

### Pet Selection Interface
- 5 animal cards: Dog, Cat, Love Birds, Chicken, Pigeon
- Grid layout on larger screens: grid-cols-2, on mobile: single column
- Each card includes animal silhouette/icon (use Font Awesome animal icons)
- Typography: font-semibold text-lg for animal names
- Hover elevation: transform hover:scale-105 transition

### Audio Input Section
Card container with two distinct areas:
- **Real-time Recording**: Large circular record button (w-20 h-20), mic icon from Heroicons
- **File Upload**: Drag-and-drop zone (border-2 border-dashed, p-8), "or browse" link
- Both options clearly separated with divider
- Active recording state: pulsing animation on record button
- File upload shows file name and duration when loaded

### Emotion Circle (Primary Visualization)
**Circular Display**: 
- Large circle (w-96 h-96 on desktop, w-80 h-80 mobile)
- 9 emotion segments arranged radially
- Center shows dominant emotion text
- Each emotion positioned around perimeter with small icons
- **9 Emotions**: Fear, Stress, Aggression, Comfort, Happiness, Sadness, Anxiety, Contentment, Alertness
- Active emotion highlighted with larger scale and stronger visual treatment
- Confidence represented by fill intensity of each segment
- Use Heroicons for emotion icons (face variations, alert icons)

### Audio Waveform Visualization
- Full-width bar below emotion circle
- Height: h-32
- Real-time reactive bars showing frequency spectrum
- Minimal, clean representation
- Contained in card with rounded-lg

### Results Panel
**Current Reading Card**:
- Large emotion name: text-3xl font-bold
- Confidence percentage: text-5xl font-mono
- Animal type reminder: text-sm
- Timestamp: text-xs with clock icon

**History List**:
- Compact list items (space-y-2)
- Each item: emotion + confidence + time
- Max 5-7 recent readings
- Scrollable if more

## Component Library

### Cards
- Rounded corners: rounded-lg to rounded-xl
- Padding: p-4 to p-6
- Elevation: shadow-sm default, shadow-md for active/hover
- Border: subtle border when needed

### Buttons
- **Primary** (Record/Analyze): px-6 py-3, rounded-lg, font-semibold
- **Secondary** (Upload): px-4 py-2, rounded-md
- Icon buttons: w-12 h-12, rounded-full for circular actions
- All buttons: transition-all duration-200

### Input Controls
- File input styled as drag-drop zone
- Microphone toggle as prominent circular button
- Clear visual states for active/inactive

### Icons
**Library**: Heroicons (via CDN)
- Animal icons in pet selection
- Microphone, upload, clock icons
- Emotion state icons (faces, alerts)
- All icons: consistent sizing w-5 h-5 or w-6 h-6

## Responsive Behavior
- **Desktop (lg)**: 3-column layout as described
- **Tablet (md)**: 2-column (combine center+right), pet selection as horizontal scroll or top bar
- **Mobile**: Single column stack, emotion circle remains prominent but scales to fit
- Touch-friendly targets: minimum 44x44px for all interactive elements

## Accessibility
- High contrast text throughout
- Large touch targets for mobile
- Clear focus states on all interactive elements
- ARIA labels for audio controls
- Screen reader announcements for emotion changes
- Keyboard navigation support for all controls

## Data Visualization Principles
- Clarity over decoration
- Real-time updates smooth (not jarring)
- Clear numerical displays alongside visual representations
- Progressive disclosure: show details on interaction
- Color-independent emotion indicators (rely on position, icons, text)

## Animation Guidelines
**Minimal, Purposeful Only**:
- Record button pulsing during active recording
- Smooth transitions for emotion circle updates (duration-300)
- Gentle scale on card hover (scale-105)
- Waveform reactive animation tied to audio input
- NO decorative animations, scroll effects, or unnecessary motion

## Images
**No hero image needed** - this is a functional application tool
**Icons only**: Use Heroicons for all UI elements and simple animal silhouettes for pet selection