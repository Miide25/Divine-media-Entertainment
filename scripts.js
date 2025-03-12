document.addEventListener("DOMContentLoaded", () => {
  // Initialize audio context - needed for browser autoplay policy
  let audioContext
  let audioContextInitialized = false
  
  // Web Audio API nodes for synth
  let oscillators = {}
  let gainNodes = {}
  let filterNode
  
  // Mobile Menu Toggle
  const mobileMenu = document.getElementById("mobile-menu")
  const navMenu = document.querySelector(".nav-menu")
  
  if (mobileMenu) {
    mobileMenu.addEventListener("click", () => {
      mobileMenu.classList.toggle("active")
      navMenu.classList.toggle("active")
    })
  }
  
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
  
      if (navMenu.classList.contains("active")) {
        mobileMenu.classList.remove("active")
        navMenu.classList.remove("active")
      }
  
      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)
  
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: "smooth",
        })
  
        // Update active nav link
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("active")
        })
        this.classList.add("active")
      }
    })
  })
  
  // Initialize audio context
  function initializeAudioContext() {
    if (!audioContextInitialized) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        audioContext.resume().then(() => {
          console.log("Audio context initialized")
          audioContextInitialized = true
  
          // Create filter node for synth
          filterNode = audioContext.createBiquadFilter()
          filterNode.type = "lowpass"
          filterNode.frequency.value = 2000
          filterNode.connect(audioContext.destination)
  
          // Play a silent sound to unlock audio on iOS
          const silentBuffer = audioContext.createBuffer(1, 1, 22050)
          const source = audioContext.createBufferSource()
          source.buffer = silentBuffer
          source.connect(audioContext.destination)
          source.start(0)
  
          // Initialize all audio elements
          preloadAudioElements()
        })
      } catch (e) {
        console.error("Error initializing audio context:", e)
      }
    }
    return audioContext
  }
  
  function preloadAudioElements() {
    // Preload all audio elements
    document.querySelectorAll("audio").forEach((audio) => {
      audio.load()
      // Try to play and immediately pause to unlock audio on some browsers
      audio.volume = 0
      audio
        .play()
        .then(() => {
          audio.pause()
          audio.currentTime = 0
          audio.volume = 1 // Reset volume
        })
        .catch((e) => {
          console.log("Audio preload failed, will try again on user interaction")
        })
    })
  }
  
  // Initialize audio on first user interaction
  document.body.addEventListener(
    "click",
    () => {
      initializeAudioContext()
    },
    { once: true },
  )
  
  // ===== ELECTRONIC DRUM KIT FUNCTIONALITY =====
  const drumPads = document.querySelectorAll(".drum-pad")
  const drumStatus = document.getElementById("drum-status")
  
  // Ensure all drum audio elements are loaded
  function setupDrumKit() {
    drumPads.forEach((pad) => {
      pad.addEventListener("click", function () {
        const context = initializeAudioContext()
  
        const note = this.getAttribute("data-note")
        const audio = document.getElementById(note)
  
        if (!audio) {
          console.warn(`Audio element for ${note} not found`)
          return
        }
  
        // Update status
        if (drumStatus) {
          drumStatus.textContent = `Playing: ${note.charAt(0).toUpperCase() + note.slice(1)}`
        }
  
        // Reset audio and play
        audio.currentTime = 0
        audio.play().catch((e) => {
          console.error(`Error playing drum ${note}:`, e)
        })
  
        // Visual feedback
        this.classList.add("active")
        setTimeout(() => {
          this.classList.remove("active")
        }, 150)
  
        // Record the note if recording
        if (isRecording && recordingInstrument === "drums") {
          recordNote("drums", note, 150)
        }
      })
  
      // Add touch events for mobile
      pad.addEventListener("touchstart", function(e) {
        e.preventDefault();
        const note = this.getAttribute("data-note");
        const audio = document.getElementById(note);
  
        if (!audio) {
          console.warn(`Audio element for ${note} not found`);
          return;
        }
  
        // Update status
        if (drumStatus) {
          drumStatus.textContent = `Playing: ${note.charAt(0).toUpperCase() + note.slice(1)}`;
        }
  
        // Reset audio and play
        audio.currentTime = 0;
        audio.play().catch((e) => {
          console.error(`Error playing drum ${note}:`, e);
        });
  
        // Visual feedback
        this.classList.add("active");
        
        // Record the note if recording
        if (isRecording && recordingInstrument === "drums") {
          recordNote("drums", note, 150);
        }
      });
  
      pad.addEventListener("touchend", function() {
        this.classList.remove("active");
      });
    });
  
    // Note: Keyboard shortcuts for drums have been removed as per user request
  }
  
  // ===== SYNTH KEYS FUNCTIONALITY =====
  const pianoKeys = document.querySelectorAll(".synth-keyboard .key")
  const pianoStatus = document.getElementById("piano-status")
  const waveformSelect = document.getElementById("waveform")
  const attackControl = document.getElementById("attack")
  const releaseControl = document.getElementById("release")
  const filterControl = document.getElementById("filter")
  
  // Update the setupSynth function to properly support touch events
  function setupSynth() {
    // Click events for piano
    pianoKeys.forEach((key) => {
      key.addEventListener("mousedown", function () {
        const context = initializeAudioContext()
        const note = this.getAttribute("data-note")
        
        // Update status
        if (pianoStatus) {
          pianoStatus.textContent = `Playing: ${note}`
        }
  
        // Play piano note using audio element
        const audio = document.getElementById(note)
        if (audio) {
          audio.currentTime = 0
          audio.play().catch(e => {
            console.error(`Error playing piano note ${note}:`, e)
          })
        } else {
          // Fallback to synth if audio element not found
          playSynthNote(note)
        }
  
        // Visual feedback
        this.classList.add("active")
  
        // Record the note if recording
        if (isRecording && recordingInstrument === "piano") {
          recordNote("piano", note, 500)
        }
      })
  
      key.addEventListener("mouseup", function () {
        const note = this.getAttribute("data-note")
        stopSynthNote(note)
        this.classList.remove("active")
      })
  
      key.addEventListener("mouseleave", function () {
        const note = this.getAttribute("data-note")
        stopSynthNote(note)
        this.classList.remove("active")
      })
  
      // Improved touch events for mobile
      key.addEventListener("touchstart", function (e) {
        e.preventDefault()
        initializeAudioContext()
        const note = this.getAttribute("data-note")
        
        // Update status
        if (pianoStatus) {
          pianoStatus.textContent = `Playing: ${note}`
        }
  
        // Play piano note using audio element
        const audio = document.getElementById(note)
        if (audio) {
          audio.currentTime = 0
          audio.play().catch(e => {
            console.error(`Error playing piano note ${note}:`, e)
          })
        } else {
          // Fallback to synth if audio element not found
          playSynthNote(note)
        }
  
        // Visual feedback
        this.classList.add("active")
  
        // Record the note if recording
        if (isRecording && recordingInstrument === "piano") {
          recordNote("piano", note, 500)
        }
      })
  
      key.addEventListener("touchend", function () {
        const note = this.getAttribute("data-note")
        stopSynthNote(note)
        this.classList.remove("active")
      })
    })
  
    // Keyboard events for piano
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return // Prevent key repeat
  
      initializeAudioContext()
  
      const key = document.querySelector(`.key[data-key="${e.keyCode}"]`)
      if (!key) return
  
      const note = key.getAttribute("data-note")
      
      // Update status
      if (pianoStatus) {
        pianoStatus.textContent = `Playing: ${note}`
      }
  
      // Play piano note using audio element
      const audio = document.getElementById(note)
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(e => {
          console.error(`Error playing piano note ${note}:`, e)
        })
      } else {
        // Fallback to synth if audio element not found
        playSynthNote(note)
      }
  
      // Visual feedback
      key.classList.add("active")
  
      // Record the note if recording
      if (isRecording && recordingInstrument === "piano") {
        recordNote("piano", note, 500)
      }
    })
  
    window.addEventListener("keyup", (e) => {
      const key = document.querySelector(`.key[data-key="${e.keyCode}"]`)
      if (key) {
        const note = key.getAttribute("data-note")
        stopSynthNote(note)
        key.classList.remove("active")
      }
    })
  }
  
  // Synth note functions
  function playSynthNote(note) {
    if (!audioContext) return
    
    // Convert note to frequency (e.g., "C4" to 261.63)
    const freq = noteToFreq(note)
    
    // Create oscillator
    const osc = audioContext.createOscillator()
    osc.type = waveformSelect ? waveformSelect.value : "square"
    osc.frequency.value = freq
    
    // Create gain node for envelope
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0
    
    // Connect nodes
    osc.connect(gainNode)
    gainNode.connect(filterNode || audioContext.destination)
    
    // Apply attack
    const attackTime = attackControl ? parseFloat(attackControl.value) : 0.05
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + attackTime)
    
    // Start oscillator
    osc.start()
    
    // Store references
    oscillators[note] = osc
    gainNodes[note] = gainNode
  }
  
  function stopSynthNote(note) {
    if (!oscillators[note] || !gainNodes[note]) return
    
    // Apply release
    const releaseTime = releaseControl ? parseFloat(releaseControl.value) : 0.5
    const gain = gainNodes[note].gain
    gain.setValueAtTime(gain.value, audioContext.currentTime)
    gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + releaseTime)
    
    // Stop oscillator after release
    setTimeout(() => {
      if (oscillators[note]) {
        oscillators[note].stop()
        delete oscillators[note]
        delete gainNodes[note]
      }
    }, releaseTime * 1000)
  }
  
  function noteToFreq(note) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = parseInt(note.slice(-1))
    const noteIndex = notes.indexOf(note.slice(0, -1))
    
    if (noteIndex === -1) return 440 // Default to A4 if note not found
    
    // A4 is 440Hz, which is 9 semitones above C4
    const semitoneFromA4 = (octave - 4) * 12 + noteIndex - 9
    return 440 * Math.pow(2, semitoneFromA4 / 12)
  }
  
  // ===== TALKING DRUM FUNCTIONALITY =====
  const talkingDrumLarge = document.getElementById("talking-drum-large")
  const talkingDrumMedium = document.getElementById("talking-drum-medium")
  const talkingDrumSmall = document.getElementById("talking-drum-small")
  const talkingDrumStatus = document.getElementById("talking-drum-status")
  
  let isDrumming = false
  let drumOscillator
  let drumGain
  let activeDrum = null
  
  function setupTalkingDrums() {
    ;[talkingDrumLarge, talkingDrumMedium, talkingDrumSmall].forEach((drum) => {
      if (!drum) return
  
      drum.addEventListener("mousedown", function (e) {
        startDrumming(e, this)
      })
  
      drum.addEventListener("touchstart", function (e) {
        e.preventDefault()
        startDrumming(e.touches[0], this)
      })
    })
  
    document.addEventListener("mousemove", (e) => {
      if (isDrumming && activeDrum) {
        updateDrumming(e, activeDrum)
      }
    })
  
    document.addEventListener("touchmove", (e) => {
      if (isDrumming && activeDrum) {
        e.preventDefault()
        updateDrumming(e.touches[0], activeDrum)
      }
    })
  
    document.addEventListener("mouseup", stopDrumming)
    document.addEventListener("touchend", stopDrumming)
  
    // Rhythm pattern buttons
    const rhythmButtons = document.querySelectorAll(".rhythm-btn")
    rhythmButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const rhythm = this.getAttribute("data-rhythm")
        playRhythmPattern(rhythm)
      })
    })
  }
  
  function startDrumming(e, drum) {
    const context = initializeAudioContext()
  
    isDrumming = true
    activeDrum = drum
  
    // Determine which drum is being played
    let drumType = "medium"
    if (drum === talkingDrumLarge) drumType = "high"
    else if (drum === talkingDrumSmall) drumType = "low"
  
    // Play the corresponding audio sample
    const audio = document.getElementById(`talking-drum-${drumType}`)
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((e) => {
        console.error(`Error playing talking drum:`, e)
      })
    }
  
    // Create oscillator for continuous sound
    drumOscillator = context.createOscillator()
    drumGain = context.createGain()
  
    // Set initial frequency based on click position
    const drumHeight = drum.offsetHeight
    const clickY = e.clientY - drum.getBoundingClientRect().top
    const normalizedY = 1 - clickY / drumHeight
    const baseFreq = drumType === "high" ? 150 : drumType === "medium" ? 100 : 70
    const frequency = baseFreq + normalizedY * 200
  
    // Update status
    if (talkingDrumStatus) {
      talkingDrumStatus.textContent = `Playing: ${drumType} drum at ${Math.round(frequency)} Hz`
    }
  
    drumOscillator.type = "triangle"
    drumOscillator.frequency.value = frequency
  
    // Apply resonance and tone
    const resonance = document.getElementById("drum-resonance")?.value / 100 || 0.7
    const tone = document.getElementById("drum-tone")?.value / 100 || 0.5
  
    // Create filter for tone control
    const filter = context.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 500 + tone * 2000
    filter.Q.value = 5 + resonance * 15
  
    // Connect nodes
    drumOscillator.connect(filter)
    filter.connect(drumGain)
    drumGain.connect(context.destination)
  
    // Start with attack
    drumGain.gain.setValueAtTime(0, context.currentTime)
    drumGain.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01)
  
    drumOscillator.start()
  
    // Visual feedback
    drum.style.transform = "scale(0.95)"
  
    // Record the note if recording
    if (isRecording && recordingInstrument === "talking-drum") {
      recordNote("talking-drum", `${drumType}-${frequency.toString()}`, 200)
    }
  }
  
  function updateDrumming(e, drum) {
    if (!isDrumming || !drumOscillator || !activeDrum) return
  
    // Determine which drum is being played
    let drumType = "medium"
    if (drum === talkingDrumLarge) drumType = "high"
    else if (drum === talkingDrumSmall) drumType = "low"
  
    // Update frequency based on drag position
    const drumHeight = drum.offsetHeight
    const dragY = e.clientY - drum.getBoundingClientRect().top
    const normalizedY = 1 - dragY / drumHeight
    const baseFreq = drumType === "high" ? 150 : drumType === "medium" ? 100 : 70
    const frequency = baseFreq + normalizedY * 200
  
    // Update status
    if (talkingDrumStatus) {
      talkingDrumStatus.textContent = `Playing: ${drumType} drum at ${Math.round(frequency)} Hz`
    }
  
    drumOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
  
    // Record the note if recording
    if (isRecording && recordingInstrument === "talking-drum") {
      recordNote("talking-drum", `${drumType}-${frequency.toString()}`, 50)
    }
  }
  
  function stopDrumming() {
    if (!isDrumming || !drumOscillator || !activeDrum) return
  
    // Release with decay
    drumGain.gain.setValueAtTime(drumGain.gain.value, audioContext.currentTime)
    drumGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2)
  
    // Stop oscillator after decay
    setTimeout(() => {
      if (drumOscillator) {
        drumOscillator.stop()
        drumOscillator = null
      }
    }, 200)
  
    isDrumming = false
  
    // Visual feedback
    activeDrum.style.transform = "scale(1)"
    activeDrum = null
  
    // Update status
    if (talkingDrumStatus) {
      talkingDrumStatus.textContent = "Click and drag on drums to play"
    }
  }
  
  function playRhythmPattern(pattern) {
    initializeAudioContext()
  
    // Define rhythm patterns
    const patterns = {
      dundun: [
        { drum: "high", duration: 200, delay: 0 },
        { drum: "medium", duration: 200, delay: 300 },
        { drum: "low", duration: 300, delay: 600 },
        { drum: "medium", duration: 200, delay: 1000 },
        { drum: "high", duration: 200, delay: 1300 },
      ],
      highlife: [
        { drum: "medium", duration: 100, delay: 0 },
        { drum: "medium", duration: 100, delay: 200 },
        { drum: "high", duration: 200, delay: 400 },
        { drum: "low", duration: 300, delay: 700 },
        { drum: "medium", duration: 100, delay: 1100 },
        { drum: "high", duration: 200, delay: 1300 },
      ],
      jembe: [
        { drum: "low", duration: 300, delay: 0 },
        { drum: "high", duration: 100, delay: 400 },
        { drum: "high", duration: 100, delay: 600 },
        { drum: "medium", duration: 200, delay: 800 },
        { drum: "low", duration: 300, delay: 1100 },
      ],
      fanga: [
        { drum: "high", duration: 100, delay: 0 },
        { drum: "medium", duration: 200, delay: 200 },
        { drum: "low", duration: 300, delay: 500 },
        { drum: "low", duration: 300, delay: 900 },
        { drum: "medium", duration: 200, delay: 1300 },
        { drum: "high", duration: 100, delay: 1600 },
      ],
    }
  
    if (!patterns[pattern]) return
  
    // Play each note in the pattern
    patterns[pattern].forEach((note) => {
      setTimeout(() => {
        const audio = document.getElementById(`talking-drum-${note.drum}`)
        if (audio) {
          audio.currentTime = 0
          audio.play().catch((e) => {
            console.error(`Error playing talking drum pattern:`, e)
          })
        }
  
        // Visual feedback
        let drum
        if (note.drum === "high") drum = talkingDrumLarge
        else if (note.drum === "medium") drum = talkingDrumMedium
        else drum = talkingDrumSmall
  
        if (drum) {
          drum.style.transform = "scale(0.95)"
          setTimeout(() => {
            drum.style.transform = "scale(1)"
          }, note.duration)
        }
      }, note.delay)
    })
  
    // Update status
    if (talkingDrumStatus) {
      talkingDrumStatus.textContent = `Playing: ${pattern} rhythm pattern`
    }
  }
  
  // ===== RECORDING FUNCTIONALITY =====
  let isRecording = false
  let recordedNotes = []
  let recordStartTime = 0
  let recordingInstrument = ""
  let audioRecorder = null
  let audioChunks = []
  let audioBlob = null
  let audioUrl = null
  
  // Set up recording buttons for each instrument
  ;["drums", "piano", "talking-drum"].forEach((instrument) => {
    const recordBtn = document.getElementById(`record-${instrument}`)
    const stopRecordBtn = document.getElementById(`stop-record-${instrument}`)
    const playRecordBtn = document.getElementById(`play-record-${instrument}`)
    const saveBtn = document.getElementById(`save-${instrument}`)
  
    if (recordBtn && stopRecordBtn && playRecordBtn && saveBtn) {
      recordBtn.addEventListener("click", () => {
        initializeAudioContext()
        startRecording(instrument)
        recordBtn.disabled = true
        stopRecordBtn.disabled = false
        playRecordBtn.disabled = true
        saveBtn.disabled = true
      })
  
      stopRecordBtn.addEventListener("click", () => {
        stopRecording()
        recordBtn.disabled = false
        stopRecordBtn.disabled = true
        playRecordBtn.disabled = false
        saveBtn.disabled = false
      })
  
      playRecordBtn.addEventListener("click", () => {
        playRecording(instrument)
      })
  
      saveBtn.addEventListener("click", () => {
        saveRecordingWrapper(instrument)
      })
    }
  })
  
  function startRecording(instrument) {
    // Clear previous recording
    isRecording = true
    recordedNotes = []
    recordStartTime = Date.now()
    recordingInstrument = instrument
    audioChunks = []
  
    // Start audio recording
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioRecorder = new MediaRecorder(stream)
          
          audioRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data)
          }
          
          audioRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/mp3' })
            audioUrl = URL.createObjectURL(audioBlob)
            console.log("Audio recording completed")
          }
          
          audioRecorder.start()
        })
        .catch(err => {
          console.error("Error accessing microphone:", err)
          alert("Could not access microphone for recording. MIDI notes will still be recorded.")
        })
    }
  
    // Update status
    const statusElement = document.getElementById(
      `${instrument === "talking-drum" ? "talking-drum" : instrument}-status`,
    )
    if (statusElement) {
      statusElement.textContent = "Recording..."
      statusElement.style.color = "red"
    }
  
    console.log(`Recording ${instrument} started. Play some notes!`)
  }
  
  function recordNote(instrument, note, duration) {
    if (!isRecording || instrument !== recordingInstrument) return
  
    const time = Date.now() - recordStartTime
    recordedNotes.push({
      instrument,
      note,
      time,
      duration,
    })
  
    console.log(`Recorded: ${instrument} - ${note} at ${time}ms`)
  }
  
  function stopRecording() {
    // Make sure we stop recording properly
    if (!isRecording) return;
    
    isRecording = false
  
    // Stop audio recording
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.stop()
    }
  
    // Update status
    const statusElement = document.getElementById(
      `${recordingInstrument === "talking-drum" ? "talking-drum" : recordingInstrument}-status`,
    )
    if (statusElement) {
      statusElement.textContent = `Recorded: ${recordedNotes.length} notes`
      statusElement.style.color = "green"
    }
  
    console.log(`Recording stopped. ${recordedNotes.length} notes recorded.`)
  
    // Enable save button
    const saveBtn = document.getElementById(`save-${recordingInstrument}`)
    if (saveBtn) {
      saveBtn.disabled = false
    }
  }
  
  function playRecording(instrument) {
    initializeAudioContext()
  
    if (recordedNotes.length === 0) {
      alert("No recording to play")
      return
    }
  
    // Update status
    const statusElement = document.getElementById(
      `${instrument === "talking-drum" ? "talking-drum" : instrument}-status`,
    )
    if (statusElement) {
      statusElement.textContent = "Playing recording..."
    }
  
    console.log(`Playing back ${recordedNotes.length} recorded notes...`)
  
    // Sort notes by time
    const sortedNotes = [...recordedNotes].sort((a, b) => a.time - b.time)
  
    // Play each note at the correct time
    sortedNotes.forEach((note) => {
      setTimeout(() => {
        if (note.instrument === "drums") {
          const audio = document.getElementById(note.note)
          if (audio) {
            audio.currentTime = 0
            audio.play().catch((e) => {
              console.error(`Error playing recorded drum ${note.note}:`, e)
            })
  
            // Highlight the drum
            const drum = document.querySelector(`.drum-pad[data-note="${note.note}"]`)
            if (drum) {
              drum.classList.add("active")
              setTimeout(() => {
                drum.classList.remove("active")
              }, 150)
            }
          }
        } else if (note.instrument === "piano") {
          // Try to play using audio element first
          const audio = document.getElementById(note.note)
          if (audio) {
            audio.currentTime = 0
            audio.play().catch((e) => {
              console.error(`Error playing piano note ${note.note}:`, e)
              // Fallback to synth
              playSynthNote(note.note)
            })
          } else {
            // Fallback to synth if audio element not found
            playSynthNote(note.note)
          }
          
          // Highlight the key
          const key = document.querySelector(`.key[data-note="${note.note}"]`)
          if (key) {
            key.classList.add("active")
            setTimeout(() => {
              key.classList.remove("active")
              stopSynthNote(note.note)
            }, note.duration)
          }
        } else if (note.instrument === "talking-drum") {
          // For talking drum, parse the note to get drum type and frequency
          const [drumType, frequency] = note.note.split("-")
          const audio = document.getElementById(`talking-drum-${drumType}`)
  
          if (audio) {
            audio.currentTime = 0
            audio.play().catch((e) => {
              console.error(`Error playing recorded talking drum:`, e)
            })
  
            // Highlight the drum
            let drum
            if (drumType === "high") drum = talkingDrumLarge
            else if (drumType === "medium") drum = talkingDrumMedium
            else drum = talkingDrumSmall
  
            if (drum) {
              drum.style.transform = "scale(0.95)"
              setTimeout(() => {
                drum.style.transform = "scale(1)"
              }, note.duration)
            }
          }
        }
      }, note.time)
    })
  
    // Reset status after playback
    const lastNote = sortedNotes[sortedNotes.length - 1]
    setTimeout(() => {
      if (statusElement) {
        statusElement.textContent = "Playback complete"
  
        // Reset after a moment
        setTimeout(() => {
          statusElement.textContent =
            instrument === "talking-drum" ? "Click and drag on drums to play" : "Ready to play"
          statusElement.style.color = ""
        }, 2000)
      }
    }, lastNote.time + 1000)
  }
  
  function saveRecordingWrapper(instrument) {
    // Call the save recording function
    saveRecording(instrument);
  }
  
  // Add this to the top of your script to track saved recordings
  let savedRecordings = []
  
  // Update the saveRecording function to store recordings in memory
  function saveRecording(instrument) {
    if (recordedNotes.length === 0 && !audioBlob) {
      alert("No recording to save")
      return
    }
  
    // Create a recording object
    const recording = {
      instrument,
      notes: [...recordedNotes], // Make a copy to ensure we capture all notes
      duration: recordedNotes.reduce((max, note) => Math.max(max, note.time + note.duration), 0),
      timestamp: new Date().toISOString(),
      audioBlob: audioBlob,
      audioUrl: audioUrl
    }
  
    // Store the recording in memory
    savedRecordings.push(recording)
  
    // Add to recordings list
    addRecordingToList(recording)
  
    // Reset buttons
    const recordBtn = document.getElementById(`record-${instrument}`)
    const stopRecordBtn = document.getElementById(`stop-record-${instrument}`)
    const playRecordBtn = document.getElementById(`play-record-${instrument}`)
    const saveBtn = document.getElementById(`save-${instrument}`)
  
    if (recordBtn && stopRecordBtn && playRecordBtn && saveBtn) {
      recordBtn.disabled = false
      stopRecordBtn.disabled = true
      playRecordBtn.disabled = false
      saveBtn.disabled = true
    }
  
    // Show success message
    alert(`Your ${instrument} recording has been saved to My Recordings!`)
  }
  
  function downloadRecording(recording) {
    console.log("Downloading recording:", recording)
  
    // If we have audio recording, download that
    if (recording.audioBlob && recording.audioUrl) {
      const a = document.createElement("a")
      a.href = recording.audioUrl
      a.download = `${recording.instrument}-recording-${new Date().getTime()}.mp3`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
      }, 100)
      return
    }
  
    // Otherwise create a WAV file from the MIDI data
    try {
      // Create an offline audio context for rendering
      const offlineContext = new OfflineAudioContext(2, 44100 * 30, 44100)
      
      // Create a master gain node
      const masterGain = offlineContext.createGain()
      masterGain.gain.value = 0.8 // Prevent clipping
      masterGain.connect(offlineContext.destination)
      
      // Sort notes by time
      const notes = recording.notes.sort((a, b) => a.time - b.time)
      
      // Process each note
      const promises = []
      
      for (const note of notes) {
        // Get the audio element for this note
        let audioElement
        
        if (note.instrument === "talking-drum") {
          const [drumType] = note.note.split("-")
          audioElement = document.getElementById(`talking-drum-${drumType}`)
        } else {
          audioElement = document.getElementById(note.note)
        }
        
        if (audioElement) {
          const promise = fetch(audioElement.src)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => offlineContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
              // Create a buffer source for this note
              const source = offlineContext.createBufferSource()
              source.buffer = audioBuffer
              source.connect(masterGain)
              
              // Schedule the note to play at the correct time
              source.start(note.time / 1000) // Convert ms to seconds
            })
            .catch(error => {
              console.error(`Error processing audio for note ${note.note}:`, error)
            })
          
          promises.push(promise)
        }
      }
      
      // Wait for all audio to be processed
      Promise.all(promises)
        .then(() => offlineContext.startRendering())
        .then(renderedBuffer => {
          // Convert the rendered buffer to a WAV file
          const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length)
          
          // Create download link
          const url = URL.createObjectURL(wavBlob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${recording.instrument}-recording-${new Date().getTime()}.wav`
          document.body.appendChild(a)
          a.click()
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        })
        .catch(error => {
          console.error("Error rendering audio:", error)
          alert("There was an error creating the audio file. Please try again.")
        })
    } catch (error) {
      console.error("Error in download process:", error)
      alert("There was an error downloading the recording. Please try again.")
      
      // Fallback to JSON download if audio rendering fails
      const jsonString = JSON.stringify(recording.notes)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = `${recording.instrument}-recording-${new Date().getTime()}.json`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    }
  }
  
  // ===== RECORDINGS LIST =====
  function addRecordingToList(recording) {
    const noRecordings = document.getElementById("no-recordings")
    const recordingsList = document.getElementById("recordings-list")
  
    if (noRecordings && recordingsList) {
      // Hide the "no recordings" message
      noRecordings.style.display = "none"
  
      // Show the recordings list
      recordingsList.style.display = "flex"
  
      // Create a new recording item
      const recordingItem = document.createElement("div")
      recordingItem.className = "recording-item"
      recordingItem.innerHTML = `
      <div class="recording-info">
        <h3>${recording.instrument.charAt(0).toUpperCase() + recording.instrument.slice(1)} Recording</h3>
        <p>${new Date(recording.timestamp).toLocaleString()}</p>
        <p>${recording.notes.length} notes, ${Math.round(recording.duration / 1000)} seconds</p>
      </div>
      <div class="recording-actions">
        <button class="btn btn-secondary play-recording">
          <i class="fas fa-play"></i> Play
        </button>
        <button class="btn btn-primary download-recording">
          <i class="fas fa-download"></i> Download
        </button>
        <button class="btn btn-danger delete-recording">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `
  
    // Add event listeners
    recordingItem.querySelector(".play-recording").addEventListener("click", () => {
      playRecording(recording.instrument)
    })
  
    recordingItem.querySelector(".download-recording").addEventListener("click", () => {
      // Open Flutterwave payment link in a new window
      const paymentWindow = window.open("https://flutterwave.com/pay/yourlinkhere", "_blank", "width=600,height=600");
      
      // Check if window was closed to proceed with download
      const checkWindowClosed = setInterval(() => {
        if (paymentWindow.closed) {
          clearInterval(checkWindowClosed);
          // Proceed with download
          downloadRecording(recording);
          alert("Payment successful! Your recording has been downloaded.");
        }
      }, 1000);
    })
  
    recordingItem.querySelector(".delete-recording").addEventListener("click", () => {
      recordingItem.remove()
  
      // If no recordings left, show the "no recordings" message
      if (recordingsList.children.length === 0) {
        noRecordings.style.display = "flex"
        recordingsList.style.display = "none"
      }
    })
  
    // Add to the list
    recordingsList.appendChild(recordingItem)
  }
  }
  
  // Helper function to convert an AudioBuffer to a WAV Blob
  function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels
  const length = len * numOfChan * 2 + 44
  const buffer = new ArrayBuffer(length)
  const view = new DataView(buffer)
  let offset = 0
  let pos = 0
  
  // Write WAVE header
  setUint32(0x46464952) // "RIFF"
  setUint32(length - 8) // file length - 8
  setUint32(0x45564157) // "WAVE"
  setUint32(0x20746d66) // "fmt " chunk
  setUint32(16) // length = 16
  setUint16(1) // PCM (uncompressed)
  setUint16(numOfChan)
  setUint32(abuffer.sampleRate)
  setUint32(abuffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
  setUint16(numOfChan * 2) // block-align
  setUint16(16) // 16-bit
  setUint32(0x61746164) // "data" chunk
  setUint32(length - pos - 4) // chunk length
  
  // Write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    const channel = abuffer.getChannelData(i)
    for (let j = 0; j < len; j++) {
      // Clamp the value to the 16-bit range
      const sample = Math.max(-1, Math.min(1, channel[j]))
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      setInt16(value)
    }
  }
  
  function setUint16(data) {
    view.setUint16(pos, data, true)
    pos += 2
  }
  
  function setUint32(data) {
    view.setUint32(pos, data, true)
    pos += 4
  }
  
  function setInt16(data) {
    view.setInt16(pos, data, true)
    pos += 2
  }
  
  return new Blob([buffer], { type: "audio/wav" })
  }
  
  // ===== MODAL FUNCTIONALITY =====
  const modals = document.querySelectorAll(".modal")
  const modalTriggers = document.querySelectorAll('[id$="-tutorial-btn"], [id$="-chart-btn"]')
  const closeButtons = document.querySelectorAll(".close-modal")
  
  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function () {
      const modalId = this.id.replace("-btn", "-modal")
      const modal = document.getElementById(modalId) || document.getElementById("tutorial-modal")
  
      if (modal) {
        modal.style.display = "block"
  
        // Set modal content based on which button was clicked
        const modalBody = modal.querySelector(".modal-body")
        const modalHeader = modal.querySelector(".modal-header h2")
  
        if (modalBody && modalHeader) {
          if (this.id === "drum-tutorial-btn") {
            modalHeader.textContent = "How to Play Electronic Drums"
            modalBody.innerHTML = `
                            <p>Click on the drum pads to play sounds.</p>
                            <ul>
                                <li><strong>Kick:</strong> Bass drum sound</li>
                                <li><strong>Snare:</strong> Snare drum sound</li>
                                <li><strong>Hi-Hat Closed:</strong> Closed hi-hat sound</li>
                                <li><strong>Hi-Hat Open:</strong> Open hi-hat sound</li>
                                <li><strong>Tom 1:</strong> High tom sound</li>
                                <li><strong>Tom 2:</strong> Mid tom sound</li>
                                <li><strong>Floor Tom:</strong> Low tom sound</li>
                                <li><strong>Crash:</strong> Crash cymbal sound</li>
                                <li><strong>Ride:</strong> Ride cymbal sound</li>
                            </ul>
                            <p>You can record your drum performance by clicking the Record button.</p>
                        `
          } else if (this.id === "piano-tutorial-btn") {
            modalHeader.textContent = "How to Play Synth Keys"
            modalBody.innerHTML = `
                            <p>Click on the synth keys or use your computer keyboard to play notes.</p>
                            <p>The white keys correspond to these keys on your keyboard:</p>
                            <p><strong>A S D F G H J K L ; '</strong></p>
                            <p>The black keys correspond to these keys:</p>
                            <p><strong>W E T Y U O P</strong></p>
                            <p>You can adjust the synth sound using the controls above the keyboard:</p>
                            <ul>
                                <li><strong>Waveform:</strong> Changes the basic sound character (square, sine, sawtooth, triangle)</li>
                                <li><strong>Attack:</strong> How quickly the note reaches full volume</li>
                                <li><strong>Release:</strong> How long the note takes to fade out after release</li>
                                <li><strong>Filter:</strong> Adjusts the brightness of the sound</li>
                            </ul>
                        `
          } else if (this.id === "talking-drum-tutorial-btn") {
            modalHeader.textContent = "How to Play Talking Drums"
            modalBody.innerHTML = `
                            <p>Click and drag up/down on the drums to change pitch.</p>
                            <p>Each drum has a different tonal range:</p>
                            <ul>
                                <li><strong>Large Drum:</strong> Higher pitched sounds</li>
                                <li><strong>Medium Drum:</strong> Mid-range sounds</li>
                                <li><strong>Small Drum:</strong> Lower pitched sounds</li>
                            </ul>
                            <p>Try the rhythm patterns below to hear traditional rhythms.</p>
                        `
          }
        }
      }
    })
  })
  
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.style.display = "none"
      }
    })
  })
  
  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    modals.forEach((modal) => {
      if (e.target === modal) {
        modal.style.display = "none"
      }
    })
  })
  
  // ===== NEWSLETTER FORM =====
  const newsletterForm = document.getElementById("newsletter-form")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault()
      const email = this.querySelector('input[type="email"]').value
  
      // In a real implementation, this would submit to a server
      alert(`Thank you for subscribing with ${email}! You'll receive our latest updates.`)
  
      // Reset form
      this.reset()
    })
  }
  
  // ===== INITIALIZE COMPONENTS =====
  // Initialize all instrument components
  setupDrumKit()
  setupSynth()
  setupTalkingDrums()
  
  // Force audio initialization on page load
  window.addEventListener("load", () => {
    // Try to initialize audio context after a short delay
    setTimeout(() => {
      initializeAudioContext()
    }, 1000)
  })
  })