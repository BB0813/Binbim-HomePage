<template>
  <div class="music-player-wrapper">
    <audio
      ref="audioRef"
      :src="currentSong?.url"
      :loop="loopMode === 'one'"
      preload="auto"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @canplay="onCanPlay"
      @error="onError"
    ></audio>

    <!-- Lyrics Display -->
    <div 
      class="lyrics-container" 
      v-if="showLyrics"
      :style="{ top: lyricsPos.y + 'px', left: lyricsPos.x + 'px' }"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @contextmenu.prevent="handleContextMenu"
    >
      <div class="lyrics-wrapper" v-if="currentLyric || nextLyric">
        <transition name="lyric-fade" mode="out-in">
          <div 
            :key="currentLyric" 
            class="lyric-line current"
            :style="{ 
              fontSize: lyricsSettings.fontSize + 'px',
              color: lyricsSettings.color
            }"
          >
            {{ currentLyric || '...' }}
          </div>
        </transition>
        <transition name="lyric-fade" mode="out-in">
          <div 
            v-if="nextLyric"
            :key="nextLyric" 
            class="lyric-line next"
            :style="{ 
              fontSize: (lyricsSettings.fontSize * 0.75) + 'px',
              color: lyricsSettings.color
            }"
          >
            {{ nextLyric }}
          </div>
        </transition>
      </div>
      <div v-else class="lyrics-placeholder" :style="{ color: lyricsSettings.color }">
        Waiting for lyrics...
      </div>
    </div>

    <!-- Context Menu -->
    <transition name="fade-slide">
      <div 
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }"
        @mousedown.stop
      >
        <div class="menu-header">Settings</div>
        <div class="menu-item">
          <label>Size</label>
          <div class="control-group">
            <input type="range" min="16" max="64" v-model.number="lyricsSettings.fontSize">
            <span class="value">{{ lyricsSettings.fontSize }}px</span>
          </div>
        </div>
        <div class="menu-item">
          <label>Color</label>
          <div class="control-group">
            <input type="color" v-model="lyricsSettings.color">
          </div>
        </div>
      </div>
    </transition>

    <div class="player-widget" :class="{ 'is-playing': isPlaying }">
      <!-- Album Art & Play Toggle -->
      <div class="cover-container" @click="togglePlay">
        <div class="cover-wrapper">
          <img 
            v-if="currentSong?.cover" 
            :src="currentSong.cover" 
            alt="cover" 
            class="cover-img"
            :class="{ 'rotating': isPlaying }"
          />
          <div v-else class="cover-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
        </div>
      </div>

      <!-- Info & Controls -->
      <div class="content-container">
        <div class="top-row">
          <div class="song-info">
            <span class="song-title" :title="currentSong?.name">{{ currentSong?.name || 'Loading...' }}</span>
            <span class="song-artist" v-if="currentSong?.artist">- {{ currentSong.artist }}</span>
          </div>
          <div class="controls">
            <button class="icon-btn" @click="prev" title="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <button class="icon-btn" @click="togglePlay" title="Play/Pause">
               <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
               <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button class="icon-btn" @click="next" title="Next">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
            
            <!-- Volume Control (Vertical) -->
            <div class="volume-control-wrapper" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
              <transition name="fade">
                <div class="volume-slider-container" v-show="showVolumeSlider">
                   <div class="volume-track">
                      <div class="volume-bar" :style="{ height: (volume * 100) + '%' }"></div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        v-model.number="volume"
                        class="volume-slider-vertical"
                        title="Volume"
                      >
                   </div>
                </div>
              </transition>
              <button class="icon-btn" @click="toggleMute" title="Mute/Unmute">
                <svg v-if="volume > 0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
            </div>

            <!-- More Menu Button -->
            <div class="more-control-wrapper" ref="moreMenuRef">
              <button class="icon-btn" @click="toggleMoreMenu" :class="{ active: showMoreMenu }" title="More">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
              
              <transition name="fade-slide-up">
                <div class="more-menu-popup" v-if="showMoreMenu">
                   <div class="more-menu-item" @click="toggleLyrics">
                      <span class="menu-icon text-icon">词</span>
                      <span class="menu-text">桌面歌词</span>
                      <div class="menu-toggle" :class="{ active: showLyrics }"></div>
                   </div>
                   <div class="more-menu-item" @click="togglePlaylist">
                      <span class="menu-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      </span>
                      <span class="menu-text">播放列表</span>
                   </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container" @click="seek">
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Playlist Popup -->
    <transition name="fade-slide">
      <div class="playlist-panel" v-if="showPlaylist">
        <div class="playlist-header">
          <span>Playlist ({{ playlist.length }})</span>
          <button class="icon-btn" @click="showPlaylist = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <ul class="playlist-items">
          <li 
            v-for="(song, index) in playlist" 
            :key="song.id || index"
            :class="{ active: index === currentIndex }"
            @click="playIndex(index)"
          >
            <div class="item-index" v-if="index === currentIndex">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div class="item-index" v-else>{{ index + 1 }}</div>
            <div class="item-info">
              <div class="item-title">{{ song.name }}</div>
              <div class="item-artist">{{ song.artist }}</div>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const audioRef = ref(null)
const isPlaying = ref(false)
const playlist = ref([])
const currentIndex = ref(0)
const progress = ref(0)
const showPlaylist = ref(false)
const showLyrics = ref(true)
const loopMode = ref('all') // 'all', 'one', 'none'
const volume = ref(0.7)
const lastVolume = ref(0.7)
const showVolumeSlider = ref(false)
const showMoreMenu = ref(false)
const moreMenuRef = ref(null)

// Lyrics state
const lyrics = ref([])
const currentLyric = ref('')
const nextLyric = ref('')
const lyricIndex = ref(-1)

// Draggable Lyrics Logic
const lyricsPos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const initLyricsPosition = () => {
  const saved = localStorage.getItem('lyrics-position')
  if (saved) {
    try {
      lyricsPos.value = JSON.parse(saved)
      // Ensure it's within viewport (simple check)
      if (lyricsPos.value.x > window.innerWidth) lyricsPos.value.x = window.innerWidth - 200
      if (lyricsPos.value.y > window.innerHeight) lyricsPos.value.y = window.innerHeight - 100
    } catch (e) {
      console.error(e)
    }
  } else {
    // Initial position based on screen size
    if (window.innerWidth < 768) {
      lyricsPos.value = { x: 20, y: window.innerHeight - 200 }
    } else {
      lyricsPos.value = { x: window.innerWidth - 400, y: 80 }
    }
  }
}

const startDrag = (e) => {
  isDragging.value = true
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  
  dragOffset.value = {
    x: clientX - lyricsPos.value.x,
    y: clientY - lyricsPos.value.y
  }
  
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  if (e.type === 'touchmove') {
     e.preventDefault() 
  }
  
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  
  lyricsPos.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y
  }
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
  
  localStorage.setItem('lyrics-position', JSON.stringify(lyricsPos.value))
}

const currentSong = computed(() => {
  return playlist.value[currentIndex.value] || null
})

// Fetch playlist from Meting API (mimicking the original behavior)
const fetchPlaylist = async () => {
  try {
    const res = await fetch('https://api.i-meto.com/meting/api?server=netease&type=playlist&id=7650673579')
    const data = await res.json()
    if (Array.isArray(data)) {
      playlist.value = data.map(item => ({
        name: item.title,
        artist: item.author,
        url: item.url,
        cover: item.pic,
        lrc: item.lrc
      }))
    }
  } catch (err) {
    console.error('Failed to fetch playlist:', err)
  }
}

// Parse LRC content
const parseLRC = (lrcContent) => {
  if (!lrcContent) return []
  const lines = lrcContent.split('\n')
  const result = []
  const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/
  
  for (const line of lines) {
    const match = timeExp.exec(line)
    if (match) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      const msStr = match[3] || '0'
      // .xx is 10ms, .xxx is 1ms
      const ms = msStr.length === 2 ? parseInt(msStr) * 10 : parseInt(msStr)
      const time = min * 60 + sec + ms / 1000
      const text = line.replace(timeExp, '').trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

// Fetch lyrics from URL
const fetchLyrics = async (url) => {
  lyrics.value = []
  currentLyric.value = ''
  nextLyric.value = ''
  lyricIndex.value = -1
  
  if (!url) return

  try {
    const res = await fetch(url)
    const text = await res.text()
    lyrics.value = parseLRC(text)
  } catch (err) {
    console.error('Failed to fetch lyrics:', err)
  }
}

// Watch current song to fetch lyrics
watch(currentSong, (newSong) => {
  if (newSong?.lrc) {
    fetchLyrics(newSong.lrc)
  } else {
    lyrics.value = []
    currentLyric.value = ''
    nextLyric.value = ''
    lyricIndex.value = -1
  }
}, { immediate: true })

const togglePlay = () => {
  if (!audioRef.value || !currentSong.value) return
  
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(e => console.error('Play error:', e))
  }
  isPlaying.value = !isPlaying.value
}

const playIndex = (index) => {
  if (index < 0 || index >= playlist.value.length) return
  currentIndex.value = index
  isPlaying.value = true
  // Wait for DOM update
  setTimeout(() => {
    if (audioRef.value) {
        audioRef.value.play().catch(e => console.error(e))
    }
  }, 50)
}

const next = () => {
  let nextIndex = currentIndex.value + 1
  if (nextIndex >= playlist.value.length) {
    nextIndex = 0 // Loop all
  }
  playIndex(nextIndex)
}

const prev = () => {
  let prevIndex = currentIndex.value - 1
  if (prevIndex < 0) {
    prevIndex = playlist.value.length - 1
  }
  playIndex(prevIndex)
}

const onEnded = () => {
  if (loopMode.value === 'one') {
    audioRef.value.currentTime = 0
    audioRef.value.play()
  } else {
    next()
  }
}

const onTimeUpdate = () => {
  if (!audioRef.value) return
  const { currentTime, duration } = audioRef.value
  if (duration) {
    progress.value = (currentTime / duration) * 100
  }

  // Update Lyrics
  if (lyrics.value.length > 0) {
    let activeIndex = -1
    for (let i = 0; i < lyrics.value.length; i++) {
      if (currentTime >= lyrics.value[i].time) {
        activeIndex = i
      } else {
        break
      }
    }
    
    if (activeIndex !== lyricIndex.value) {
      lyricIndex.value = activeIndex
      if (activeIndex !== -1) {
        currentLyric.value = lyrics.value[activeIndex].text
        // Set next lyric
        if (activeIndex + 1 < lyrics.value.length) {
          nextLyric.value = lyrics.value[activeIndex + 1].text
        } else {
          nextLyric.value = ''
        }
      } else {
        currentLyric.value = ''
        nextLyric.value = ''
      }
    }
  }
}

const seek = (e) => {
  if (!audioRef.value || !currentSong.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const width = rect.width
  const percent = Math.min(Math.max(x / width, 0), 1)
  
  const duration = audioRef.value.duration
  if (duration) {
    audioRef.value.currentTime = duration * percent
    progress.value = percent * 100
  }
}

const onCanPlay = () => {
  if (isPlaying.value && audioRef.value) {
    audioRef.value.play().catch(e => {})
  }
}

const onError = (e) => {
    console.error("Audio error", e);
    // Auto skip on error
    if (isPlaying.value) {
        setTimeout(next, 1000);
    }
}

const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value
}

const toggleLyrics = () => {
  showLyrics.value = !showLyrics.value
  localStorage.setItem('lyrics-visible', showLyrics.value)
}

const toggleMute = () => {
  if (volume.value > 0) {
    lastVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = lastVolume.value || 0.7
  }
}

watch(volume, (newVal) => {
  if (audioRef.value) {
    audioRef.value.volume = newVal
  }
})

// --- Context Menu & Settings ---
const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const lyricsSettings = ref({
  fontSize: 24,
  color: '#ffffff'
})

const initLyricsSettings = () => {
  const saved = localStorage.getItem('lyrics-settings')
  if (saved) {
    try {
      lyricsSettings.value = JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
  }
}

watch(lyricsSettings, (newSettings) => {
  localStorage.setItem('lyrics-settings', JSON.stringify(newSettings))
}, { deep: true })

const handleContextMenu = (e) => {
  contextMenuVisible.value = true
  // Adjust position
  let x = e.clientX
  let y = e.clientY
  
  // Boundary check
  if (x + 220 > window.innerWidth) x = window.innerWidth - 230
  if (y + 160 > window.innerHeight) y = window.innerHeight - 170
  
  contextMenuPos.value = { x, y }
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const handleClickOutside = (e) => {
  if (contextMenuVisible.value) {
     const menu = document.querySelector('.context-menu')
     if (menu && !menu.contains(e.target)) {
        contextMenuVisible.value = false
     }
  }
  
  if (showMoreMenu.value && moreMenuRef.value && !moreMenuRef.value.contains(e.target)) {
     showMoreMenu.value = false
  }
}

onMounted(() => {
  initLyricsPosition()
  initLyricsSettings()
  
  const savedLyricsVisible = localStorage.getItem('lyrics-visible')
  if (savedLyricsVisible !== null) {
    showLyrics.value = savedLyricsVisible === 'true'
  }

  fetchPlaylist()
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
  window.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
  window.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.music-player-wrapper {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Lyrics Display */
.lyrics-container {
  position: fixed;
  z-index: 9998;
  text-align: center;
  pointer-events: auto;
  max-width: 600px;
  width: fit-content;
  padding: 12px 24px;
  
  /* Glassmorphism */
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
}

.lyrics-container:active {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .lyrics-container {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .lyrics-container:active {
  background: rgba(0, 0, 0, 0.6);
}

@media screen and (max-width: 768px) {
  .lyrics-container {
    padding: 8px 16px;
  }
  
  .lyric-line.current {
    font-size: 16px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  }
  .lyric-line.next {
    font-size: 12px;
  }
}

.lyrics-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.lyric-line {
  display: block;
  font-weight: 600;
  color: var(--text-primary, #333);
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.8);
  opacity: 0.9;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.lyric-line.next {
  opacity: 0.6;
  font-weight: 500;
}

.lyrics-placeholder {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
}

[data-theme="dark"] .lyric-line {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Lyric Transition */
.lyric-fade-enter-active,
.lyric-fade-leave-active {
  transition: all 0.3s ease;
}

.lyric-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.lyric-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Widget Container */
.player-widget {
  display: flex;
  align-items: center;
  background: var(--bg-secondary, #fff);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color, #eee);
  border-radius: 999px;
  padding: 8px 12px 8px 8px; /* Adjusted padding */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 480px; /* Increased max-width */
  width: fit-content;
}

[data-theme="dark"] .player-widget {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  background: rgba(40, 40, 40, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Cover Art */
.cover-container {
  position: relative;
  cursor: pointer;
  margin-right: 12px;
  flex-shrink: 0;
}

.cover-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--border-light, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary, #fff);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s linear;
}

.cover-img.rotating {
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover-placeholder {
  color: var(--text-tertiary, #999);
}

/* Content Area */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* Text truncation fix */
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.song-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 12px;
}

.song-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.song-artist {
  font-size: 11px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-control-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider-container {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding-bottom: 10px; /* Gap bridge */
  z-index: 100;
}

.volume-track {
  background: var(--bg-secondary, #fff);
  padding: 0;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  width: 36px;
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .volume-track {
  background: rgba(40, 40, 40, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Vertical Slider using Transform */
.volume-slider-vertical {
  width: 100px; /* Height of the slider area */
  height: 36px; /* Width of the slider area */
  transform: rotate(-90deg);
  background: transparent;
  cursor: pointer;
  appearance: none;
  outline: none;
}

.volume-bar {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  background: var(--text-primary, #333);
  border-radius: 2px;
  pointer-events: none;
  z-index: 1;
}

/* Track background line */
.volume-track::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  background: rgba(128, 128, 128, 0.2);
  border-radius: 2px;
}

/* Slider Thumb Styling */
.volume-slider-vertical::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--text-primary, #333);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-top: 12px; /* Center thumb vertically: (36px - 12px) / 2 */
  position: relative;
  z-index: 2;
}

.volume-slider-vertical::-webkit-slider-runnable-track {
  width: 100%;
  height: 36px;
  background: transparent;
  border: none;
}

/* More Menu Styles */
.more-control-wrapper {
  position: relative;
}

.more-menu-popup {
  position: absolute;
  bottom: 140%;
  right: 0;
  width: 180px;
  background: var(--bg-secondary, #fff);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color, #eee);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  padding: 6px;
  z-index: 100;
  overflow: hidden;
}

[data-theme="dark"] .more-menu-popup {
  background: rgba(40, 40, 40, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.more-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary, #333);
}

.more-menu-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.menu-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  color: var(--text-secondary, #666);
}

.menu-text {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
}

/* Toggle Switch Style */
.menu-toggle {
  width: 32px;
  height: 18px;
  background: rgba(128, 128, 128, 0.2);
  border-radius: 999px;
  position: relative;
  transition: all 0.3s;
}

.menu-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.3s;
}

.menu-toggle.active {
  background: var(--text-primary, #333);
}

.menu-toggle.active::after {
  transform: translateX(14px);
}

[data-theme="dark"] .menu-toggle.active {
  background: #fff;
}

[data-theme="dark"] .menu-toggle.active::after {
  background: #000;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #666);
  padding: 8px; /* Increased padding */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 32px; /* Fixed width */
  height: 32px; /* Fixed height */
}

.icon-btn svg {
  width: 18px; /* Slightly larger icons */
  height: 18px;
}

.icon-btn:hover {
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-primary, #000);
}

.icon-btn.active {
  color: var(--link-color, #000);
  background: rgba(128, 128, 128, 0.15);
}

/* Progress Bar */
.progress-container {
  height: 4px;
  width: 100%;
  cursor: pointer;
  padding: 2px 0; /* Increase hit area */
}

.progress-bg {
  height: 3px;
  background: var(--border-color, #eee);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--link-color, #000);
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* Playlist Panel */
.playlist-panel {
  position: absolute;
  bottom: 60px;
  left: 0;
  width: 280px;
  max-height: 400px;
  background: var(--bg-secondary, #fff);
  border: 1px solid var(--border-color, #eee);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

[data-theme="dark"] .playlist-panel {
  background: rgba(35, 35, 35, 0.95);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.1);
}

.playlist-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #f5f5f5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.playlist-items {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.playlist-items::-webkit-scrollbar {
  width: 4px;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.playlist-items li {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid transparent; /* Prevent jump */
}

.playlist-items li:hover {
  background: rgba(128, 128, 128, 0.05);
}

.playlist-items li.active {
  background: rgba(128, 128, 128, 0.1);
}

.item-index {
  width: 24px;
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
}

.active .item-index {
  color: var(--link-color);
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
/* Context Menu */
.context-menu {
  position: fixed;
  z-index: 10000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 12px;
  min-width: 200px;
  color: #333;
  transform-origin: top left;
}

[data-theme="dark"] .context-menu {
  background: rgba(30, 30, 30, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.menu-header {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .menu-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.menu-item:last-child {
  margin-bottom: 0;
}

.menu-item label {
  font-size: 13px;
  font-weight: 500;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value {
  font-size: 12px;
  color: #666;
  width: 32px;
  text-align: right;
}

[data-theme="dark"] .value {
  color: #aaa;
}

/* Range Input */
input[type="range"] {
  width: 80px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  appearance: none;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--link-color, #333);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
  margin-top: -4px;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Color Input */
input[type="color"] {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 50%;
}
</style>